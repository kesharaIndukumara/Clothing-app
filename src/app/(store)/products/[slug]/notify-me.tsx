"use client";
import { useState, useTransition } from "react";
import { subscribeStockAlert } from "../alert-actions";

export function NotifyMe({ variantId, label, defaultEmail = "" }: { variantId: string; label: string; defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, start] = useTransition();

  if (state.ok) {
    return (
      <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        We&apos;ll email <strong>{email}</strong> as soon as {label} is back in stock.
      </div>
    );
  }
  return (
    <form
      className="mt-7 rounded-xl border border-line bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setState(await subscribeStockAlert({ variantId, email })));
      }}
    >
      <p className="text-sm font-medium">{label} is sold out</p>
      <p className="mt-1 text-xs text-muted">Get an email when it&apos;s back. No spam, just this one alert.</p>
      <div className="mt-3 flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="input" />
        <button className="btn shrink-0 px-4" disabled={pending}>{pending ? "…" : "Notify me"}</button>
      </div>
      {state.error && <p className="mt-2 text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
