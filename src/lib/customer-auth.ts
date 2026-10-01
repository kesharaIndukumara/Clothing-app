import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, t } from "@/db";
import { store } from "./config";
import { passwordResetEmail, sendEmail } from "./email";

// Customer accounts. Admins use a separate login (src/lib/auth.ts).
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  appName: store.name,
  baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { user: t.user, session: t.session, account: t.account, verification: t.verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...passwordResetEmail(user.name, url) });
    },
  },
  socialProviders: googleEnabled
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
    : {},
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
  },
  rateLimit: { enabled: process.env.NODE_ENV === "production", window: 60, max: 30 },
  telemetry: { enabled: false },
  plugins: [nextCookies()],
});

export const isGoogleEnabled = () => googleEnabled;

/** The signed-in customer, or null. */
export async function getCustomer() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Use at the top of account pages and customer-only Server Actions. */
export async function requireCustomer(returnTo = "/account") {
  const user = await getCustomer();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}
