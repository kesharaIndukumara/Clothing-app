"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart-context";
import { FREE_DELIVERY_OVER } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

type Props = { districts: Record<string, number>; cardEnabled: boolean };

export function CheckoutForm({ districts, cardEnabled }: Props) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [district, setDistrict] = useState("");
  const [payment, setPayment] = useState<"COD" | "CARD">("COD");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!ready) return <div className="py-24" />;
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link href="/shop" className="btn mt-6">Continue shopping</Link>
      </div>
    );
  }

  const freeDelivery = FREE_DELIVERY_OVER > 0 && subtotal >= FREE_DELIVERY_OVER;
  const fee = !district ? null : freeDelivery ? 0 : districts[district];

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setError("");
    setFieldErrors({});
    startTransition(async () => {
      const res = await placeOrder({
        customerName: get("customerName"),
        phone: get("phone"),
        email: get("email"),
        address: get("address"),
        city: get("city"),
        district: get("district"),
        note: get("note"),
        paymentMethod: payment,
        items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      });
      if (res.ok) {
        clear();
        router.push(res.redirectTo);
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const err = (k: string) => fieldErrors[k] && <p className="mt-1 text-xs text-red-700">{fieldErrors[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section>
          <h2 className="mb-4 font-display text-xl">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customerName">Full name</label>
              <input id="customerName" name="customerName" className="input" autoComplete="name" required />
              {err("customerName")}
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" name="phone" className={`input ${fieldErrors.phone ? "border-red-400" : ""}`} inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" required />
              {err("phone")}
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input id="email" name="email" type="email" className="input" autoComplete="email" />
              {err("email")}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl">Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Address</label>
              <textarea id="address" name="address" rows={2} className="input" autoComplete="street-address" required />
              {err("address")}
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" name="city" className="input" autoComplete="address-level2" required />
              {err("city")}
            </div>
            <div>
              <label className="label" htmlFor="district">District</label>
              <select id="district" name="district" className="input" value={district} onChange={(e) => setDistrict(e.target.value)} required>
                <option value="">Choose district</option>
                {Object.keys(districts).sort().map((d) => <option key={d}>{d}</option>)}
              </select>
              {err("district")}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="note">Order note (optional)</label>
              <input id="note" name="note" className="input" placeholder="e.g. Call before delivery" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl">Payment</h2>
          <div className="space-y-3">
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${payment === "COD" ? "border-ink bg-card" : "border-line"}`}>
              <input type="radio" name="payment" checked={payment === "COD"} onChange={() => setPayment("COD")} className="mt-1 accent-ink" />
              <span>
                <span className="block font-medium">Cash on delivery</span>
                <span className="text-sm text-muted">Pay the courier in cash when your order arrives.</span>
              </span>
            </label>
            <label className={`flex items-start gap-3 rounded-xl border p-4 ${!cardEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${payment === "CARD" ? "border-ink bg-card" : "border-line"}`}>
              <input type="radio" name="payment" disabled={!cardEnabled} checked={payment === "CARD"} onChange={() => setPayment("CARD")} className="mt-1 accent-ink" />
              <span>
                <span className="block font-medium">Card / online payment</span>
                <span className="text-sm text-muted">
                  {cardEnabled ? "Visa, Mastercard, Amex, eZ Cash and more, processed securely by PayHere." : "Coming soon."}
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-line bg-card p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-xl">Order summary</h2>
        <ul className="mt-4 divide-y divide-line">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-3 py-3">
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-line">
                {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-paper">{i.qty}</span>
              </div>
              <div className="flex-1 text-sm">
                <p>{i.name}</p>
                <p className="text-xs text-muted">{i.color} · {i.size}</p>
              </div>
              <p className="text-sm">{formatPrice(i.price * i.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{fee === null ? <span className="text-muted">Choose district</span> : fee === 0 ? "Free" : formatPrice(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt><dd>{formatPrice(subtotal + (fee ?? 0))}</dd>
          </div>
        </dl>
        <button type="submit" disabled={pending} className="btn mt-6 w-full py-4">
          {pending ? "Placing order…" : payment === "CARD" ? "Continue to payment" : "Place order"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          By placing your order you agree to our <Link href="/policies/terms" className="underline">terms</Link>.
        </p>
      </aside>
    </form>
  );
}
