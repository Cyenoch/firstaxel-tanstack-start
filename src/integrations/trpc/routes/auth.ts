import {
	checkEmailAvailability,
	verifyEmailInput,
} from "@/lib/auth/server/email";
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
} from "@/lib/auth/server/email-verification";
import { verifyPasswordStrength } from "@/lib/auth/server/password";
import { RefillingTokenBucket } from "@/lib/auth/server/rate-limit";
import {
	type SessionFlags,
	createSession,
	generateSessionToken,
} from "@/lib/auth/server/session";
import { createUser } from "@/lib/auth/server/user";
import { createUser as createUserSchema } from "@/schema/auth/user";
import type { TRPCRouterRecord } from "@trpc/server";
import { privateProcedure } from "../middleware";

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export const authRouter = {
	registerUser: privateProcedure
		.input(createUserSchema)
		.mutation(async ({ ctx, input }) => {
			const { ip: clientIP, cookies } = ctx;

			const { email, firstname, lastname, password } = input;
			if (
				typeof email !== "string" ||
				typeof firstname !== "string" ||
				typeof lastname !== "string"
			) {
				return {
					message: "Invalid or missing fields",
				};
			}
			if (
				email === "" ||
				password === "" ||
				firstname === "" ||
				lastname === ""
			) {
				return {
					message: "Please enter your firstname, lastname, email, and password",
				};
			}
			if (
				typeof email !== "string" ||
				typeof firstname !== "string" ||
				typeof lastname !== "string" ||
				typeof password !== "string"
			) {
				return {
					message: "Invalid or missing fields",
				};
			}
			if (
				email === "" ||
				password === "" ||
				firstname === "" ||
				lastname === ""
			) {
				return {
					message: "Please enter your firstname, lastname, email, and password",
				};
			}
			if (!verifyEmailInput(email)) {
				return;
			}
			const emailAvailable = await checkEmailAvailability(email);
			if (!emailAvailable) {
				return {
					message: "Email is already used",
				};
			}

			const strongPassword = await verifyPasswordStrength(password);
			if (!strongPassword) {
				return {
					message: "Weak password",
				};
			}
			if (clientIP !== null && !ipBucket.consume(clientIP as string, 1)) {
				return {
					message: "Too many requests",
				};
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
			cookies.set("email_verification", emailVerificationRequest.id, {
				expires: emailVerificationRequest.expiresAt,
			});
			const sessionFlags: SessionFlags = {
				twoFactorVerified: false,
			};
			const sessionToken = generateSessionToken();
			const session = await createSession(sessionToken, user.id, sessionFlags);
			cookies.set("session", sessionToken, {
				expires: session.expiresAt,
			});
			return {
				message: "User registered successfully",
			};
		}),
} satisfies TRPCRouterRecord;
