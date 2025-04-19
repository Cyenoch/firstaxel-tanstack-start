/*
  Warnings:

  - Changed the type of `expires_at` on the `EmailVerificationRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `expires_at` on the `PasswordResetSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "EmailVerificationRequest" DROP COLUMN "expires_at",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PasswordResetSession" DROP COLUMN "expires_at",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
