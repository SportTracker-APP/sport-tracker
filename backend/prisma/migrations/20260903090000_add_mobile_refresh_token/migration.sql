-- Keep native refresh rotation independent from the existing browser cookie session.
ALTER TABLE "User"
ADD COLUMN "mobileRefreshToken" TEXT;
