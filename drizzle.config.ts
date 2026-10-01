import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./data/store.db";
const remote = !url.startsWith("file:");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Local file → "sqlite". Turso (libsql://...) → "turso" with an auth token.
  ...(remote
    ? { dialect: "turso", dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN! } }
    : { dialect: "sqlite", dbCredentials: { url } }),
});
