import { verify2FAWithPasskeyAction } from "@/actions/passkey";
import { useAppForm } from "@/hooks/form";
import Passkey from "@/icons/passkey.svg";
import { createChallenge } from "@/lib/auth/client/webauthn";
import {
	verifyPasskeySchema,
	type verifyPasskeyType,
} from "@/schema/auth/passkey";
import { decodeBase64, encodeBase64 } from "@oslojs/encoding";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { KeySquare, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";

const createChallengeAction = createServerFn().handler(async () => {
	const challenge = await createChallenge();
	return challenge;
});

const verifyPasskey = createServerFn({
	method: "POST",
})
	.validator(verifyPasskeySchema)
	.handler(async ({ data }) => {
		return verify2FAWithPasskeyAction(data);
	});

const VerifyUserPasskeyForm = ({
	encodedCredentialIds,
}: {
	encodedCredentialIds: string[];
}) => {
	const verifyPasskeyMutation = useServerFn(verifyPasskey);

	const navigate = useNavigate();
	const { mutate, isPending } = useMutation({
		mutationKey: ["registerPasskey"],
		mutationFn: verifyPasskeyMutation,
	});

	const form = useAppForm({
		defaultValues: {
			encodedCredentialId: "",
			encodedAuthenticatorData: "",
			encodedClientDataJSON: "",
			encodedSignature: "",
		} as verifyPasskeyType,
		validators: {
			onBlur: verifyPasskeySchema,
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
					<CardTitle className="text-2xl">Verify with Passkey</CardTitle>
					<CardDescription className="text-muted-foreground">
						Complete passkey verification to login into your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div>
						<img src={Passkey} alt="Passkey" className="w-full h-[200px]" />
					</div>
					<Button
						disabled={isPending}
						className="w-full"
						size={"lg"}
						onClick={async () => {
							try {
								const challenge = await createChallengeAction();

								const credential = await navigator.credentials.get({
									publicKey: {
										challenge: decodeBase64(challenge),
										userVerification: "discouraged",
										allowCredentials: encodedCredentialIds.map((encoded) => {
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
										AuthenticatorAssertionResponse
									)
								) {
									throw new Error("Unexpected error");
								}

								form.setFieldValue(
									"encodedAuthenticatorData",
									encodeBase64(
										new Uint8Array(credential.response.authenticatorData),
									),
								);
								form.setFieldValue(
									"encodedClientDataJSON",
									encodeBase64(
										new Uint8Array(credential.response.clientDataJSON),
									),
								);
								form.setFieldValue(
									"encodedCredentialId",
									encodeBase64(new Uint8Array(credential.rawId)),
								);
								form.setFieldValue(
									"encodedSignature",
									encodeBase64(new Uint8Array(credential.response.signature)),
								);

								form.handleSubmit();
							} catch (error) {
								toast.error("Failed to verify user passkey");
							}
						}}
					>
						{isPending ? (
							<Loader2 className="animate-spin" />
						) : (
							"Authenticate with Passkey"
						)}
					</Button>
				</CardContent>
				<CardFooter className="w-full flex flex-col items-center justify-center">
					<div className="my-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<hr className="border-dashed" />
						<span className="text-muted-foreground text-xs">
							Or continue with
						</span>
						<hr className="border-dashed" />
					</div>
					<ul className="flex flex-col gap-4 w-full">
						<li>
							<li>
								<Button
									className="h-10 w-full border"
									variant={"outline"}
									asChild
								>
									<Link to="/auth/twoFactor/totp/setup">
										<Smartphone className="size-5 mr-2" />
										Authenticator
									</Link>
								</Button>
							</li>
						</li>
						<li>
							<Button
								className="h-10 w-full border"
								variant={"outline"}
								asChild
							>
								<Link to="/auth/twoFactor/security-key">
									<KeySquare className="size-5 mr-2" />
									Security keys
								</Link>
							</Button>
						</li>
					</ul>
				</CardFooter>
			</Card>
		</div>
	);
};

export default VerifyUserPasskeyForm;
