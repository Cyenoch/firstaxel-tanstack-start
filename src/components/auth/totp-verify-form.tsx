import { verify2FAAction } from "@/actions/totp";
import { useAppForm } from "@/hooks/form";
import Authenticator from "@/icons/authenticator.svg";
import { verifyTOTPSchema, type verifyTOTPType } from "@/schema/auth/totp";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { KeySquare, Lock } from "lucide-react";
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

const verifyTOTP = createServerFn({
	method: "POST",
})
	.validator(verifyTOTPSchema)
	.handler(async ({ data }) => {
		return verify2FAAction(data);
	});

const TOTPVerifyForm = () => {
	const verifyTOTPMutation = useServerFn(verifyTOTP);
	const navigate = useNavigate();
	const { mutate, isPending } = useMutation({
		mutationFn: verifyTOTPMutation,
	});

	const form = useAppForm({
		defaultValues: {
			code: "",
		} as verifyTOTPType,
		validators: {
			onBlur: verifyTOTPSchema,
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
					Two-factor Authenticator Verification
				</CardTitle>
				<CardDescription>
					<p>
						Enter the code from your authenticator app to verify your account.
					</p>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center gap-4 w-full">
				<div>
					<img src={Authenticator} alt="authenticator" />
				</div>
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
							<form.AppField name="code">
								{(field) => (
									<field.OTPInput
										label=" OTP from your authenticator app"
										maxLength={6}
									/>
								)}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton
									label="Verify TOTP"
									isLoading={isPending}
								/>
							</form.AppForm>
						</div>
					</form>
				</div>
			</CardContent>
			<CardFooter className="w-full flex flex-col items-center justify-center">
				<div className="my-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
					<hr className="border-dashed" />
					<span className="text-muted-foreground text-xs">
						Or continue With
					</span>
					<hr className="border-dashed" />
				</div>
				<ul className="flex flex-col gap-4 w-full">
					<li>
						<Button className="h-10 w-full border" variant={"outline"} asChild>
							<Link to="/auth/twoFactor/passkey">
								<Lock className="size-5 mr-2" />
								Passkeys
							</Link>
						</Button>
					</li>
					<li>
						<Button className="h-10 w-full border" variant={"outline"} asChild>
							<Link to="/auth/twoFactor/security-key">
								<KeySquare className="size-5 mr-2" />
								Security keys
							</Link>
						</Button>
					</li>
				</ul>
			</CardFooter>
		</Card>
	);
};

export default TOTPVerifyForm;
