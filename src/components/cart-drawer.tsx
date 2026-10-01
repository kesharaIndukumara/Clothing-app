"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./cart-context";
import { CloseIcon } from "./icons";
import { formatPrice } from "@/lib/format";
import { QtyStepper } from "./qty-stepper";

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, setQty, remove } = useCart();
  const close = () => setDrawerOpen(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl">Your bag</h2>
          <button onClick={close} aria-label="Close cart" className="p-1"><CloseIcon /></button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted">Your bag is empty.</p>
            <Link href="/shop" onClick={close} className="btn">Start shopping</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.variantId} className="flex gap-4 py-4">
                  <Link href={`/products/${i.slug}`} onClick={close} className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-line">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-medium">{i.name}</p>
                      <p className="text-sm">{formatPrice(i.price * i.qty)}</p>
                    </div>
                    <p className="text-xs text-muted">{i.color} · {i.size}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={i.qty} max={i.maxStock} onChange={(q) => setQty(i.variantId, q)} />
                      <button onClick={() => remove(i.variantId)} className="text-xs text-muted underline">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Delivery is calculated at checkout.</p>
              <Link href="/checkout" onClick={close} className="btn w-full">Checkout</Link>
              <Link href="/cart" onClick={close} className="block text-center text-xs underline">View bag</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
