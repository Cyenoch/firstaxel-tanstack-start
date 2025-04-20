import { useAppForm } from "@/hooks/form";
import {
	recoveryCodeBucket,
	resetUser2FAWithRecoveryCode,
} from "@/lib/auth/server/2fa";
import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import { getCurrentSession } from "@/lib/auth/server/session";
import { resetTwoFactor as resetTwoFactorSchema } from "@/schema/auth/user";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { createError } from "@tanstack/react-start/server";
import { toast } from "sonner";

const resetTwoFactorAction = createServerFn({
	method: "POST",
})
	.validator(resetTwoFactorSchema)
	.handler(async ({ data }) => {
		if (!globalPOSTRateLimit()) {
			throw createError({
				statusCode: 429,
				message: "Too many requests",
			});
		}

		const { session, user } = await getCurrentSession();
		if (session === null) {
			throw createError({
				statusCode: 401,
				message: "Not authenticated",
			});
		}
		if (
			!user.emailVerified ||
			!user.registered2FA ||
			session.twoFactorVerified
		) {
			return {
				message: "Forbidden",
			};
		}
		if (!recoveryCodeBucket.check(user.id, 1)) {
			return {
				message: "Too many requests",
			};
		}

		const code = data.code;
		if (typeof code !== "string") {
			return {
				message: "Invalid or missing fields",
			};
		}
		if (code === "") {
			return {
				message: "Please enter your code",
			};
		}
		if (!recoveryCodeBucket.consume(user.id, 1)) {
			return {
				message: "Too many requests",
			};
		}
		const valid = resetUser2FAWithRecoveryCode(user.id, code);
		if (!valid) {
			return {
				message: "Invalid recovery code",
			};
		}
		recoveryCodeBucket.reset(user.id);
		return {
			redirectUrl: "/auth/twoFactor/setup",
			message: "Two factor authentication reset successfully",
		};
	});

const ResetTwoFactor = () => {
	const navigate = useNavigate();
	const resetTwoFactor = useServerFn(resetTwoFactorAction);
	const { mutate: resetTwoFactorMutation, isPending } = useMutation({
		mutationKey: ["resetTwoFactor"],
		mutationFn: resetTwoFactor,
	});

	const form = useAppForm({
		defaultValues: {
			code: "",
		},
		validators: {
			onBlur: resetTwoFactorSchema,
		},
		onSubmit: ({ value }) => {
			resetTwoFactorMutation(
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
				className="m-auto h-fit w-md  overflow-hidden rounded-[calc(var(--radius)+.125rem)] border bg-muted shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
			>
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-xl">
							Reset Two-factor Authentication
						</h1>
						<p className="text-sm">
							Enter your recovery code to reset your two-factor authentication
						</p>
					</div>

					<div className="mt-6 space-y-6">
						<div className="space-y-2">
							<form.AppField name="code">
								{(field) => (
									<field.TextField
										label="Enter Recovery Code"
										placeholder="Enter recovery code"
									/>
								)}
							</form.AppField>
						</div>

						<div>
							<form.AppForm>
								<form.SubscribeButton label="Reset 2FA" isLoading={isPending} />
							</form.AppForm>
						</div>
					</div>
				</div>
			</form>
		</div>
	);
};

export default ResetTwoFactor;
