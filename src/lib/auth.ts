import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export async function createSession(adminId: string, email: string) {
  const token = await signSession({ adminId, email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Returns the logged-in admin, or null. */
export async function getAdmin() {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const admin = await db.query.adminUsers.findFirst({
    where: eq(t.adminUsers.id, session.adminId),
    columns: { id: true, name: true, email: true },
  });
  return admin ?? null;
}

/**
 * Call at the top of every admin page and admin Server Action.
 * Server Actions are public HTTP endpoints, so the proxy check alone is not enough.
 */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

// ---- Simple in-memory login rate limit (fine for a single server) ----
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function loginAllowed(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) return true;
  return entry.count < MAX_ATTEMPTS;
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else entry.count++;
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
