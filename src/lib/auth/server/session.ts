import { database as db } from "@/database";
import { sessions, type users } from "@/database/drizzle";
import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { serverOnly } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

export async function validateSessionToken(
	token: string,
): Promise<SessionValidationResult> {
	const row = await db.query.sessions.findFirst({
		where: (table, { eq }) => eq(table.id, token),
		with: {
			User: {
				with: {
					TotpCredential: true,
					PasskeyCredential: true,
					SecurityKeyCredential: true,
				},
			},
		},
	});

	if (!row) {
		return { session: null, user: null };
	}
	const session: Session = {
		id: row.id,
		userId: row.userId,
		expiresAt: new Date(row.expiresAt),
		twoFactorVerified: Boolean(row.twoFactorVerified),
	};
	const user = row.User;
	if (
		user.registeredPasskey ||
		user.registeredSecurityKey ||
		user.registeredTOTP
	) {
		user.registered2FA = true;
	}
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		deleteSessionTokenCookie();
		return { session: null, user: null };
	}
	if (user === null) {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

		await db
			.update(sessions)
			.set({
				expiresAt: session.expiresAt,
			})
			.where(eq(sessions.id, session.id));
	}
	return { session, user };
}

export const getCurrentSession = serverOnly(async (): Promise<SessionValidationResult> => {
	const token = getCookie("session");

	if (!token) {
		return { session: null, user: null };
	}
	const result = await validateSessionToken(token as string);
	return result;
});

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes);
	return token;
}

export async function createSession(
	token: string,
	userId: string,
	flags: SessionFlags,
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		twoFactorVerified: flags.twoFactorVerified,
	};

	await db.insert(sessions).values({
		id: sessionId,
		userId,
		expiresAt: session.expiresAt,
		twoFactorVerified: session.twoFactorVerified,
	});
	return session;
}

export async function setSessionAs2FAVerified(
	sessionId: string,
	verified: boolean,
): Promise<void> {
	await db
		.update(sessions)
		.set({
			twoFactorVerified: verified,
		})
		.where(eq(sessions.id, sessionId));
}

export const setSessionTokenCookie = serverOnly((
	token: string,
	expiresAt: Date,
) => {
	setCookie("session", token, {
		expires: expiresAt,
	});
})

export const deleteSessionTokenCookie = serverOnly(() => {
	deleteCookie("session");
})

export interface SessionFlags {
	twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
	id: string;
	expiresAt: Date;
	userId: string;
}

type User = typeof users.$inferSelect;

type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
