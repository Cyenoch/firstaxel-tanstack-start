import { useAppForm } from "@/hooks/form";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
	checkEmailAvailability,
	verifyEmailInput,
} from "@/lib/auth/server/email";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie,
} from "@/lib/auth/server/email-verification";
import { verifyPasswordStrength } from "@/lib/auth/server/password";
import { RefillingTokenBucket } from "@/lib/auth/server/rate-limit";
import { globalPOSTRateLimit } from "@/lib/auth/server/request";
import {
	type SessionFlags,
	createSession,
	generateSessionToken,
	setSessionTokenCookie,
} from "@/lib/auth/server/session";
import { createUser } from "@/lib/auth/server/user";
import { createUser as createUserSchema } from "@/schema/auth/user";
import { Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	createError,
	getHeader,
	setResponseStatus,
} from "@tanstack/react-start/server";
import { toast } from "sonner";
import { Button } from "../ui/button";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

const registerUserAction = createServerFn({ method: "POST" })
	.validator(createUserSchema)
	.handler(async ({ data }) => {
		if (!globalPOSTRateLimit()) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}

		// TODO: Assumes X-Forwarded-For is always included.
		const clientIP = getHeader("X-Forwarded-For");
		if (clientIP !== null && !ipBucket.check(clientIP as string, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}

		const email = data.email;
		const firstname = data.firstname;
		const lastname = data.lastname;
		const password = data.password;

		if (
			typeof email !== "string" ||
			typeof firstname !== "string" ||
			typeof lastname !== "string"
		) {
			throw createError({
				status: 422,
				message: "Invalid or missing fields",
			});
		}
		if (
			email === "" ||
			password === "" ||
			firstname === "" ||
			lastname === ""
		) {
			throw createError({
				status: 422,
				message: "Please enter your firstname, lastname, email, and password",
			});
		}
		if (
			typeof email !== "string" ||
			typeof firstname !== "string" ||
			typeof lastname !== "string" ||
			typeof password !== "string"
		) {
			throw createError({
				status: 422,
				message: "Invalid or missing fields",
			});
		}
		if (
			email === "" ||
			password === "" ||
			firstname === "" ||
			lastname === ""
		) {
			throw createError({
				status: 422,
				message: "Please enter your firstname, lastname, email, and password",
			});
		}
		if (!verifyEmailInput(email)) {
			return;
		}
		const emailAvailable = await checkEmailAvailability(email);
		if (emailAvailable) {
			throw createError({
				status: 409,
				message: "Email is already used",
			});
		}

		const strongPassword = await verifyPasswordStrength(password);
		if (!strongPassword) {
			throw createError({
				status: 403,
				message: "Weak password",
			});
		}
		if (clientIP !== null && !ipBucket.consume(clientIP as string, 1)) {
			throw createError({
				status: 429,
				message: "Too many requests",
			});
		}
		const user = await createUser(email, firstname, lastname, password);
		const emailVerificationRequest = await createEmailVerificationRequest(
			user.id,
			user.email,
		);
		sendVerificationEmail(
			emailVerificationRequest.email,
			emailVerificationRequest.code,
		);
		setEmailVerificationRequestCookie(emailVerificationRequest);
		const sessionFlags: SessionFlags = {
			twoFactorVerified: false,
		};
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id, sessionFlags);
		setSessionTokenCookie(session.id, session.expiresAt);
		setResponseStatus(201, "User registered successfully");
		return {
			message: "User registered successfully",
			redirectUrl: "/auth/verify-email",
		};
	});

const RegisterForm = () => {
	const navigate = useNavigate();
	const registerUser = useServerFn(registerUserAction);
	const { mutate, isPending } = useMutation({
		mutationKey: ["register"],
		mutationFn: registerUser,
	});
	const form = useAppForm({
		defaultValues: {
			firstname: "",
			lastname: "",
			email: "",
			password: "",
		},
		validators: {
			onBlur: createUserSchema,
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
				<div className="-m-px rounded-[calc(var(--radius)+.125rem)] border bg-card p-8 pb-6 space-y-4">
					<div className="text-center">
						<Link to="/" aria-label="go home" className="mx-auto block w-fit">
							Logo{" "}
						</Link>
						<h1 className="mt-4 mb-1 font-semibold text-title text-xl">
							Create a Identified Account
						</h1>
						<p className="text-sm">Welcome! Create an account to get started</p>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<form.AppField name="firstname">
							{(field) => <field.TextField label="Firstname" />}
						</form.AppField>

						<form.AppField name="lastname">
							{(field) => <field.TextField label="Lastname" />}
						</form.AppField>
					</div>

					<div>
						<form.AppField name="email">
							{(field) => <field.TextField label="Email" />}
						</form.AppField>
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
								label="Create Account"
								isLoading={isPending}
							/>
						</form.AppForm>
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
								<title>Google Icon</title>
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
						Have an account ?
						<Button asChild variant="link" className="px-2">
							<Link to="/auth/login">Sign In</Link>
						</Button>
					</p>
				</div>
			</form>
		</div>
	);
};

export default RegisterForm;
