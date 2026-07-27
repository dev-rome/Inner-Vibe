import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  smallint,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Mood entries. One row per logged mood, owned by a user.
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    rating: smallint("rating").notNull(),

    note: varchar("note", { length: 1000 }),

    // numeric, not integer: people report sleep in half hours ("7.5"), and an
    // integer column silently rounds that away. precision 3 / scale 1 covers
    // 0.0-24.0 exactly. mode: "number" so Drizzle types it as a JS number
    // rather than the string it uses for arbitrary-precision numerics.
    sleepHours: numeric("sleep_hours", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    exercised: boolean("exercised"),

    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("entries_user_logged_idx").on(table.userId, table.loggedAt),
    check("rating_range", sql`${table.rating} BETWEEN 1 AND 6`),
    check(
      "sleep_hours_range",
      sql`${table.sleepHours} IS NULL OR ${table.sleepHours} BETWEEN 0 AND 24`,
    ),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    name: varchar("name", { length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_user_name_unique").on(table.userId, table.name),
    // Only one system tag (user_id NULL) per name — the (user_id, name) index
    // above won't catch this because Postgres treats NULLs as distinct.
    uniqueIndex("tags_system_name_unique")
      .on(table.name)
      .where(sql`${table.userId} IS NULL`),
  ],
);

// Join table: many-to-many between entries and tags.
export const entryTags = pgTable(
  "entry_tags",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.entryId, table.tagId] })],
);
