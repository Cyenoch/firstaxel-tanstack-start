/*
  Warnings:

  - The `email_verified` column on the `PasswordResetSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `two_factor_verified` column on the `PasswordResetSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `two_factor_verified` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordResetSession" DROP COLUMN "email_verified",
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "two_factor_verified",
ADD COLUMN     "two_factor_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "two_factor_verified",
ADD COLUMN     "two_factor_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "registered2FA" BOOLEAN,
ADD COLUMN     "registeredPasskey" BOOLEAN,
ADD COLUMN     "registeredRecoveryCode" BOOLEAN,
ADD COLUMN     "registeredSecurityKey" BOOLEAN,
ADD COLUMN     "registeredTOTP" BOOLEAN,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
