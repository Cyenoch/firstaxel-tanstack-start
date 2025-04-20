import { createWebAuthnChallengeServer } from "@/actions/webauthn";

export async function createChallenge() {
	const encoded = await createWebAuthnChallengeServer();
	return encoded;
}
