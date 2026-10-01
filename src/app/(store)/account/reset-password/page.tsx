import Link from "next/link";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPage(props: PageProps<"/account/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;
  if (!token || sp.error) {
    return (
      <AuthCard title="Link expired" subtitle="This reset link is invalid or has expired.">
        <Link href="/account/forgot-password" className="btn w-full">Send a new link</Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password">
      <ResetForm token={token} />
    </AuthCard>
  );
}
