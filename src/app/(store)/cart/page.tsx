"use client";
import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { QtyStepper } from "@/components/qty-stepper";
import { FREE_DELIVERY_OVER } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQty, remove, ready } = useCart();
  if (!ready) return <div className="container-x py-24" />;

  const toFree = FREE_DELIVERY_OVER - subtotal;

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">Your bag</h1>
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted">Your bag is empty.</p>
          <Link href="/shop" className="btn mt-6">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.variantId} className="flex gap-4 py-5">
                <Link href={`/products/${i.slug}`} className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-line">
                  {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link href={`/products/${i.slug}`} className="font-medium hover:underline">{i.name}</Link>
                    <p>{formatPrice(i.price * i.qty)}</p>
                  </div>
                  <p className="text-sm text-muted">{i.color} · Size {i.size} · {formatPrice(i.price)} each</p>
                  <div className="mt-auto flex items-center gap-4">
                    <QtyStepper value={i.qty} max={i.maxStock} onChange={(q) => setQty(i.variantId, q)} />
                    <button onClick={() => remove(i.variantId)} className="text-sm text-muted underline">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-xl border border-line bg-card p-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            {FREE_DELIVERY_OVER > 0 && (
              <p className="mt-3 text-xs text-muted">
                {toFree > 0 ? <>Add {formatPrice(toFree)} more for free delivery.</> : <>You get free delivery!</>}
              </p>
            )}
            <Link href="/checkout" className="btn mt-6 w-full">Checkout</Link>
            <Link href="/shop" className="mt-3 block text-center text-sm underline">Continue shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
