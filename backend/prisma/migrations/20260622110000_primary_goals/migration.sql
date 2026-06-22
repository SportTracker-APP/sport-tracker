ALTER TABLE "Goal" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Goal_isPrimary_idx" ON "Goal"("isPrimary");
