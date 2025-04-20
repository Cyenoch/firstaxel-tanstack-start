import { useAppForm } from "@/hooks/form";
import { verifyUser as verifyUserSchema } from "@/schema/auth/user";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Button } from "../ui/button";

import {
	getCurrentPasswordResetSession,
	setPasswordResetSessionAsEmailVerified,
} from "@/lib/auth//server/password-reset";
import { ExpiringTokenBucket } from "@/lib/auth//server/rate-limit";
import { setUserAsEmailVerifiedIfEmailMatches } from "@/lib/auth//server/user";
import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import {
	createError,
	getCookie,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { toast } from "sonner";

const emailVerificationBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

const verifyEmailPasswordResetAction = createServerFn({
	method: "POST",
})
	.validator(verifyUserSchema)
	.handler(async ({ data }) => {
		if (!globalPOSTRateLimit()) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}

		const passwordResetSessionToken = getCookie("password_reset_session");

		const { session } = await getCurrentPasswordResetSession(
			passwordResetSessionToken as string,
		);

		if (session === null) {
			throw createError({
				status: 401,
				message: "Not authenticated",
			});
		}
		if (session.emailVerified) {
			throw createError({
				status: 403,
				message: "Forbidden",
			});
		}
		if (!emailVerificationBucket.check(session.userId as string, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}

		const code = data.code;
		if (typeof code !== "string") {
			throw createError({
				status: 422,
				message: "Invalid or missing fields",
			});
		}
		if (code === "") {
			throw createError({
				status: 422,
				message: "Please enter your code",
			});
		}
		if (!emailVerificationBucket.consume(session.userId, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}
		if (code !== session.code) {
			throw createError({
				status: 422,
				message: "Incorrect code",
			});
		}
		emailVerificationBucket.reset(session.userId);
		await setPasswordResetSessionAsEmailVerified(session.id);
		const emailMatches = setUserAsEmailVerifiedIfEmailMatches(
			session.userId,
			session.email,
		);
		if (!emailMatches) {
			throw createError({
				status: 401,
				message: "Please restart the process",
			});
		}
		setResponseStatus(200);
		return {
			redirectUrl: "/auth/reset-password",
			message: "Email verified successfully",
		};
	});

const VerifyPasswordEmail = () => {
	const navigate = useNavigate();
	const verifyEmail = useServerFn(verifyEmailPasswordResetAction);

	const { mutate, isPending } = useMutation({
		mutationKey: ["verifyEmail"],
		mutationFn: verifyEmail,
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
						<h1 className="mt-4 mb-1 font-semibold text-xl">
							Verify Password Reset{" "}
						</h1>
						<p className="text-sm">
							Verify your password reset intent to continue!
						</p>
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
						<Button variant="link" className="px-2" type="button">
							<Link to="/auth/forgot-password">Restart the process</Link>
						</Button>
					</p>
				</div>
			</form>
		</div>
	);
};

export default VerifyPasswordEmail;
