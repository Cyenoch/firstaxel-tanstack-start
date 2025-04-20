import { registerSecurityKeyAction } from "@/actions/security-key";
import type { users } from "@/database/drizzle";
import { env } from "@/env";
import { useAppForm } from "@/hooks/form";
import SecurityKey from "@/icons/security-key.svg";
import { createChallenge } from "@/lib/auth/client/webauthn";
import {
	createPasskeySchema,
	type createPasskeyType,
} from "@/schema/auth/passkey";
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";

const createChallengeAction = createServerFn().handler(async () => {
	const challenge = await createChallenge();
	return challenge;
});

const registerSecuityKey = createServerFn({
	method: "POST",
})
	.validator(createPasskeySchema)
	.handler(async ({ data }) => {
		return registerSecurityKeyAction(data);
	});

const RegisterSecurityKeyForm = ({
	encodedCredentialIds,
	encodedCredentialUserId,
	user,
}: {
	encodedCredentialUserId: string;
	user: Partial<typeof users.$inferSelect>;
	encodedCredentialIds: string[];
}) => {
	const registerSecurityKeyMutation = useServerFn(registerSecuityKey);
	const [encodedAttestationObject, setEncodedAttestationObject] = useState<
		string | null
	>(null);
	const [encodedClientDataJSON, setEncodedClientDataJSON] = useState<
		string | null
	>(null);

	const navigate = useNavigate();
	const { mutate, isPending } = useMutation({
		mutationKey: ["registerPasskey"],
		mutationFn: registerSecurityKeyMutation,
	});

	const form = useAppForm({
		defaultValues: {
			name: "",
			encodedAttestationObject: "",
			encodedClientDataJSON: "",
		} as createPasskeyType,
		validators: {
			onBlur: createPasskeySchema,
		},
		onSubmit: ({ value }) => {
			mutate(
				{ data: value },
				{
					onSuccess: (data) => {
						toast.success(data.message);
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
			<Card className="w-[400px]">
				<CardHeader>
					<CardTitle className="text-2xl">Register Security Key</CardTitle>
					<CardDescription className="text-muted-foreground">
						Register a Security key credential to your account
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<img
							src={SecurityKey}
							alt="Security Key"
							className="w-full h-[200px]"
						/>
					</div>
					<Button
						disabled={
							(encodedAttestationObject !== null &&
								encodedClientDataJSON !== null) ||
							isPending
						}
						className="w-full"
						size={"lg"}
						onClick={async () => {
							try {
								const challenge = await createChallengeAction();

								const credential = await navigator.credentials.create({
									publicKey: {
										challenge: decodeBase64(challenge),
										user: {
											displayName: user.firstname as string,
											id: decodeBase64(encodedCredentialUserId),
											name: user.email as string,
										},
										rp: {
											name: "Next.js WebAuthn example",
										},
										pubKeyCredParams: [
											{
												alg: -7,
												type: "public-key",
											},
											{
												alg: -257,
												type: "public-key",
											},
										],
										attestation: "none",
										authenticatorSelection: {
											userVerification: "discouraged",
											residentKey: "discouraged",
											requireResidentKey: false,
											authenticatorAttachment: "cross-platform",
										},
										excludeCredentials: encodedCredentialIds.map((encoded) => {
											return {
												id: decodeBase64(encoded),
												type: "public-key",
											};
										}),
									},
								});

								if (!(credential instanceof PublicKeyCredential)) {
									throw new Error("Failed to create public key");
								}
								if (
									!(
										credential.response instanceof
										AuthenticatorAttestationResponse
									)
								) {
									throw new Error("Unexpected error");
								}

								setEncodedAttestationObject(
									encodeBase64(
										new Uint8Array(credential.response.attestationObject),
									),
								);
								setEncodedClientDataJSON(
									encodeBase64(
										new Uint8Array(credential.response.clientDataJSON),
									),
								);

								form.setFieldValue(
									"encodedAttestationObject",
									encodeBase64(
										new Uint8Array(credential.response.attestationObject),
									),
								);

								form.setFieldValue(
									"encodedClientDataJSON",
									encodeBase64(
										new Uint8Array(credential.response.clientDataJSON),
									),
								);
								form.setFieldValue(
									"name",
									env.VITE_APP_NAME
										? `${env.VITE_APP_NAME} Passkey`
										: `${user.firstname} ${user.lastname} Passkey`,
								);

								form.handleSubmit();
							} catch (error) {
								toast.error("Failed to create security key");
							}
						}}
					>
						{isPending ? (
							<Loader2 className="animate-spin" />
						) : (
							"Create Security Key"
						)}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default RegisterSecurityKeyForm;
