import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Reuse one client in dev so hot reload doesn't open new connections
const g = globalThis as unknown as { __libsql?: Client };

const client =
  g.__libsql ??
  createClient({
    url: process.env.DATABASE_URL ?? "file:./data/store.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") g.__libsql = client;

export const db = drizzle(client, { schema });
export * as t from "./schema";
