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

// Kategorien für Aufgaben
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Tailwind color class, z.B. "rose", "sky", "amber"
  icon: text("icon"), // Emoji oder Icon-Name
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Aufgaben
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: text("category_id"), // Optional - kann auch ohne Kategorie sein
  title: text("title").notNull(),
  notes: text("notes"), // Zusätzliche Notizen
  priority: text("priority").notNull().default("medium"), // low, medium, high
  estimatedMinutes: integer("estimated_minutes"), // Geschätzte Dauer in Minuten
  dueDate: integer("due_date", { mode: "timestamp" }), // Optional - Fälligkeitsdatum
  completedAt: integer("completed_at", { mode: "timestamp" }), // Wann erledigt
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
