import {
  text,
  varchar,
  uuid,
  timestamp,
  pgEnum,
  pgTable,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import type { ParsedAccountAssociation } from "@adland/data";
import { relations } from "drizzle-orm";

export const eventType = pgEnum("event_type", ["view", "click"]);

export const authType = pgEnum("auth_type", ["none", "farcaster"]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: eventType().notNull(),
    authType: authType().default("none").notNull(),
    domain: text("domain").references(() => domainMetadata.domain, {
      onDelete: "set null",
    }),
    slotAddress: text("slot_address"),
    cid: varchar("cid", { length: 256 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_events_domain").on(t.domain),
    index("idx_events_type").on(t.type),
    index("idx_events_auth_type").on(t.authType),
    index("idx_events_created_at").on(t.createdAt),
    index("idx_events_slot_address").on(t.slotAddress),
    index("idx_events_slot_address_cid").on(t.slotAddress, t.cid),
  ],
);

export const eventRelations = relations(events, ({ one }) => ({
  domainMetadata: one(domainMetadata, {
    fields: [events.domain],
    references: [domainMetadata.domain],
  }),
}));

export const domainMetadata = pgTable("domain_metadata", {
  domain: text("domain").primaryKey(),
  manifest: jsonb("manifest").$type<Record<string, unknown>>(),
  owner: jsonb("owner").$type<
    ParsedAccountAssociation & { username?: string; pfpUrl?: string }
  >(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});

// Types
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type DomainMetadata = typeof domainMetadata.$inferSelect;
export type NewDomainMetadata = typeof domainMetadata.$inferInsert;
