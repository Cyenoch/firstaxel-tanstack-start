import { useAppForm } from "@/hooks/form";
import { verifyUser as verifyUserSchema } from "@/schema/auth/user";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Button } from "../ui/button";

import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getCurrentUserEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie,
} from "@/lib/auth//server/email-verification";
import { invalidateUserPasswordResetSessions } from "@/lib/auth//server/password-reset";
import { ExpiringTokenBucket } from "@/lib/auth//server/rate-limit";
import { getCurrentSession } from "@/lib/auth//server/session";
import { updateUserEmailAndSetEmailAsVerified } from "@/lib/auth//server/user";
import {
	createError,
	getCookie,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const bucket = new ExpiringTokenBucket<string>(5, 60 * 30);

const resendEmailVerificationCodeAction = createServerFn().handler(async () => {
	const emailVerificationId = getCookie("email_verification");

	const { session, user } = await getCurrentSession();
	if (session === null) {
		throw createError({
			statusCode: 401,
			message: "Not authenticated",
		});
	}
	if (user.registered2FA && !session.twoFactorVerified) {
		throw createError({
			statusCode: 403,
			message: "Forbidden",
		});
	}
	if (!sendVerificationEmailBucket.check(user.id, 1)) {
		throw createError({
			statusCode: 429,
			message: "Too many requests",
		});
	}
	let verificationRequest = await getCurrentUserEmailVerificationRequest(
		emailVerificationId as string,
	);
	if (verificationRequest === null) {
		if (user.emailVerified) {
			throw createError({
				statusCode: 403,
				message: "Forbidden",
			});
		}
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
			throw createError({
				statusCode: 429,
				message: "Too many requests",
			});
		}
		verificationRequest = await createEmailVerificationRequest(
			user.id,
			user.email as string,
		);
	} else {
		if (!sendVerificationEmailBucket.consume(user.id, 1)) {
			throw createError({
				statusCode: 429,
				message: "Too many requests",
			});
		}

		if (!verificationRequest) {
			throw createError({
				statusCode: 400,
				message: "Email verification code not found",
			});
		}
		verificationRequest = await createEmailVerificationRequest(
			user.id,
			verificationRequest.email,
		);
	}
	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(verificationRequest);
	setResponseStatus(200);
	return {
		message: "A new code was sent to your inbox.",
	};
});

const verifyEmailAction = createServerFn({
	method: "POST",
})
	.validator(verifyUserSchema)
	.handler(async ({ data }) => {
		const emailVerificationId = getCookie("email_verification");

		const { session, user } = await getCurrentSession();
		if (session === null) {
			throw createError({
				statusCode: 401,
				statusMessage: "Not authenticated",
			});
		}

		if (!user) {
			throw createError({
				statusCode: 401,
				statusMessage: "Unauthorized",
			});
		}

		if (user.registered2FA && !session.twoFactorVerified) {
			throw createError({
				statusCode: 403,
				statusMessage: "Forbidden",
			});
		}

		if (!bucket.check(user.id, 1)) {
			throw createError({
				statusCode: 429,
				statusMessage: "Too many requests",
			});
		}

		let verificationRequest = await getCurrentUserEmailVerificationRequest(
			emailVerificationId as string,
		);
		if (verificationRequest === null) {
			throw createError({
				statusCode: 401,
				statusMessage: "Not authenticated",
			});
		}
		const code = data.code;
		if (typeof code !== "string") {
			throw createError({
				statusCode: 400,
				statusMessage: "Invalid or missing fields",
			});
		}
		if (code === "") {
			throw createError({
				statusCode: 400,
				statusMessage: "Enter your code",
			});
		}
		if (!bucket.consume(user.id, 1)) {
			throw createError({
				statusCode: 429,
				statusMessage: "Too many requests",
			});
		}

		if (!verificationRequest) {
			throw createError({
				statusCode: 400,
				statusMessage: "Email verification code not found",
			});
		}
		if (Date.now() >= verificationRequest.expiresAt.getTime()) {
			verificationRequest = await createEmailVerificationRequest(
				verificationRequest.userId,
				verificationRequest.email,
			);
			sendVerificationEmail(
				verificationRequest.email,
				verificationRequest.code,
			);
			return {
				message:
					"The verification code was expired. We sent another code to your inbox.",
			};
		}
		if (verificationRequest.code !== code) {
			throw createError({
				statusCode: 400,
				statusMessage: "Incorrect code.",
			});
		}
		deleteUserEmailVerificationRequest(user.id);
		invalidateUserPasswordResetSessions(user.id);
		updateUserEmailAndSetEmailAsVerified(user.id, verificationRequest.email);
		deleteEmailVerificationRequestCookie();
		if (!user.registered2FA) {
			return {
				message: "Email verified successfully",
				redirectUrl: "/auth/twoFactor/setup",
			};
		}
		return {
			message: "Email verified successfully",
			redirectUrl: "/",
		};
	});

const VerifyEmailForm = () => {
	const navigate = useNavigate();
	const verifyEmail = useServerFn(verifyEmailAction);
	const resendEmailVerifiation = useServerFn(resendEmailVerificationCodeAction);

	const { mutate, isPending } = useMutation({
		mutationKey: ["verifyEmail"],
		mutationFn: verifyEmail,
	});

	const { mutate: resend, isPending: isResendPending } = useMutation({
		mutationKey: ["resendVerifiationCode"],
		mutationFn: resendEmailVerifiation,
	});
	const form = useAppForm({
		defaultValues: {
			code: "",
		},
		validators: {
			onBlur: verifyUserSchema,
		},
		onSubmit: ({ value }) => {
			mutate(
				{
					data: {
						code: value.code,
					},
				},
				{
					onSuccess: (data) => {
						toast.success(data.message);
						if (data.redirectUrl) {
							navigate({
								to: data.redirectUrl,
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

	const onResend = () => {
		resend(
			{},
			{
				onSuccess: (data) => {
					toast.success(data.message);
				},
				onError: (error) => {
					toast.error(error.message);
				},
			},
		);
	};
	return (
		<div className="w-full h-full">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="m-auto h-fit w-full  overflow-hidden rounded-[calc(var(--radius)+.125rem)] border bg-muted shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
			>
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-xl">Verify Email </h1>
						<p className="text-sm">Verify your email address to continue!</p>
					</div>

					<div className="mt-6 space-y-6">
						<div className="space-y-2">
							<form.AppField name="code">
								{(field) => <field.OTPInput label="Enter OTP" />}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton
									label="Verify Email"
									isLoading={isPending}
								/>
							</form.AppForm>
						</div>
					</div>
				</div>

				<div className="p-3">
					<p className="text-center text-accent-foreground text-sm">
						Didn't receive the code ?
						<Button
							variant="link"
							className="px-2"
							type="button"
							onClick={onResend}
						>
							{isResendPending ? (
								<Loader2 className="animate-spin" />
							) : (
								<>Resend OTP</>
							)}
						</Button>
					</p>
				</div>
			</form>
		</div>
	);
};

export default VerifyEmailForm;
