import { doublePrecision, integer, pgTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const profilesTable = pgTable("profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  age: integer("age").notNull(),
  bio: text("bio").notNull().default(""),
  seeking: varchar("seeking").notNull().default(""),
  photoUrl: varchar("photo_url"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const swipeDirectionValues = ["like", "pass", "superlike"] as const;

export const swipesTable = pgTable(
  "swipes",
  {
    swiperId: varchar("swiper_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    targetId: varchar("target_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    direction: varchar("direction", { enum: swipeDirectionValues }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.swiperId, table.targetId] })],
);

export const matchesTable = pgTable(
  "matches",
  {
    userAId: varchar("user_a_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    userBId: varchar("user_b_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userAId, table.userBId] })],
);

export const blocksTable = pgTable(
  "blocks",
  {
    blockerId: varchar("blocker_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    blockedId: varchar("blocked_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.blockerId, table.blockedId] })],
);

export type Profile = typeof profilesTable.$inferSelect;
export type UpsertProfile = typeof profilesTable.$inferInsert;
export type Swipe = typeof swipesTable.$inferSelect;
export type Match = typeof matchesTable.$inferSelect;
export type Block = typeof blocksTable.$inferSelect;
