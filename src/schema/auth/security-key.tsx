import { type } from "arktype";

export const createSecurityKeySchema = type({
	name: "string",
	encodedAttestationObject: "string",
	encodedClientDataJSON: "string",
});

export type createSecurityKeyType = typeof createSecurityKeySchema.infer;

export const verifySecurityKeySchema = type({
	encodedSignature: "string",
	encodedClientDataJSON: "string",
	encodedCredentialId: "string",
	encodedAuthenticatorData: "string",
});

export type verifySecurityKeyType = typeof verifySecurityKeySchema.infer;
