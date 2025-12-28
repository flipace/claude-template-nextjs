import { createClient, Client } from "@libsql/client";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "file:./data/app.db";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: dbPath,
    });
  }
  return client;
}

function getDb(): LibSQLDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    const value = (realDb as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
