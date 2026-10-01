"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

type Props = { orderNumber: string; value: number; shipping: number; coupon: string | null; items: { id: string; name: string; price: number; quantity: number }[] };

/** Fires the purchase event once per order per browser, so refreshing doesn't double count. */
export function PurchaseTracker(props: Props) {
  useEffect(() => {
    const key = `tracked:${props.orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    track("purchase", props);
  }, [props]);
  return null;
}
