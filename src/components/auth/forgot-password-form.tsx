import { useAppForm } from "@/hooks/form";
import { verifyEmailInput } from "@/lib/auth/server/email";
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie,
} from "@/lib/auth/server/password-reset";
import { RefillingTokenBucket } from "@/lib/auth/server/rate-limit";
import { generateSessionToken } from "@/lib/auth/server/session";
import { getUserFromEmail } from "@/lib/auth/server/user";
import { forgotPassword as forgotPasswordSchema } from "@/schema/auth/user";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import {
	createError,
	getHeader,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { toast } from "sonner";
import { Button } from "../ui/button";

const passwordResetEmailIPBucket = new RefillingTokenBucket<string>(3, 60);
const passwordResetEmailUserBucket = new RefillingTokenBucket<string>(3, 60);
const forgotPasswordAction = createServerFn({
	method: "POST",
})
	.validator(forgotPasswordSchema)
	.handler(async ({ data }) => {
		const email = data.email;
		const ip = getHeader("X-Forwarded-For");

		if (typeof email !== "string") {
			throw createError({
				status: 422,
				message: "Invalid or missing fields",
			});
		}
		if (!verifyEmailInput(email)) {
			throw createError({
				status: 403,
				message: "Invalid email",
			});
		}
		const user = await getUserFromEmail(email);
		if (user === null) {
			throw createError({
				status: 400,
				message: "Account does not exist",
			});
		}
		if (ip !== null && !passwordResetEmailIPBucket.consume(ip as string, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}
		if (!passwordResetEmailUserBucket.consume(user.id, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}
		invalidateUserPasswordResetSessions(user.id);
		const sessionToken = generateSessionToken();
		const session = await createPasswordResetSession(
			sessionToken,
			user.id,
			user.email as string,
		);

		sendPasswordResetEmail(session.email, session.code);
		setPasswordResetSessionTokenCookie(sessionToken, session.expiresAt);
		setResponseStatus(200);
		return {
			redirectUrl: "/auth/reset-password/verify-email",
			message: "Verification Email Sent",
		};
	});
const ForgotPasswordForm = () => {
	const navigate = useNavigate();
	const forgotPassword = useServerFn(forgotPasswordAction);
	const { mutate, isPending } = useMutation({
		mutationKey: ["register"],
		mutationFn: forgotPassword,
	});
	const form = useAppForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onBlur: forgotPasswordSchema,
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
				className="m-auto h-fit w-md overflow-hidden rounded-[calc(var(--radius)+.125rem)] border bg-muted shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
			>
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-xl">
							Forgot Your Password{" "}
						</h1>
						<p className="text-sm">Enter your email to continue</p>
					</div>

					<div className="mt-6 space-y-6">
						<div>
							<form.AppField name="email">
								{(field) => (
									<field.TextField
										label="Email"
										placeholder="Enter your email address"
									/>
								)}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton
									label="Send Email"
									isLoading={isPending}
								/>
							</form.AppForm>
						</div>
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

export default ForgotPasswordForm;
