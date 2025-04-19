import { database } from "@/database";
import {
	passkeyCredentials,
	securityKeyCredentials,
	sessions,
	totpCredentials,
	users,
} from "@/database/drizzle";
import { eq } from "drizzle-orm";
import { decryptToString, encryptString } from "./encryption";
import { ExpiringTokenBucket } from "./rate-limit";
import { generateRandomRecoveryCode } from "./utils";

export const recoveryCodeBucket = new ExpiringTokenBucket<string>(3, 60 * 60);

export const getAllUser2FA = async (userId: string) => {
	const data = await database.query.users.findFirst({
		where: (table, { eq }) => eq(table.id, userId),
		columns: {
			registeredTOTP: true,
			registeredPasskey: true,
			registeredRecoveryCode: true,
			registeredSecurityKey: true,
		},
	});

	if (!data) {
		return {};
	}

	const twoFactorArray = Object.keys(data).filter((item) => item !== null); // Filter out null values
	return twoFactorArray;
};

export async function resetUser2FAWithRecoveryCode(
	userId: string,
	recoveryCode: string,
): Promise<boolean> {
	const row = await database.query.users.findFirst({
		where: (table, { eq }) => eq(table.id, userId),
		columns: {
			recoveryCode: true,
		},
	});
	if (!row || row.recoveryCode === null) {
		return false;
	}
	const encryptedRecoveryCode = row.recoveryCode;
	const userRecoveryCode = decryptToString(encryptedRecoveryCode);
	if (recoveryCode !== userRecoveryCode) {
		return false;
	}

	const newRecoveryCode = generateRandomRecoveryCode();
	const encryptedNewRecoveryCode = encryptString(newRecoveryCode);

	try {
		await database.transaction(async (drizzle) => {
			const result = await drizzle
				.update(users)
				.set({
					recoveryCode: encryptedNewRecoveryCode,
				})
				.where(eq(users.recoveryCode, encryptedRecoveryCode));

			if (!result) {
				throw new Error('Can"t update recovery code');
			}

			await drizzle
				.update(sessions)
				.set({
					twoFactorVerified: false,
				})
				.where(eq(sessions.userId, userId));

			await drizzle
				.delete(totpCredentials)
				.where(eq(totpCredentials.userId, userId));

			await drizzle
				.delete(passkeyCredentials)
				.where(eq(passkeyCredentials.userId, userId));

			await database
				.delete(securityKeyCredentials)
				.where(eq(securityKeyCredentials.userId, userId));
		});
	} catch (e) {
		if (e) {
			throw e;
		}
	}
	return true;
}

export function get2FARedirect(user: typeof users.$inferSelect): string {
	if (user.registeredPasskey) {
		return "/auth/twoFactor/passkey";
	}
	if (user.registeredSecurityKey) {
		return "/auth/twoFactor/security-key";
	}
	if (user.registeredTOTP) {
		return "/auth/twoFactor/totp";
	}
	return "/auth/twoFactor/setup";
}

export function getPasswordReset2FARedirect(
	user: typeof users.$inferSelect,
): string {
	if (user.registeredPasskey) {
		return "/reset-password/2fa/passkey";
	}
	if (user.registeredSecurityKey) {
		return "/reset-password/2fa/security-key";
	}
	if (user.registeredTOTP) {
		return "/reset-password/2fa/totp";
	}
	return "/2fa/setup";
}
