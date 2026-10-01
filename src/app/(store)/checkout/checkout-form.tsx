"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useCart } from "@/components/cart-context";
import { FREE_DELIVERY_OVER } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/track";
import { placeOrder, previewCoupon } from "./actions";

type SavedAddress = { id: string; fullName: string; phone: string; address: string; city: string; district: string };
type Props = {
  districts: Record<string, number>;
  cardEnabled: boolean;
  customer: { name: string; email: string } | null;
  addresses: SavedAddress[];
};
type AppliedCoupon = { code: string; discount: number; freeDelivery: boolean; label: string };

export function CheckoutForm({ districts, cardEnabled, customer, addresses }: Props) {
  const { items, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const first = addresses[0];
  const [district, setDistrict] = useState(first?.district ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [checkingCoupon, startCoupon] = useTransition();
  const tracked = useRef(false);

  useEffect(() => {
    if (ready && items.length && !tracked.current) {
      tracked.current = true;
      track("begin_checkout", { value: subtotal, items: items.map((i) => ({ id: i.variantId, name: i.name, price: i.price, quantity: i.qty })) });
    }
  }, [ready, items, subtotal]);

  // If the cart changes after a coupon was applied, drop it so the amount is never stale
  const cartKey = items.map((i) => `${i.variantId}:${i.qty}`).join(",");
  const appliedFor = useRef("");
  useEffect(() => {
    if (coupon && appliedFor.current !== cartKey) setCoupon(null);
  }, [cartKey, coupon]);

  function fillAddress(a: SavedAddress) {
    const f = formRef.current;
    if (!f) return;
    (f.elements.namedItem("customerName") as HTMLInputElement).value = a.fullName;
    (f.elements.namedItem("phone") as HTMLInputElement).value = a.phone;
    (f.elements.namedItem("address") as HTMLTextAreaElement).value = a.address;
    (f.elements.namedItem("city") as HTMLInputElement).value = a.city;
    setDistrict(a.district);
  }

  function applyCoupon() {
    setCouponMsg("");
    const phone = (formRef.current?.elements.namedItem("phone") as HTMLInputElement | null)?.value;
    startCoupon(async () => {
      const res = await previewCoupon(couponInput, items.map((i) => ({ variantId: i.variantId, qty: i.qty })), phone);
      if (res.ok) {
        appliedFor.current = cartKey;
        setCoupon({ code: res.code, discount: res.discount, freeDelivery: res.freeDelivery, label: res.label });
      } else {
        setCoupon(null);
        setCouponMsg(res.error);
      }
    });
  }
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

  const freeDelivery = (FREE_DELIVERY_OVER > 0 && subtotal >= FREE_DELIVERY_OVER) || Boolean(coupon?.freeDelivery);
  const fee = !district ? null : freeDelivery ? 0 : districts[district];
  const discount = coupon?.discount ?? 0;

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
        couponCode: coupon?.code,
        saveAddress: f.get("saveAddress") === "on",
        paymentMethod: payment,
        items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      });
      if (res.ok) {
        clear();
        router.push(res.redirectTo);
      } else {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        if (res.fieldErrors?.couponCode) setCoupon(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  const err = (k: string) => fieldErrors[k] && <p className="mt-1 text-xs text-red-700">{fieldErrors[k]}</p>;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

        <section>
          <h2 className="mb-4 font-display text-xl">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customerName">Full name</label>
              <input id="customerName" name="customerName" className="input" autoComplete="name" required defaultValue={first?.fullName ?? customer?.name} />
              {err("customerName")}
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" name="phone" className={`input ${fieldErrors.phone ? "border-red-400" : ""}`} inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" required defaultValue={first?.phone} />
              {err("phone")}
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input id="email" name="email" type="email" className="input" autoComplete="email" defaultValue={customer?.email} />
              {err("email")}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl">Delivery address</h2>
          {addresses.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {addresses.map((a) => (
                <button key={a.id} type="button" onClick={() => fillAddress(a)} className="rounded-full border border-line bg-card px-3 py-1.5 text-xs hover:border-ink">
                  {a.fullName} · {a.city}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Address</label>
              <textarea id="address" name="address" rows={2} className="input" autoComplete="street-address" required defaultValue={first?.address} />
              {err("address")}
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" name="city" className="input" autoComplete="address-level2" required defaultValue={first?.city} />
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
            {customer && (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="saveAddress" defaultChecked={addresses.length === 0} className="accent-ink" /> Save this address to my account
              </label>
            )}
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
        <div className="mt-4 border-t border-line pt-4">
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-sm">
              <span><strong>{coupon.code}</strong> · {coupon.label}</span>
              <button type="button" onClick={() => { setCoupon(null); setCouponInput(""); }} className="text-xs text-muted underline">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                placeholder="Discount code"
                aria-label="Discount code"
                className="input py-2"
              />
              <button type="button" onClick={applyCoupon} disabled={!couponInput || checkingCoupon} className="btn-outline btn-sm shrink-0">
                {checkingCoupon ? "…" : "Apply"}
              </button>
            </div>
          )}
          {couponMsg && <p className="mt-1.5 text-xs text-red-700">{couponMsg}</p>}
        </div>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
          {coupon && discount > 0 && (
            <div className="flex justify-between text-accent"><dt>Discount ({coupon.code})</dt><dd>−{formatPrice(discount)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{fee === null ? <span className="text-muted">Choose district</span> : fee === 0 ? "Free" : formatPrice(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt><dd>{formatPrice(subtotal - discount + (fee ?? 0))}</dd>
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
