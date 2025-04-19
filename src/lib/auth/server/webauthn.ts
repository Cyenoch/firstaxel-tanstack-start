import { database } from "@/database";
import { passkeyCredentials, securityKeyCredentials } from "@/database/drizzle";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { DrizzleError, and, eq } from "drizzle-orm";

const challengeBucket = new Set<string>();

export function createWebAuthnChallenge(): Uint8Array {
	const challenge = new Uint8Array(20);
	crypto.getRandomValues(challenge);
	const encoded = encodeHexLowerCase(challenge);
	challengeBucket.add(encoded);
	return challenge;
}

export function verifyWebAuthnChallenge(challenge: Uint8Array): boolean {
	const encoded = encodeHexLowerCase(challenge);
	return challengeBucket.delete(encoded);
}

export async function getUserPasskeyCredentials(userId: string) {
	const credentials = await database.query.passkeyCredentials.findMany({
		where: (table, { eq }) => eq(table.userId, userId),
	});

	return credentials;
}

export async function getPasskeyCredential(
	credentialId: Uint8Array<ArrayBufferLike>,
): Promise<WebAuthnUserCredential | null> {
	const credential = await database.query.passkeyCredentials.findFirst({
		where: (table, { eq }) => eq(table.id, credentialId),
	});
	if (!credential) {
		return null;
	}

	return credential;
}

export async function getUserPasskeyCredential(
	userId: string,
	credentialId: Uint8Array<ArrayBufferLike>,
): Promise<WebAuthnUserCredential | null> {
	const credential = await database.query.passkeyCredentials.findFirst({
		where: (table, { eq, and }) =>
			and(eq(table.id, credentialId), eq(table.userId, userId)),
	});
	if (!credential) {
		return null;
	}

	return credential;
}

export async function createPasskeyCredential(
	credential: WebAuthnUserCredential,
): Promise<void> {
	try {
		await database.insert(passkeyCredentials).values(credential);
	} catch (error) {
		if (error instanceof DrizzleError) {
			throw new Error("Internal server error");
		}
	}
}

export async function deleteUserPasskeyCredential(
	userId: string,
	credentialId: Uint8Array<ArrayBufferLike>,
): Promise<boolean> {
	const result = await database
		.delete(passkeyCredentials)
		.where(
			and(
				eq(passkeyCredentials.id, credentialId),
				eq(passkeyCredentials.userId, userId),
			),
		)
		.returning();
	return !!result;
}

export async function getUserSecurityKeyCredentials(
	userId: string,
): Promise<WebAuthnUserCredential[]> {
	const credentials = await database.query.securityKeyCredentials.findMany({
		where: (table, { eq }) => eq(table.userId, userId),
	});

	return credentials;
}

export async function getUserSecurityKeyCredential(
	userId: string,
	credentialId: Uint8Array<ArrayBufferLike>,
): Promise<WebAuthnUserCredential | null> {
	const credential = await database.query.securityKeyCredentials.findFirst({
		where: (table, { eq, and }) =>
			and(eq(table.userId, userId), eq(table.id, credentialId)),
	});

	if (!credential) {
		return null;
	}

	return credential;
}

export async function createSecurityKeyCredential(
	credential: WebAuthnUserCredential,
): Promise<void> {
	await database.insert(securityKeyCredentials).values(credential);
}

export async function deleteUserSecurityKeyCredential(
	userId: string,
	credentialId: Uint8Array<ArrayBufferLike>,
): Promise<boolean> {
	const result = await database
		.delete(securityKeyCredentials)
		.where(
			and(
				eq(securityKeyCredentials.id, credentialId),
				eq(securityKeyCredentials.userId, userId),
			),
		)
		.returning();
	return !!result;
}

export interface WebAuthnUserCredential {
	id: Uint8Array<ArrayBufferLike>;
	userId: string;
	name: string;
	algorithm: number;
	publicKey: Uint8Array;
}
