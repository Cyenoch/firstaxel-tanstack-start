import { useAppForm } from "@/hooks/demo.form";
import { loginUser as loginUserSchema, passKeyData } from "@/schema/auth/user";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "../ui/button";

import { get2FARedirect } from "@/lib/auth/server/2fa";
import { verifyEmailInput } from "@/lib/auth/server/email";
import { verifyPasswordHash } from "@/lib/auth/server/password";
import { Throttler } from "@/lib/auth/server/rate-limit";
import {
	type SessionFlags,
	createSession,
	generateSessionToken,
} from "@/lib/auth/server/session";
import { getUserFromEmail, getUserPasswordHash } from "@/lib/auth/server/user";
import {
	decodePKIXECDSASignature,
	decodeSEC1PublicKey,
	p256,
	verifyECDSASignature,
} from "@oslojs/crypto/ecdsa";
import { decodeBase64 } from "@oslojs/encoding";
import type { AuthenticatorData, ClientData } from "@oslojs/webauthn";
import {
	ClientDataType,
	coseAlgorithmES256,
	coseAlgorithmRS256,
	createAssertionSignatureMessage,
	parseAuthenticatorData,
	parseClientDataJSON,
} from "@oslojs/webauthn";
import { ObjectParser } from "@pilcrowjs/object-parser";

import { decryptToString } from "@/lib/auth/server/encryption";
import {
	getPasskeyCredential,
	verifyWebAuthnChallenge,
} from "@/lib/auth/server/webauthn";
import {
	decodePKCS1RSAPublicKey,
	sha256ObjectIdentifier,
	verifyRSASSAPKCS1v15Signature,
} from "@oslojs/crypto/rsa";
import { sha256 } from "@oslojs/crypto/sha2";
import { useMutation } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { setCookie, setResponseStatus } from "@tanstack/react-start/server";
import { toast } from "sonner";

const throttler = new Throttler<string>([1, 2, 4, 8, 16, 30, 60, 180, 300]);

const loginUserAction = createServerFn()
	.validator(loginUserSchema)
	.handler(async ({ data }) => {
		const email = data.email;
		const password = data.password;
		if (typeof email !== "string" || typeof password !== "string") {
			setResponseStatus(422);
			return {
				message: "Invalid or missing fields",
			};
		}
		if (email === "" || password === "") {
			setResponseStatus(422);
			return {
				message: "Please enter your email and password.",
			};
		}
		if (!verifyEmailInput(email)) {
			setResponseStatus(422);
			return {
				message: "Invalid email",
			};
		}
		const user = await getUserFromEmail(email);
		if (user === null) {
			setResponseStatus(404);
			return {
				message: "Account does not exist",
			};
		}

		if (!throttler.consume(user.id)) {
			setResponseStatus(429);
			return {
				message: "Too many requests",
			};
		}
		const passwordHash = await getUserPasswordHash(user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			setResponseStatus(401);
			return {
				message: "Invalid password",
			};
		}
		throttler.reset(user.id);
		const sessionFlags: SessionFlags = {
			twoFactorVerified: false,
		};
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id, sessionFlags);
		setCookie("session", session.id, {
			expires: session.expiresAt,
		});

		if (!user.emailVerified) {
			setResponseStatus(200);
			return {
				message: "Verify email address",
				redirectUrl: "/auth/verify-email",
			};
		}
		if (!user.registered2FA) {
			setResponseStatus(200);
			return {
				message: "Please complete 2FA",
				redirectUrl: "/auth/twoFactor/setup",
			};
		}
		setResponseStatus(200);
		return {
			redirectUrl: get2FARedirect(user),
			message: "Please complete 2FA",
		};
	});

