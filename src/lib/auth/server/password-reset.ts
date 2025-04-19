import { database } from "@/database";

import { passwordResetSessions, type users } from "@/database/drizzle";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { setCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { generateRandomOTP } from "./utils";

type User = typeof users.$inferSelect;

export async function createPasswordResetSession(
	token: string,
	userId: string,
	email: string,
): Promise<PasswordResetSession> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: PasswordResetSession = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10),
		code: generateRandomOTP(),
		emailVerified: false,
		twoFactorVerified: false,
	};

	await database.insert(passwordResetSessions).values({
		id: sessionId,
		userId,
		email,
		expiresAt: session.expiresAt,
		code: session.code,
		emailVerified: session.emailVerified,
		twoFactorVerified: session.twoFactorVerified,
	});

	return session;
}

export async function validatePasswordResetSessionToken(
	token: string,
): Promise<PasswordResetSessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const row = await database.query.passwordResetSessions.findFirst({
		where: (table, { eq }) => eq(table.id, sessionId),
		with: {
			User: {
				with: {
					PasswordResetSession: true,
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
	const session: PasswordResetSession = {
		id: row.id,
		userId: row.userId,
		email: row.email,
		code: row.code,
		expiresAt: new Date(row.expiresAt),
		emailVerified: Boolean(row.emailVerified),
		twoFactorVerified: Boolean(row.twoFactorVerified),
	};
	const user: User = row.User;
	if (
		user.registeredPasskey ||
		user.registeredSecurityKey ||
		user.registeredTOTP
	) {
		user.registered2FA = true;
	}
	if (Date.now() >= session.expiresAt.getTime()) {
		await database
			.delete(passwordResetSessions)
			.where(eq(passwordResetSessions.id, session.id));
		return { session: null, user: null };
	}
	return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(
	sessionId: string,
	verified = true,
): Promise<void> {
	await database
		.update(passwordResetSessions)
		.set({
			emailVerified: verified,
		})
		.where(eq(passwordResetSessions.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(
	sessionId: string,
	verified = true,
): Promise<void> {
	await database
		.update(passwordResetSessions)
		.set({
			twoFactorVerified: verified,
		})
		.where(eq(passwordResetSessions.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(
	userId: string,
): Promise<void> {
	const result = await database.query.passwordResetSessions.findFirst({
		where: (table, { eq }) => eq(table.userId, userId),
	});

	if (result) {
		await database
			.delete(passwordResetSessions)
			.where(eq(passwordResetSessions.id, result.id));
	}

	return;
}

export const getCurrentPasswordResetSession = cache(
	async (passwordResetSession: string) => {
		const token = passwordResetSession;
		if (token === null) {
			return { session: null, user: null };
		}
		const result = await validatePasswordResetSessionToken(token);

		return result;
	},
);

export async function setPasswordResetSessionTokenCookie(
	token: string,
	expiresAt: Date,
): Promise<void> {
	setCookie("password_reset_session", token, { expires: expiresAt });
}

export async function deletePasswordResetSessionTokenCookie(): Promise<void> {
	setCookie("password_reset_session", "");
}

export function sendPasswordResetEmail(email: string, code: string): void {
	console.info(`To ${email}: Your reset code is ${code}`);
}

export interface PasswordResetSession {
	id: string;
	userId: string;
	email: string;
	expiresAt: Date;
	code: string;
	emailVerified: boolean;
	twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
	| { session: PasswordResetSession; user: User }
	| { session: null; user: null };
