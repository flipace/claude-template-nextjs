import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Use data directory for persistent storage (can be mounted as volume)
const dbPath = process.env.DATABASE_URL || "file:./data/app.db";

const client = createClient({
  url: dbPath,
});

export const db = drizzle(client, { schema });

// Track if init is complete
let initPromise: Promise<void> | null = null;

// Auto-create tables if they don't exist
const initDb = async () => {
  try {
    // Create users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT,
        avatar TEXT,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);

    // Add new columns if they don't exist (for migrations)
    const userColumns = await client.execute(`PRAGMA table_info(users)`);
    const hasDisplayName = userColumns.rows.some((row: Record<string, unknown>) => row.name === "display_name");
    const hasAvatar = userColumns.rows.some((row: Record<string, unknown>) => row.name === "avatar");

    if (!hasDisplayName) {
      await client.execute(`ALTER TABLE users ADD COLUMN display_name TEXT`);
    }
    if (!hasAvatar) {
      await client.execute(`ALTER TABLE users ADD COLUMN avatar TEXT`);
    }

    console.log("Database initialized");
  } catch (e) {
    console.error("DB init error:", e);
    throw e;
  }
};

// Start init and export promise for waiting
initPromise = initDb();

export { initPromise };
