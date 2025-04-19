import { nanoid } from "@/lib/utils";
import { relations } from "drizzle-orm";
import {
	boolean,
	customType,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const customBytes = customType<{ data: Uint8Array }>({
	dataType() {
		return "bytea";
	},
	toDriver(value) {
		const hex = Buffer.from(
			value.buffer,
			value.byteOffset,
			value.byteLength,
		).toString("hex");
		return hex;
	},
	fromDriver(value) {
		const array = Uint8Array.from(Buffer.from(value as string, "hex"));
		return array;
	},
});

export const sessions = pgTable("Session", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date", precision: 3 }).notNull(),
	twoFactorVerified: boolean("two_factor_verified").default(false).notNull(),
});

export const emailVerificationRequests = pgTable("EmailVerificationRequest", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text("user_id").notNull(),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date", precision: 3 }).notNull(),
});

export const passwordResetSessions = pgTable("PasswordResetSession", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text("user_id").notNull(),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date", precision: 3 }).notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	twoFactorVerified: boolean("two_factor_verified").default(false).notNull(),
});

export const totpCredentials = pgTable("TotpCredential", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull(),
	key: customBytes("key").notNull(),
});

export const passkeyCredentials = pgTable("PasskeyCredential", {
	id: customBytes("id").primaryKey(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	algorithm: integer("algorithm").notNull(),
	publicKey: customBytes("public_key").notNull(),
});

export const securityKeyCredentials = pgTable("SecurityKeyCredential", {
	id: customBytes("id").primaryKey(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	algorithm: integer("algorithm").notNull(),
	publicKey: customBytes("public_key").notNull(),
});

export const users = pgTable("User", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").default(false).notNull(),
	firstname: text("firstname").notNull(),
	lastname: text("lastname").notNull(),
	passWordHash: text("passWordHash").notNull(),
	recoveryCode: customBytes("recoveryCode"),
	profilePic: text("profilePic"),
	registeredTOTP: boolean("registeredTOTP"),
	registeredRecoveryCode: boolean("registeredRecoveryCode"),
	registeredSecurityKey: boolean("registeredSecurityKey"),
	registeredPasskey: boolean("registeredPasskey"),
	registered2FA: boolean("registered2FA"),
	createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const sessionsRelations = relations(sessions, (helpers) => ({
	User: helpers.one(users, {
		relationName: "SessionToUser",
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const emailVerificationRequestsRelations = relations(
	emailVerificationRequests,
	(helpers) => ({
		User: helpers.one(users, {
			relationName: "EmailVerificationRequestToUser",
			fields: [emailVerificationRequests.userId],
			references: [users.id],
		}),
	}),
);

export const passwordResetSessionsRelations = relations(
	passwordResetSessions,
	(helpers) => ({
		User: helpers.one(users, {
			relationName: "PasswordResetSessionToUser",
			fields: [passwordResetSessions.userId],
			references: [users.id],
		}),
	}),
);

export const totpCredentialsRelations = relations(
	totpCredentials,
	(helpers) => ({
		User: helpers.one(users, {
			relationName: "TotpCredentialToUser",
			fields: [totpCredentials.userId],
			references: [users.id],
		}),
	}),
);

export const passkeyCredentialsRelations = relations(
	passkeyCredentials,
	(helpers) => ({
		User: helpers.one(users, {
			relationName: "PasskeyCredentialToUser",
			fields: [passkeyCredentials.userId],
			references: [users.id],
		}),
	}),
);

export const securityKeyCredentialsRelations = relations(
	securityKeyCredentials,
	(helpers) => ({
		User: helpers.one(users, {
			relationName: "SecurityKeyCredentialToUser",
			fields: [securityKeyCredentials.userId],
			references: [users.id],
		}),
	}),
);

export const usersRelations = relations(users, (helpers) => ({
	Session: helpers.many(sessions, { relationName: "SessionToUser" }),
	EmailVerificationRequest: helpers.many(emailVerificationRequests, {
		relationName: "EmailVerificationRequestToUser",
	}),
	PasswordResetSession: helpers.many(passwordResetSessions, {
		relationName: "PasswordResetSessionToUser",
	}),
	TotpCredential: helpers.one(totpCredentials),
	PasskeyCredential: helpers.many(passkeyCredentials, {
		relationName: "PasskeyCredentialToUser",
	}),
	SecurityKeyCredential: helpers.many(securityKeyCredentials, {
		relationName: "SecurityKeyCredentialToUser",
	}),
}));
