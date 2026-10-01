"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const newPassword = String(f.get("password"));
    if (newPassword !== String(f.get("confirm"))) return setError("Passwords don't match.");
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) return setError("This link has expired. Please request a new one.");
    router.push("/account/login?reset=1");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required minLength={8} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Saving…" : "Save password"}</button>
    </form>
  );
}
