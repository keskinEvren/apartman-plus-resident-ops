ALTER TABLE "users" DROP COLUMN IF EXISTS "two_factor_secret";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "two_factor_enabled";