import { type } from "arktype";

export const createPasskeySchema = type({
	name: "string",
	encodedAttestationObject: "string",
	encodedClientDataJSON: "string",
});

export type createPasskeyType = typeof createPasskeySchema.infer;
