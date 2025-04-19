import { database } from "@/database";
import { emailVerificationRequests } from "@/database/drizzle";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
import { setCookie } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { ExpiringTokenBucket } from "./rate-limit";
import { getCurrentSession } from "./session";
import { generateRandomOTP } from "./utils";

export async function getUserEmailVerificationRequest(userId: string) {
	const row = await database.query.emailVerificationRequests.findFirst({
		where: (table, { eq }) => eq(table.userId, userId),
	});
	if (row === null) {
		return row;
	}

	return row;
}

export async function createEmailVerificationRequest(
	userId: string,
	email: string,
): Promise<EmailVerificationRequest> {
	deleteUserEmailVerificationRequest(userId);
	const idBytes = new Uint8Array(20);
	crypto.getRandomValues(idBytes);
	const id = encodeBase32LowerCaseNoPadding(idBytes);

	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

	await database.insert(emailVerificationRequests).values({
		id,
		userId,
		code,
		email,
		expiresAt: expiresAt,
	});

	const request: EmailVerificationRequest = {
		id,
		userId,
		code,
		email,
		expiresAt,
	};
	return request;
}

export async function deleteUserEmailVerificationRequest(
	userId: string,
): Promise<void> {
	await database.transaction(async (db) => {
		const result = await db.query.emailVerificationRequests.findFirst({
			where: (table, { eq }) => eq(table.userId, userId),
		});

		if (result) {
			await db
				.delete(emailVerificationRequests)
				.where(eq(emailVerificationRequests.id, result.id));
		}

		return;
	});
}

export function sendVerificationEmail(email: string, code: string): void {
	console.info(`To ${email}: Your verification code is ${code}`);
}

export async function setEmailVerificationRequestCookie(
	request: EmailVerificationRequest,
): Promise<void> {
	setCookie("email_verification", request.id, {
		expires: request.expiresAt,
	});
}

export async function deleteEmailVerificationRequestCookie(): Promise<void> {
	setCookie("email_verification", "");
}

export const getCurrentUserEmailVerificationRequest = async (
	emailVerificationId: string,
) => {
	const { user } = await getCurrentSession();
	if (user === null) {
		return null;
	}
	const id = emailVerificationId;
	if (id === null) {
		return null;
	}
	const request = getUserEmailVerificationRequest(user.id);
	if (request === null) {
		deleteEmailVerificationRequestCookie();
	}
	return request;
};

export const sendVerificationEmailBucket = new ExpiringTokenBucket<string>(
	3,
	60 * 10,
);

export interface EmailVerificationRequest {
	id: string;
	userId: string;
	code: string;
	email: string;
	expiresAt: Date;
}
