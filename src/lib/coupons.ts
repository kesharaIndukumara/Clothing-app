import "server-only";
import { and, eq, notInArray, or } from "drizzle-orm";
import { db, t } from "@/db";
import type { CouponType } from "@/db/schema";
import { formatPrice } from "./format";

export type CouponResult =
  | { ok: true; code: string; type: CouponType; discount: number; freeDelivery: boolean; label: string }
  | { ok: false; error: string };

/**
 * Checks a coupon against the cart and works out the discount.
 * Discounts apply to the item subtotal; FREE_DELIVERY removes the delivery fee.
 */
export async function evaluateCoupon(
  rawCode: string,
  subtotal: number,
  who: { userId?: string | null; phone?: string | null },
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code" };
  const c = await db.query.coupons.findFirst({ where: eq(t.coupons.code, code) });
  const now = new Date();
  if (!c || !c.active) return { ok: false, error: "This code isn't valid" };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "This code isn't active yet" };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, error: "This code has expired" };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, error: "This code has been fully used" };
  if (subtotal < c.minSubtotal) return { ok: false, error: `Spend ${formatPrice(c.minSubtotal)} or more to use this code` };

  if (c.onePerCustomer && (who.userId || who.phone)) {
    const used = await db.query.orders.findFirst({
      where: and(
        eq(t.orders.couponCode, code),
        notInArray(t.orders.status, ["CANCELLED"]),
        or(who.userId ? eq(t.orders.userId, who.userId) : undefined, who.phone ? eq(t.orders.phone, who.phone) : undefined),
      ),
      columns: { id: true },
    });
    if (used) return { ok: false, error: "You've already used this code" };
  }

  const discount =
    c.type === "PERCENT" ? Math.floor((subtotal * Math.min(c.value, 100)) / 100)
    : c.type === "FIXED" ? Math.min(c.value, subtotal)
    : 0;
  const label =
    c.type === "PERCENT" ? `${c.value}% off`
    : c.type === "FIXED" ? `${formatPrice(c.value)} off`
    : "Free delivery";
  return { ok: true, code, type: c.type, discount, freeDelivery: c.type === "FREE_DELIVERY", label };
}
