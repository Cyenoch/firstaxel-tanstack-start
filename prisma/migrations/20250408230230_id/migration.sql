/*
  Warnings:

  - The primary key for the `EmailVerificationRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PasskeyCredential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PasswordResetSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SecurityKeyCredential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "EmailVerificationRequest" DROP CONSTRAINT "EmailVerificationRequest_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmailVerificationRequest_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PasskeyCredential" DROP CONSTRAINT "PasskeyCredential_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PasswordResetSession" DROP CONSTRAINT "PasswordResetSession_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PasswordResetSession_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SecurityKeyCredential" DROP CONSTRAINT "SecurityKeyCredential_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SecurityKeyCredential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
