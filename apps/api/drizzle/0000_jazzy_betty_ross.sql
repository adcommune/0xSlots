CREATE TYPE "public"."auth_type" AS ENUM('none', 'farcaster');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('view', 'click');--> statement-breakpoint
CREATE TABLE "domain_metadata" (
	"domain" text PRIMARY KEY NOT NULL,
	"manifest" jsonb,
	"owner" jsonb,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "event_type" NOT NULL,
	"authType" "auth_type" DEFAULT 'none' NOT NULL,
	"domain" text,
	"slot_address" text,
	"cid" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_domain_domain_metadata_domain_fk" FOREIGN KEY ("domain") REFERENCES "public"."domain_metadata"("domain") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_events_domain" ON "events" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_events_type" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_events_auth_type" ON "events" USING btree ("authType");--> statement-breakpoint
CREATE INDEX "idx_events_created_at" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_events_slot_address" ON "events" USING btree ("slot_address");--> statement-breakpoint
CREATE INDEX "idx_events_slot_address_cid" ON "events" USING btree ("slot_address","cid");