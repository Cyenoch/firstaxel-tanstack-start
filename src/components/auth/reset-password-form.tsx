import { useAppForm } from "@/hooks/demo.form";
import { verifyPasswordStrength } from "@/lib/auth/server/password";
import {
	deletePasswordResetSessionTokenCookie,
	getCurrentPasswordResetSession,
	invalidateUserPasswordResetSessions,
} from "@/lib/auth/server/password-reset";
import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import {
	type SessionFlags,
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie,
} from "@/lib/auth/server/session";
import { updateUserPassword } from "@/lib/auth/server/user";
import { resetPassword as resetPasswordSchema } from "@/schema/auth/user";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	createError,
	getCookie,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { toast } from "sonner";
import { Button } from "../ui/button";

const resetPasswordAction = createServerFn({
	method: "POST",
})
	.validator(resetPasswordSchema)
	.handler(async ({ data }) => {
		if (!globalPOSTRateLimit()) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}

		const passwordResetSessionToken = getCookie("password_reset_session");

		const { session: passwordResetSession, user } =
			await getCurrentPasswordResetSession(passwordResetSessionToken as string);

		if (passwordResetSession === null) {
			throw createError({
				status: 401,
				message: "Not authenticated",
			});
		}
		if (!passwordResetSession.emailVerified) {
			throw createError({
				status: 403,
				message: "Forbidden",
			});
		}

		if (user.registered2FA && !passwordResetSession.twoFactorVerified) {
			return {
				message: "Please verify your 2FA before proceeding",
				redirectUrl: "/auth/reset-password/twoFactor",
			};
		}

		const password = data.password;
		if (typeof password !== "string") {
			throw createError({
				status: 422,
				message: "Invalid or missing fields",
			});
		}

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			throw createError({
				status: 400,
				message: "Weak password",
			});
		}
		await invalidateUserPasswordResetSessions(passwordResetSession.userId);
		invalidateUserSessions(passwordResetSession.userId);
		await updateUserPassword(passwordResetSession.userId, password);

		const sessionFlags: SessionFlags = {
			twoFactorVerified: passwordResetSession.twoFactorVerified,
		};
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id, sessionFlags);
		setSessionTokenCookie(sessionToken, session.expiresAt);
		deletePasswordResetSessionTokenCookie();
		setResponseStatus(200);
		return {
			redirectUrl: "/",
			message: "Password has been resetted",
		};
	});
const ResetPasswordForm = () => {
	const navigate = useNavigate();
	const resetPassword = useServerFn(resetPasswordAction);
	const { mutate, isPending } = useMutation({
		mutationKey: ["resetPassword"],
		mutationFn: resetPassword,
	});
	const form = useAppForm({
		defaultValues: {
			password: "",
		},
		validators: {
			onBlur: resetPasswordSchema,
		},
		onSubmit: ({ value }) => {
			mutate(
				{
					data: {
						password: value.password,
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
				className="m-auto h-fit w-md max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border bg-muted shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
			>
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6 space-y-4">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo{" "}
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-title text-xl">
							Reset Your Password{" "}
						</h1>
						<p className="text-sm">Enter your new password</p>
					</div>

					<div>
						<form.AppField name="password">
							{(field) => (
								<field.PasswordField type="register" label="Password" />
							)}
						</form.AppField>
					</div>

					<div>
						<form.AppForm>
							<form.SubscribeButton
								label="Reset Password"
								isLoading={isPending}
							/>
						</form.AppForm>
					</div>
				</div>

				<div className="p-3">
					<p className="text-center text-accent-foreground text-sm">
						Remembered Your Password ?
						<Button asChild variant="link" className="px-2">
							<Link to="/auth/login">Login</Link>
						</Button>
					</p>
				</div>
			</form>
		</div>
	);
};

export default ResetPasswordForm;
