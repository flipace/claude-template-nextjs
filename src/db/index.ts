import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "file:./data/app.db";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;
let migrated = false;

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar TEXT,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id TEXT,
    title TEXT NOT NULL,
    notes TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    estimated_minutes INTEGER,
    due_date INTEGER,
    completed_at INTEGER,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`
];

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: dbPath,
    });
  }
  return client;
}

async function runMigrations() {
  if (migrated) return;
  const c = getClient();
  for (const sql of migrations) {
    await c.execute(sql);
  }
  migrated = true;
  console.log("Database migrations completed");
}

function getDb(): LibSQLDatabase<typeof schema> {
  if (!database) {
    // Run migrations synchronously on first access
    runMigrations().catch(console.error);
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (realDb as any)[prop];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
