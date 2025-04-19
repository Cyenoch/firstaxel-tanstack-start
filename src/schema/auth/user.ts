import { type } from "arktype";

export const createUser = type({
	firstname: "string",
	lastname: "string",

	email: "string.email",
	password: "string",
});

export const loginUser = type({
	email: "string.email",
	password: "string",
});

export const passKeyData = type({
	encodedAuthenticatorData: "string",
	encodedClientDataJSON: "string",
	encodedCredentialId: "string",
	encodedSignature: "string",
});

export const verifyUser = type({
	code: "string",
});
export const forgotPassword = type({
	email: "string.email",
});

export const resetPassword = type({
	password: "string",
});

export const resetTwoFactor = type({
	code: "string",
});

export type passKeyDataType = typeof passKeyData.infer;
export type loginUserType = typeof loginUser.infer;
export type createUserType = typeof createUser.infer;
export type verifyUserType = typeof verifyUser.infer;
export type forgotPasswordType = typeof forgotPassword.infer;
export type resetPasswordType = typeof resetPassword.infer;

export type resetTwoFactorType = typeof resetTwoFactor.infer;
