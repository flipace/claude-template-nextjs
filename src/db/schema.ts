import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  avatar: text("avatar"), // URL to avatar image
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Add your tables here
// Example:
// export const posts = sqliteTable("posts", {
//   id: text("id").primaryKey(),
//   userId: text("user_id").notNull(),
//   title: text("title").notNull(),
//   content: text("content"),
//   createdAt: integer("created_at", { mode: "timestamp" })
//     .notNull()
//     .$defaultFn(() => new Date()),
// });

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
