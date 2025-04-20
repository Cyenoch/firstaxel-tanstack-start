import { type } from "arktype";

export const createTOTPSchema = type({
	code: "string",
	encodedTOTPKey: "string",
});

export const verifyTOTPSchema = type({
	code: "string",
});

export type verifyTOTPType = typeof verifyTOTPSchema.infer;
export type createTOTPType = typeof createTOTPSchema.infer;
