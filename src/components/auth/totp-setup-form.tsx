import { setup2FAAction } from "@/actions/totp";
import { useAppForm } from "@/hooks/form";
import { createTOTPSchema, type createTOTPType } from "@/schema/auth/totp";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../ui/card";
import QRCodeGenerator from "./qr-code-generator";

const registerTOTP = createServerFn({
	method: "POST",
})
	.validator(createTOTPSchema)
	.handler(async ({ data }) => {
		return setup2FAAction(data);
	});

const TOTPSetupForm = ({
	qrCode,
	encodeTOTPKey,
}: {
	qrCode: string;
	encodeTOTPKey: string;
}) => {
	const registerTOTPMutation = useServerFn(registerTOTP);
	const navigate = useNavigate();
	const { mutate, isPending } = useMutation({
		mutationKey: ["registerPasskey"],
		mutationFn: registerTOTPMutation,
	});

	const form = useAppForm({
		defaultValues: {
			encodedTOTPKey: "",
			code: "",
		} as createTOTPType,
		validators: {
			onBlur: createTOTPSchema,
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
		<Card className="w-md">
			<CardHeader>
				<CardTitle className="text-2xl">
					Two-factor Authenticator Setup
				</CardTitle>
				<CardDescription>
					<p>
						Scan the QR code with your authenticator app to set up your
						two-factor authentication.
					</p>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center gap-4 w-full">
				<QRCodeGenerator qrCode={qrCode} />
				<div className="w-full">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="w-full gap-4 "
					>
						<div className="p-4 flex items-center justify-center">
							<form.AppField name="encodedTOTPKey">
								{(field) => (
									<field.TextField value={encodeTOTPKey} readOnly hidden />
								)}
							</form.AppField>

							<form.AppField name="code">
								{(field) => (
									<field.OTPInput
										label="Enter your code to verify setup"
										maxLength={6}
									/>
								)}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton
									label="Setup TOTP"
									isLoading={isPending}
								/>
							</form.AppForm>
						</div>
					</form>
				</div>
			</CardContent>
		</Card>
	);
};

export default TOTPSetupForm;
