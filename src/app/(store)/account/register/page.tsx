import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, isGoogleEnabled } from "@/lib/customer-auth";
import { AuthCard } from "../auth-card";
import { GoogleButton } from "../google-button";
import { safeNext } from "../safe-next";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage(props: PageProps<"/account/register">) {
  const sp = await props.searchParams;
  const next = safeNext(sp.next);
  if (await getCustomer()) redirect(next);
  return (
    <AuthCard title="Create an account" subtitle="Checkout faster and keep track of every order.">
      {isGoogleEnabled() && <GoogleButton next={next} />}
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-ink underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
