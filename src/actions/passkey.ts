import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import {
	getCurrentSession,
	setSessionAs2FAVerified,
} from "@/lib/auth/server/session";
import {
	type WebAuthnUserCredential,
	createPasskeyCredential,
	getUserPasskeyCredentials,
	verifyWebAuthnChallenge,
} from "@/lib/auth/server/webauthn";
import { ECDSAPublicKey, p256 } from "@oslojs/crypto/ecdsa";
import { RSAPublicKey } from "@oslojs/crypto/rsa";
import { decodeBase64 } from "@oslojs/encoding";
import {
	AttestationStatementFormat,
	ClientDataType,
	coseAlgorithmES256,
	coseAlgorithmRS256,
	coseEllipticCurveP256,
	parseAttestationObject,
	parseClientDataJSON,
} from "@oslojs/webauthn";

import { database } from "@/database";
import { users } from "@/database/drizzle";
import type { createPasskeyType } from "@/schema/auth/passkey";
import type {
	AttestationStatement,
	AuthenticatorData,
	COSEEC2PublicKey,
	COSERSAPublicKey,
	ClientData,
} from "@oslojs/webauthn";
import { createError } from "@tanstack/react-start/server";
import { DrizzleError, eq } from "drizzle-orm";

export async function registerPasskeyAction(data: createPasskeyType) {
	if (!globalPOSTRateLimit()) {
		throw createError({
			status: 429,
			message: "Too many requests",
		});
	}

	const { session, user } = await getCurrentSession();
	if (session === null || user === null) {
		throw createError({
			status: 401,
			message: "Not authenticated",
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

	const name = data.name;
	const encodedAttestationObject = data.encodedAttestationObject;
	const encodedClientDataJSON = data.encodedClientDataJSON;
	if (
		typeof name !== "string" ||
		typeof encodedAttestationObject !== "string" ||
		typeof encodedClientDataJSON !== "string"
	) {
		throw createError({
			status: 422,
			message: "Invalid or missing fields",
		});
	}

	let attestationObjectBytes: Uint8Array;
	let clientDataJSON: Uint8Array;
	try {
		attestationObjectBytes = decodeBase64(encodedAttestationObject);
		clientDataJSON = decodeBase64(encodedClientDataJSON);
	} catch {
		throw createError({
			status: 422,
			message: "Invalid or missing fields",
		});
	}

	let attestationStatement: AttestationStatement;
	let authenticatorData: AuthenticatorData;
	try {
		const attestationObject = parseAttestationObject(attestationObjectBytes);
		attestationStatement = attestationObject.attestationStatement;
		authenticatorData = attestationObject.authenticatorData;
	} catch (e) {
		throw createError({
			status: 422,
			message: "Invalid attestion object",
		});
	}
	if (attestationStatement.format !== AttestationStatementFormat.None) {
		throw createError({
			status: 422,
			message: "Invalid attestion statement",
		});
	}

	// TODO: Update host
	if (!authenticatorData.verifyRelyingPartyIdHash("localhost")) {
		throw createError({
			status: 422,
			message: "Invalid authenticator data",
		});
	}
	if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
		throw createError({
			status: 422,
			message: "Invalid authenticator data",
		});
	}
	if (authenticatorData.credential === null) {
		throw createError({
			status: 422,
			message: "Invalid authenticator data",
		});
	}

	let clientData: ClientData;
	try {
		clientData = parseClientDataJSON(clientDataJSON);
	} catch {
		throw createError({
			status: 422,
			message: "Invalid client Data",
		});
	}
	if (clientData.type !== ClientDataType.Create) {
		throw createError({
			status: 422,
			message: "Invalid client data type",
		});
	}

	if (!verifyWebAuthnChallenge(clientData.challenge)) {
		throw createError({
			status: 422,
			message: "Invalid client data challenge",
		});
	}
	// TODO: Update origin
	if (clientData.origin !== "http://localhost:3000") {
		throw createError({
			status: 422,
			message: "Invalid client data origin",
		});
	}
	if (clientData.crossOrigin !== null && clientData.crossOrigin) {
		throw createError({
			status: 422,
			message: "Invalid client data cross origin",
		});
	}

	let credential: WebAuthnUserCredential;
	if (
		authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256
	) {
		let cosePublicKey: COSEEC2PublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.ec2();
		} catch {
			throw createError({
				status: 422,
				message: "Invalid Public Key",
			});
		}
		if (cosePublicKey.curve !== coseEllipticCurveP256) {
			throw createError({
				status: 500,
				message: "Internal Error",
			});
		}
		const encodedPublicKey = new ECDSAPublicKey(
			p256,
			cosePublicKey.x,
			cosePublicKey.y,
		).encodeSEC1Uncompressed();

		credential = {
			id: authenticatorData.credential.id,
			userId: user.id,
			algorithm: coseAlgorithmES256,
			name,
			publicKey: encodedPublicKey,
		};
	} else if (
		authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256
	) {
		let cosePublicKey: COSERSAPublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.rsa();
		} catch {
			throw createError({
				status: 422,
				message: "Invalid cose public key",
			});
		}
		const encodedPublicKey = new RSAPublicKey(
			cosePublicKey.n,
			cosePublicKey.e,
		).encodePKCS1();
		credential = {
			id: authenticatorData.credential.id,
			userId: user.id,
			algorithm: coseAlgorithmRS256,
			name,
			publicKey: encodedPublicKey,
		};
	} else {
		throw createError({
			status: 500,
			message: "Internal Error",
		});
	}

	// We don't have to worry about race conditions since queries are synchronous
	const credentials = await getUserPasskeyCredentials(user.id);
	if (credentials.length >= 5) {
		throw createError({
			status: 400,
			message: "Too much credentials",
		});
	}

	try {
		createPasskeyCredential(credential);
	} catch (e) {
		if (e instanceof DrizzleError) {
			throw createError({
				status: 422,
				message: "Database error",
			});
		}
		throw createError({
			status: 500,
			message: "Internal Error",
		});
	}

	if (!session.twoFactorVerified) {
		setSessionAs2FAVerified(session.id, true);
	}

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
		message: "Passkey creation successful",
		redirectUrl: "/",
	};
}
