CREATE TABLE "EmailVerificationRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PasskeyCredential" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"algorithm" integer NOT NULL,
	"public_key" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PasswordResetSession" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SecurityKeyCredential" (
	"id" "bytea" PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"algorithm" integer NOT NULL,
	"public_key" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp (3) NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TotpCredential" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"passWordHash" text NOT NULL,
	"recoveryCode" "bytea",
	"profilePic" text,
	"registeredTOTP" boolean,
	"registeredRecoveryCode" boolean,
	"registeredSecurityKey" boolean,
	"registeredPasskey" boolean,
	"registered2FA" boolean,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
