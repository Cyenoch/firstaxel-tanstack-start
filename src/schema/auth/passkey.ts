import { type } from "arktype";

export const createPasskeySchema = type({
	name: "string",
	encodedAttestationObject: "string",
	encodedClientDataJSON: "string",
});

export type createPasskeyType = typeof createPasskeySchema.infer;

export const verifyPasskeySchema = type({
	encodedSignature: "string",
	encodedClientDataJSON: "string",
	encodedCredentialId: "string",
	encodedAuthenticatorData: "string",
});

export type verifyPasskeyType = typeof verifyPasskeySchema.infer;
