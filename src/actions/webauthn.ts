import { RefillingTokenBucket } from "@/lib/auth/server/rate-limit";
import { createWebAuthnChallenge } from "@/lib/auth/server/webauthn";
import { encodeBase64 } from "@oslojs/encoding";
import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";

const webauthnChallengeRateLimitBucket = new RefillingTokenBucket<string>(
	30,
	10,
);

export const createWebAuthnChallengeServer = createServerFn().handler(
	async () => {
		return createWebAuthnChallengeAction();
	},
);

export async function createWebAuthnChallengeAction(): Promise<string> {
	const clientIP = getHeader("X-Forwarded-For");
	if (
		clientIP !== null &&
		!webauthnChallengeRateLimitBucket.consume(clientIP as string, 1)
	) {
		throw new Error("Too many requests");
	}
	const challenge = createWebAuthnChallenge();
	return encodeBase64(challenge);
}
