"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, t } from "@/db";
import { clearLoginAttempts, createSession, destroySession, loginAllowed, recordFailedLogin } from "@/lib/auth";

export async function login(_prev: { error: string; email: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}:${email}`;

  if (!loginAllowed(key)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again.", email };
  }

  const admin = await db.query.adminUsers.findFirst({ where: eq(t.adminUsers.email, email) });
  // Compare against a dummy hash when the user doesn't exist, so response time doesn't reveal valid emails
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5d1kQJ5wE6Gf6bKk1gk9vW2Uq8u7m9a");
  if (!admin || !ok) {
    recordFailedLogin(key);
    return { error: "Incorrect email or password.", email };
  }

  clearLoginAttempts(key);
  await createSession(admin.id, admin.email);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
