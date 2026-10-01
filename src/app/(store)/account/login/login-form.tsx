"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    const { error } = await authClient.signIn.email({
      email: String(f.get("email")),
      password: String(f.get("password")),
      rememberMe: true,
    });
    setPending(false);
    if (error) return setError(error.status === 429 ? "Too many attempts. Please wait a minute." : "Incorrect email or password.");
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">Password</label>
          <Link href="/account/forgot-password" className="text-xs text-muted underline">Forgot password?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
