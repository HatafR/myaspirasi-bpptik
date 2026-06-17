-- Add trackingToken for VAPT IDOR remediation (ticket + secret token required to track)
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "trackingToken" TEXT;

-- Backfill existing rows before enforcing NOT NULL / UNIQUE
UPDATE "Ticket"
SET "trackingToken" = gen_random_uuid()::text
WHERE "trackingToken" IS NULL;

ALTER TABLE "Ticket" ALTER COLUMN "trackingToken" SET NOT NULL;
ALTER TABLE "Ticket" ALTER COLUMN "trackingToken" SET DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_trackingToken_key" ON "Ticket"("trackingToken");
