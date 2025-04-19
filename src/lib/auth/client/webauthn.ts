import { createWebAuthnChallengeServer } from "@/actions/webauthn";
import { decodeBase64 } from "@oslojs/encoding";

export async function createChallenge(): Promise<Uint8Array> {
	const encoded = await createWebAuthnChallengeServer();
	return decodeBase64(encoded);
}
