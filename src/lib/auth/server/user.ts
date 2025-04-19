import { database as db } from "@/database";
import { users } from "@/database/drizzle";
import { and, eq } from "drizzle-orm";
import { decryptToString, encryptString } from "./encryption";
import { hashPassword } from "./password";
import { generateRandomRecoveryCode } from "./utils";

const validNamePattern = /^[A-Za-z\s]+$/;

export function validateFullname(fullname: string): boolean {
	// Check if fullname is a string
	if (typeof fullname !== "string") {
		return false;
	}

	// Trim whitespace
	const trimmedFullname = fullname.trim();

	// Check length constraints
	if (trimmedFullname.length < 3 || trimmedFullname.length > 50) {
		return false;
	}

	console.log(trimmedFullname);

	// Check for valid characters (only letters and spaces)
	if (!validNamePattern.test(trimmedFullname)) {
		return false;
	}

	return true; // Valid fullname
}

export async function createUser(
	email: string,
	firstname: string,
	lastname: string,
	password: string,
) {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);

	const [user] = await db
		.insert(users)
		.values({
			email,
			firstname,
			lastname,
			passWordHash: passwordHash,
			recoveryCode: encryptedRecoveryCode,
			registeredRecoveryCode: true,
		})
		.returning();
	if (user === null) {
		throw new Error("Unexpected error");
	}

	return user;
}

export async function updateUserPassword(
	userId: string,
	password: string,
): Promise<Promise<void>> {
	const passwordHash = await hashPassword(password);
	await db
		.update(users)
		.set({
			passWordHash: passwordHash,
		})
		.where(eq(users.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(
	userId: string,
	email: string,
): Promise<void> {
	await db
		.update(users)
		.set({
			emailVerified: true,
			email,
		})
		.where(eq(users.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(
	userId: string,
	email: string,
): Promise<boolean> {
	const result = await db
		.update(users)
		.set({
			emailVerified: true,
		})
		.where(and(eq(users.id, userId), eq(users.email, email)));

	return !!result;
}

export async function getUserPasswordHash(userId: string): Promise<string> {
	const row = await db.query.users.findFirst({
		where: (table, { eq }) => eq(table.id, userId),
		columns: {
			passWordHash: true,
		},
	});
	if (!row) {
		throw new Error("Invalid user ID");
	}
	return row.passWordHash;
}

export async function getUserRecoverCode(userId: string): Promise<string> {
	const row = await db.query.users.findFirst({
		where: (table, { eq }) => eq(table.id, userId),
		columns: {
			recoveryCode: true,
		},
	});

	if (row?.recoveryCode === null || !row) {
		throw new Error("Invalid user ID");
	}
	return decryptToString(row.recoveryCode);
}

export async function resetUserRecoveryCode(userId: string): Promise<string> {
	const recoveryCode = generateRandomRecoveryCode();
	const encrypted = encryptString(recoveryCode);
	await db
		.update(users)
		.set({
			recoveryCode: encrypted,
		})
		.where(eq(users.id, userId));

	return recoveryCode;
}

export async function getUserFromEmail(email: string) {
	const user = await db.query.users.findFirst({
		where: (table, { eq }) => eq(table.email, email),
		with: {
			TotpCredential: true,
			PasskeyCredential: true,
			SecurityKeyCredential: true,
		},
	});
	if (!user) {
		return null;
	}

	if (
		user.registeredPasskey ||
		user.registeredSecurityKey ||
		user.registeredTOTP
	) {
		user.registered2FA = true;
	}
	return user;
}
