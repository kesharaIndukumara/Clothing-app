"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return setError("Passwords don't match.");
    setPending(true);
    setError("");
    const { error } = await authClient.signUp.email({
      name: String(f.get("name")).trim(),
      email: String(f.get("email")).trim(),
      password,
    });
    setPending(false);
    if (error) {
      return setError(
        error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
          ? "An account with this email already exists. Try signing in."
          : error.message ?? "Could not create your account.",
      );
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Full name</label>
        <input id="name" name="name" autoComplete="name" className="input" required minLength={2} />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" required minLength={8} />
        </div>
      </div>
      <p className="text-xs text-muted">At least 8 characters.</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    </form>
  );
}
