ALTER TABLE "events" DROP CONSTRAINT "events_domain_domain_metadata_domain_fk";--> statement-breakpoint
ALTER TABLE "domain_metadata" RENAME TO "domains";--> statement-breakpoint
ALTER TABLE "domains" ADD COLUMN "is_miniapp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_domain_domains_domain_fk" FOREIGN KEY ("domain") REFERENCES "public"."domains"("domain") ON DELETE set null ON UPDATE no action;
