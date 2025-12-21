import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL || "file:./data/app.db";

const client = createClient({
  url: dbPath,
});

export const db = drizzle(client, { schema });
