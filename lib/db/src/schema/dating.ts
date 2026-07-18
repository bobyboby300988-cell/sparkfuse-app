import { boolean, doublePrecision, index, integer, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
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
  city: varchar("city"),
  country: varchar("country"),
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
  (table) => [
    primaryKey({ columns: [table.swiperId, table.targetId] }),
    index("swipes_target_id_idx").on(table.targetId),
  ],
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
  (table) => [
    primaryKey({ columns: [table.userAId, table.userBId] }),
    index("matches_user_b_id_idx").on(table.userBId),
  ],
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
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index("blocks_blocked_id_idx").on(table.blockedId),
  ],
);

export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    receiverId: varchar("receiver_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    text: text("text"),
    mediaUrl: text("media_url"),
    mediaType: varchar("media_type"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("messages_sender_id_idx").on(table.senderId),
    index("messages_receiver_id_idx").on(table.receiverId),
  ],
);

export const userPhotosTable = pgTable(
  "user_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    objectPath: text("object_path").notNull(),
    isExclusive: boolean("is_exclusive").notNull().default(false),
    mediaType: varchar("media_type", { enum: ["image", "video"] }).notNull().default("image"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_photos_user_id_idx").on(table.userId),
  ],
);

export const callsTable = pgTable("calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  callerId: varchar("caller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  calleeId: varchar("callee_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  roomUrl: text("room_url").notNull(),
  callerToken: text("caller_token").notNull(),
  isVoice: boolean("is_voice").notNull().default(false),
  callerName: varchar("caller_name"),
  callerPhoto: text("caller_photo"),
  status: varchar("status", { enum: ["pending", "accepted", "declined", "ended", "missed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Call = typeof callsTable.$inferSelect;

export type Profile = typeof profilesTable.$inferSelect;
export type UpsertProfile = typeof profilesTable.$inferInsert;
export type Swipe = typeof swipesTable.$inferSelect;
export type Match = typeof matchesTable.$inferSelect;
export type Block = typeof blocksTable.$inferSelect;
export type ServerMessage = typeof messagesTable.$inferSelect;
export type UserPhoto = typeof userPhotosTable.$inferSelect;
