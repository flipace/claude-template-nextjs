import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as schema from "./schema";

// Use data directory for persistent storage (can be mounted as volume)
const dbPath = process.env.DATABASE_URL || "file:./data/appapp.db";

const client = createClient({
  url: dbPath,
});

export const db = drizzle(client, { schema });

// Default user ID (consistent for migrations)
const DEFAULT_USER_ID = "user_flipace";

// Track if init is complete
let initPromise: Promise<void> | null = null;

// Auto-create tables if they don't exist
const initDb = async () => {
  try {
    // Create users table first
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

    // Add new columns if they don't exist
    const userColumns = await client.execute(`PRAGMA table_info(users)`);
    const hasDisplayName = userColumns.rows.some((row: Record<string, unknown>) => row.name === "display_name");
    const hasAvatar = userColumns.rows.some((row: Record<string, unknown>) => row.name === "avatar");

    if (!hasDisplayName) {
      await client.execute(`ALTER TABLE users ADD COLUMN display_name TEXT`);
      console.log("Added display_name column to users");
    }
    if (!hasAvatar) {
      await client.execute(`ALTER TABLE users ADD COLUMN avatar TEXT`);
      console.log("Added avatar column to users");
    }

    console.log("Users table ready");

    // Create default user if not exists
    const existingUser = await client.execute({
      sql: `SELECT id FROM users WHERE id = ?`,
      args: [DEFAULT_USER_ID]
    });

    if (existingUser.rows.length === 0) {
      const passwordHash = await hash("klopfer1", 12);
      await client.execute({
        sql: `INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, unixepoch())`,
        args: [DEFAULT_USER_ID, "flipace", passwordHash]
      });
      console.log("Created default user: flipace");
    }

    // Check if apps table exists
    const tableCheck = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='apps'
    `);

    if (tableCheck.rows.length === 0) {
      // Create apps table with user_id
      await client.execute(`
        CREATE TABLE apps (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'user_flipace',
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'wip',
          types TEXT,
          repo_url TEXT,
          hosted_url TEXT,
          tags TEXT,
          screenshots TEXT,
          videos TEXT,
          started_at INTEGER NOT NULL DEFAULT (unixepoch()),
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        )
      `);
      console.log("Apps table created");
    } else {
      // Check if user_id column exists
      const columns = await client.execute(`PRAGMA table_info(apps)`);
      const hasUserId = columns.rows.some((row: Record<string, unknown>) => row.name === "user_id");
      const hasTypes = columns.rows.some((row: Record<string, unknown>) => row.name === "types");

      if (!hasTypes) {
        await client.execute(`ALTER TABLE apps ADD COLUMN types TEXT`);
        console.log("Added types column");
      }

      if (!hasUserId) {
        // Add user_id column with default value
        await client.execute(`ALTER TABLE apps ADD COLUMN user_id TEXT DEFAULT 'user_flipace'`);
        console.log("Added user_id column");

        // Update all existing rows
        await client.execute({
          sql: `UPDATE apps SET user_id = ? WHERE user_id IS NULL`,
          args: [DEFAULT_USER_ID]
        });
        console.log("Migrated existing apps to default user");
      }
    }

    // Create ideas table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        target_user_id TEXT NOT NULL,
        author_user_id TEXT NOT NULL,
        target_date INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
    console.log("Ideas table ready");

    console.log("DB init complete");
  } catch (e) {
    console.error("DB init error:", e);
    throw e;
  }
};

// Start init and export promise for waiting
initPromise = initDb();

export { initPromise };
