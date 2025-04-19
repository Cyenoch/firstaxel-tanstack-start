import { database } from "@/database";
import { totpCredentials } from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { decrypt, encrypt } from "./encryption";
import { ExpiringTokenBucket, RefillingTokenBucket } from "./rate-limit";

export const totpBucket = new ExpiringTokenBucket<string>(5, 60 * 30);
export const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export async function getUserTOTPKey(
	userId: string,
): Promise<Uint8Array | null> {
	const row = await database.query.totpCredentials.findFirst({
		where: (table, { eq }) => eq(table.userId, userId),
	});
	if (!row) {
		throw new Error("Invalid user ID");
	}
	const encrypted = row.key;
	if (encrypted === null) {
		return null;
	}
	return decrypt(encrypted);
}

export async function updateUserTOTPKey(
	userId: string,
	key: Uint8Array,
): Promise<void> {
	const encrypted = encrypt(key);
	await database.transaction(async (prisma) => {
		const totpCredential = await prisma.query.totpCredentials.findFirst({
			where: (table, { eq }) => eq(table.userId, userId),
		});

		if (!totpCredential || totpCredential === null) {
			throw new Error("We couldnt find your totp credentials");
		}
		await prisma.insert(totpCredentials).values({
			userId,
			key: encrypted,
		});
	});
}

export async function deleteUserTOTPKey(userId: string): Promise<void> {
	await database
		.delete(totpCredentials)
		.where(eq(totpCredentials.userId, userId));
}
