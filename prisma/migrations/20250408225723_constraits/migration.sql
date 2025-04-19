/*
  Warnings:

  - The primary key for the `EmailVerificationRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PasskeyCredential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PasswordResetSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SecurityKeyCredential` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `EmailVerificationRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `PasskeyCredential` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `PasswordResetSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `SecurityKeyCredential` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "EmailVerificationRequest" DROP CONSTRAINT "EmailVerificationRequest_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "EmailVerificationRequest_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PasskeyCredential" DROP CONSTRAINT "PasskeyCredential_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PasswordResetSession" DROP CONSTRAINT "PasswordResetSession_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "PasswordResetSession_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SecurityKeyCredential" DROP CONSTRAINT "SecurityKeyCredential_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "SecurityKeyCredential_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
