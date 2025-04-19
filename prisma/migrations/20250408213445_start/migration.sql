-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,
    "two_factor_verified" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationRequest" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,

    CONSTRAINT "EmailVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,
    "email_verified" INTEGER NOT NULL DEFAULT 0,
    "two_factor_verified" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PasswordResetSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TotpCredential" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" BYTEA NOT NULL,

    CONSTRAINT "TotpCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasskeyCredential" (
    "id" BYTEA NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" INTEGER NOT NULL,
    "public_key" BYTEA NOT NULL,

    CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityKeyCredential" (
    "id" BYTEA NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" INTEGER NOT NULL,
    "public_key" BYTEA NOT NULL,

    CONSTRAINT "SecurityKeyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "passWordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_user_id_key" ON "Session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationRequest_user_id_key" ON "EmailVerificationRequest"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetSession_user_id_key" ON "PasswordResetSession"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TotpCredential_user_id_key" ON "TotpCredential"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredential_user_id_key" ON "PasskeyCredential"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityKeyCredential_user_id_key" ON "SecurityKeyCredential"("user_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