const loginWithPasskeyAction = createServerFn()
	.validator(passKeyData)
	.handler(async ({ data }) => {
		const parser = new ObjectParser(data);
		let encodedAuthenticatorData: string;
		let encodedClientDataJSON: string;
		let encodedCredentialId: string;
		let encodedSignature: string;
		try {
			encodedAuthenticatorData = parser.getString("authenticator_data");
			encodedClientDataJSON = parser.getString("client_data_json");
			encodedCredentialId = parser.getString("credential_id");
			encodedSignature = parser.getString("signature");
		} catch {
			setResponseStatus(422);
			return {
				message: "Invalid or missing fields",
			};
		}
		let authenticatorDataBytes: Uint8Array;
		let clientDataJSON: Uint8Array;
		let credentialId: Uint8Array;
		let signatureBytes: Uint8Array;
		try {
			authenticatorDataBytes = decodeBase64(encodedAuthenticatorData);
			clientDataJSON = decodeBase64(encodedClientDataJSON);
			credentialId = decodeBase64(encodedCredentialId);
			signatureBytes = decodeBase64(encodedSignature);
		} catch {
			setResponseStatus(422);
			return {
				message: "Invalid or missing fields",
			};
		}

		let authenticatorData: AuthenticatorData;
		try {
			authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
		} catch {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}
		// TODO: Update host
		if (!authenticatorData.verifyRelyingPartyIdHash("localhost")) {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}
		if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}

		let clientData: ClientData;
		try {
			clientData = parseClientDataJSON(clientDataJSON);
		} catch {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}
		if (clientData.type !== ClientDataType.Get) {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}

		if (!verifyWebAuthnChallenge(clientData.challenge)) {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}
		// TODO: Update origin
		if (clientData.origin !== "http://localhost:3000") {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}
		if (clientData.crossOrigin !== null && clientData.crossOrigin) {
			setResponseStatus(422);
			return {
				message: "Invalid data",
			};
		}

		const credential = await getPasskeyCredential(
			decryptToString(credentialId),
		);
		if (credential === null) {
			setResponseStatus(401);
			return {
				message: "Invalid credential",
			};
		}

		let validSignature: boolean;
		if (credential.algorithm === coseAlgorithmES256) {
			const ecdsaSignature = decodePKIXECDSASignature(signatureBytes);
			const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
			const hash = sha256(
				createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON),
			);
			validSignature = verifyECDSASignature(
				ecdsaPublicKey,
				hash,
				ecdsaSignature,
			);
		} else if (credential.algorithm === coseAlgorithmRS256) {
			const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
			const hash = sha256(
				createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON),
			);
			validSignature = verifyRSASSAPKCS1v15Signature(
				rsaPublicKey,
				sha256ObjectIdentifier,
				hash,
				signatureBytes,
			);
		} else {
			setResponseStatus(500);
			return {
				message: "Internal error",
			};
		}

		if (!validSignature) {
			setResponseStatus(401);
			return {
				message: "Invalid signature",
			};
		}
		const sessionFlags: SessionFlags = {
			twoFactorVerified: true,
		};
		const sessionToken = generateSessionToken();
		const session = await createSession(
			sessionToken,
			credential.userId,
			sessionFlags,
		);

		setCookie("session", session.id);
		setResponseStatus(200);
		return {
			message: "Login successfully",
			redirectUrl: "/",
		};
	});

const LoginForm = () => {
	const loginUser = useServerFn(loginUserAction);

	const navigate = useNavigate();
	const { mutate, isPending } = useMutation({
		mutationKey: ["register"],
		mutationFn: loginUser,
	});
	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onBlur: loginUserSchema,
		},
		onSubmit: ({ value }) => {
			mutate(
				{ data: value },
				{
					onSuccess: (data) => {
						toast.success(data?.message);
						if (data?.redirectUrl) {
							navigate({
								to: data?.redirectUrl,
							});
						}
					},
					onError: (error) => {
						toast.error(error.message);
					},
				},
			);
		},
	});

	return (
		<div className="w-full h-full">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border bg-muted shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
			>
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-xl">
							Sign In to Identified
						</h1>
						<p className="text-sm">Welcome back! Sign in to continue</p>
					</div>

					<div className="mt-6 space-y-6">
						<div>
							<form.AppField name="email">
								{(field) => <field.TextField label="Email" />}
							</form.AppField>
						</div>

						<div>
							<form.AppField name="password">
								{(field) => (
									<field.PasswordField type="login" label="Password" />
								)}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton label="Login" isLoading={isPending} />
							</form.AppForm>
						</div>
					</div>

					<div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<hr className="border-dashed" />
						<span className="text-muted-foreground text-xs">
							Or continue With
						</span>
						<hr className="border-dashed" />
					</div>

					<div className="grid gap-3">
						<Button type="button" variant="outline" className="w-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="0.98em"
								height="1em"
								viewBox="0 0 256 262"
							>
								<title>Google Logo</title>
								<path
									fill="#4285f4"
									d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
								/>
								<path
									fill="#34a853"
									d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
								/>
								<path
									fill="#fbbc05"
									d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
								/>
								<path
									fill="#eb4335"
									d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
								/>
							</svg>
							<span>Google</span>
						</Button>
					</div>
				</div>

				<div className="p-3">
					<p className="text-center text-accent-foreground text-sm">
						Don't have an account ?
						<Button asChild variant="link" className="px-2">
							<Link to="/auth/register">Create account</Link>
						</Button>
					</p>
				</div>
			</form>
		</div>
	);
};

export default LoginForm;
