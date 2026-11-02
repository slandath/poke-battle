ALTER TABLE "team" DROP CONSTRAINT "team_user_id_unique";--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "version" text DEFAULT 'red' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "enshrined_at" timestamp;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE UNIQUE INDEX "team_user_version_active_unique" ON "team" USING btree ("user_id","version") WHERE "status" = 'active';