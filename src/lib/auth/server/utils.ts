import { createHash } from "node:crypto";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";

export function generateRandomOTP(): string {
	const bytes = new Uint8Array(5);
	crypto.getRandomValues(bytes);
	const code = encodeBase32UpperCaseNoPadding(bytes);
	return code;
}

export function generateRandomRecoveryCode(): string {
	const recoveryCodeBytes = new Uint8Array(10);
	crypto.getRandomValues(recoveryCodeBytes);
	const recoveryCode = encodeBase32UpperCaseNoPadding(recoveryCodeBytes);
	return recoveryCode;
}

export function hashUserId(userId: string) {
	const bufferedUserId = Buffer.from(userId, "utf-8");
	const hashBuffer = createHash("sha256").update(bufferedUserId).digest();

	const osloIdBuffer = hashBuffer.subarray(0, 8);
	return osloIdBuffer.readBigUInt64BE(0);
}
