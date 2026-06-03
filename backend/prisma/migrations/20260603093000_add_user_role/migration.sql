-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Promote owner account
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = 'rstnpro@gmail.com';
