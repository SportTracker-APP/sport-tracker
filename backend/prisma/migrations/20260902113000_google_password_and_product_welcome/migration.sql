ALTER TABLE "User"
ADD COLUMN "passwordConfiguredAt" TIMESTAMP(3);

-- Existing email accounts already own their password. Google-only accounts
-- created without an email-verification token keep the setup state open.
UPDATE "User"
SET "passwordConfiguredAt" = "createdAt";

UPDATE "User" AS app_user
SET "passwordConfiguredAt" = NULL
WHERE app_user."googleSubject" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "EmailVerificationToken" AS verification
    WHERE verification."userId" = app_user."id"
  );

-- Do not show the new product welcome journey retroactively.
INSERT INTO "UserOnboardingState" (
  "id",
  "userId",
  "key",
  "version",
  "completedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'welcome_' || app_user."id",
  app_user."id",
  'product-welcome',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" AS app_user
ON CONFLICT ("userId", "key") DO NOTHING;
