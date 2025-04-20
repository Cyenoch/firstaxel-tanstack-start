"use server";

import { database } from "@/database";
import { users } from "@/database/drizzle";
import { RefillingTokenBucket } from "@/lib/auth/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import {
	getCurrentSession,
	setSessionAs2FAVerified,
} from "@/lib/auth/server/session";
import {
	getUserTOTPKey,
	totpBucket,
	updateUserTOTPKey,
} from "@/lib/auth/server/totp";
import type { createTOTPType, verifyTOTPType } from "@/schema/auth/totp";
import { decodeBase64 } from "@oslojs/encoding";
import { verifyTOTPWithGracePeriod } from "@oslojs/otp";
import { createError } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

const totpUpdateBucket = new RefillingTokenBucket<string>(3, 60 * 10);

export async function setup2FAAction(data: createTOTPType) {
	if (!globalPOSTRateLimit()) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}

	const { session, user } = await getCurrentSession();
	if (session === null) {
		throw createError({
			statusCode: 401,
			message: "Unauthorized",
		});
	}
	if (!user.emailVerified) {
		throw createError({
			status: 403,
			message: "Forbidden",
		});
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		throw createError({
			status: 403,
			message: "Forbidden",
		});
	}
	if (!totpUpdateBucket.check(user.id, 1)) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}

	const encodedKey = data.encodedTOTPKey;
	const code = data.code;
	if (typeof encodedKey !== "string" || typeof code !== "string") {
		throw createError({
			statusCode: 400,
			message: "Invalid or missing fields",
		});
	}
	if (code === "") {
		throw createError({
			statusCode: 400,
			message: "Please enter your code",
		});
	}
	if (encodedKey.length !== 28) {
		throw createError({
			statusCode: 400,
			message: "Invalid key",
		});
	}
	let key: Uint8Array;
	try {
		key = decodeBase64(encodedKey);
	} catch {
		throw createError({
			statusCode: 400,
			message: "Invalid key",
		});
	}
	if (key.byteLength !== 20) {
		throw createError({
			statusCode: 400,
			message: "Invalid key",
		});
	}
	if (!totpUpdateBucket.consume(user.id, 1)) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}
	if (!verifyTOTPWithGracePeriod(key, 30, 6, code, 10)) {
		throw createError({
			statusCode: 400,
			message: "Invalid code",
		});
	}
	updateUserTOTPKey(session.userId, key);
	setSessionAs2FAVerified(session.id, true);
	if (!user.registered2FA) {
		await database
			.update(users)
			.set({
				registered2FA: true,
				registeredPasskey: true,
			})
			.where(eq(users.id, user.id));
	}

	return {
		message: "TOTP creation successful",
		redirectUrl: "/",
	};
}

export async function verify2FAAction(data: verifyTOTPType) {
	if (!globalPOSTRateLimit()) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}

	const { session, user } = await getCurrentSession();
	if (session === null) {
		throw createError({
			statusCode: 401,
			message: "Unauthorized",
		});
	}
	if (
		!user.emailVerified ||
		!user.registeredTOTP ||
		session.twoFactorVerified
	) {
		throw createError({
			statusCode: 403,
			message: "Forbidden",
		});
	}
	if (!totpBucket.check(user.id, 1)) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}

	const code = data.code;
	if (typeof code !== "string") {
		throw createError({
			statusCode: 400,
			message: "Invalid or missing fields",
		});
	}
	if (code === "") {
		throw createError({
			statusCode: 400,
			message: "Enter your code",
		});
	}
	if (!totpBucket.consume(user.id, 1)) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}
	const totpKey = await getUserTOTPKey(user.id);
	if (totpKey === null) {
		throw createError({
			statusCode: 403,
			message: "Forbidden",
		});
	}
	if (!verifyTOTPWithGracePeriod(totpKey, 30, 6, code, 10)) {
		throw createError({
			statusCode: 400,
			message: "Invalid code",
		});
	}
	totpBucket.reset(user.id);
	setSessionAs2FAVerified(session.id, true);
	return {
		message: "TOTP verification successful",
		redirectUrl: "/",
	};
}
