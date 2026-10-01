import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, isGoogleEnabled } from "@/lib/customer-auth";
import { AuthCard } from "../auth-card";
import { GoogleButton } from "../google-button";
import { safeNext } from "../safe-next";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/account/login">) {
  const sp = await props.searchParams;
  const next = safeNext(sp.next);
  if (await getCustomer()) redirect(next);
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to track orders, save addresses and keep a wishlist.">
      {sp.reset && <p className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Password updated. Please sign in.</p>}
      {isGoogleEnabled() && <GoogleButton next={next} />}
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        New here? <Link href={`/account/register?next=${encodeURIComponent(next)}`} className="text-ink underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}
