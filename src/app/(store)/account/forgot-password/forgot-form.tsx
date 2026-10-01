"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({
      email: String(new FormData(e.currentTarget).get("email")),
      redirectTo: "/account/reset-password",
    });
    setPending(false);
    setSent(true); // Same message whether or not the email exists
  }

  if (sent) {
    return (
      <div className="space-y-4 text-sm">
        <p>If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).</p>
        <Link href="/account/login" className="btn-outline w-full">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <button className="btn w-full" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}
