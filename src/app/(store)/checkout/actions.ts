"use server";

import { and, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { DISTRICTS, deliveryFeeFor, store } from "@/lib/config";
import { evaluateCoupon } from "@/lib/coupons";
import { getCustomer } from "@/lib/customer-auth";
import { adminNewOrderEmail, orderConfirmationEmail, sendEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/format";
import { payhereEnabled } from "@/lib/payhere";
import { saveAddressFor } from "@/lib/addresses";

const schema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(100),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => /^0\d{9}$/.test(p), "Enter a valid Sri Lankan mobile number, e.g. 0771234567"),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  address: z.string().trim().min(5, "Please enter your full address").max(300),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  district: z.string().refine((d) => d in DISTRICTS, "Choose your district"),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["COD", "CARD"]),
  couponCode: z.string().trim().max(40).optional(),
  saveAddress: z.boolean().optional(),
  items: z
    .array(z.object({ variantId: z.string().min(1), qty: z.number().int().min(1).max(20) }))
    .min(1, "Your bag is empty"),
});

export type CheckoutInput = z.input<typeof schema>;
export type CheckoutResult =
  | { ok: true; orderNumber: string; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

class CheckoutError extends Error {}

function makeOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KS${ymd}${rand}`;
}

/** Lets the checkout page preview a coupon before the order is placed. */
export async function previewCoupon(code: string, items: { variantId: string; qty: number }[], phone?: string) {
  const subtotal = await subtotalFor(items);
  const customer = await getCustomer();
  return evaluateCoupon(code, subtotal, { userId: customer?.id, phone: phone ? normalizePhone(phone) : null });
}

async function subtotalFor(items: { variantId: string; qty: number }[]) {
  let subtotal = 0;
  for (const i of items.slice(0, 50)) {
    const v = await db.query.variants.findFirst({ where: eq(t.variants.id, i.variantId), with: { product: { columns: { price: true } } } });
    if (v) subtotal += v.product.price * Math.max(1, Math.min(20, Math.floor(i.qty)));
  }
  return subtotal;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;
  const customer = await getCustomer();

  if (data.paymentMethod === "CARD" && !payhereEnabled()) {
    return { ok: false, error: "Card payment isn't available right now. Please choose cash on delivery." };
  }

  // Merge duplicate lines
  const qtyByVariant = new Map<string, number>();
  for (const i of data.items) qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.qty);

  // Check the coupon up-front so the customer gets a clear message
  let coupon: Awaited<ReturnType<typeof evaluateCoupon>> | null = null;
  if (data.couponCode) {
    coupon = await evaluateCoupon(data.couponCode, await subtotalFor(data.items), { userId: customer?.id, phone: data.phone });
    if (!coupon.ok) return { ok: false, error: `Discount code: ${coupon.error}`, fieldErrors: { couponCode: coupon.error } };
  }

  try {
    const { order, lines } = await db.transaction(async (tx) => {
      const lines = [];
      for (const [variantId, qty] of qtyByVariant) {
        const v = await tx.query.variants.findFirst({
          where: eq(t.variants.id, variantId),
          with: { product: { with: { images: { limit: 1, orderBy: t.productImages.position } } } },
        });
        if (!v || !v.product.active) throw new CheckoutError("An item in your bag is no longer available. Please remove it and try again.");

        // Only decrement if enough stock remains, so two buyers can't both get the last item
        const res = await tx
          .update(t.variants)
          .set({ stock: sql`${t.variants.stock} - ${qty}` })
          .where(and(eq(t.variants.id, variantId), gte(t.variants.stock, qty)));
        if (res.rowsAffected === 0) {
          throw new CheckoutError(`Sorry, only ${v.stock} left of ${v.product.name} (${v.color}, ${v.size}). Please update your bag.`);
        }
        // Price always comes from the database, never from the browser
        lines.push({ v, qty, price: v.product.price });
      }

      const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
      let discount = 0;
      let deliveryFee = deliveryFeeFor(data.district, subtotal);
      let couponCode: string | null = null;

      if (coupon?.ok) {
        // Re-check against the final subtotal, and claim a use atomically
        const final = await evaluateCoupon(coupon.code, subtotal, { userId: customer?.id, phone: data.phone });
        if (!final.ok) throw new CheckoutError(`Discount code: ${final.error}`);
        const claimed = await tx
          .update(t.coupons)
          .set({ usedCount: sql`${t.coupons.usedCount} + 1` })
          .where(and(eq(t.coupons.code, final.code), or(isNull(t.coupons.maxUses), lt(t.coupons.usedCount, t.coupons.maxUses))));
        if (claimed.rowsAffected === 0) throw new CheckoutError("Discount code: this code has been fully used");
        discount = final.discount;
        if (final.freeDelivery) deliveryFee = 0;
        couponCode = final.code;
      }

      let orderNumber = makeOrderNumber();
      for (let i = 0; i < 5; i++) {
        const clash = await tx.query.orders.findFirst({ where: eq(t.orders.orderNumber, orderNumber), columns: { id: true } });
        if (!clash) break;
        orderNumber = makeOrderNumber();
      }

      const [created] = await tx
        .insert(t.orders)
        .values({
          orderNumber,
          userId: customer?.id ?? null,
          customerName: data.customerName,
          phone: data.phone,
          email: data.email || customer?.email || null,
          address: data.address,
          city: data.city,
          district: data.district,
          note: data.note || null,
          subtotal,
          discount,
          couponCode,
          deliveryFee,
          total: subtotal - discount + deliveryFee,
          paymentMethod: data.paymentMethod,
        })
        .returning();

      const itemRows = lines.map((l) => ({
        orderId: created.id,
        productId: l.v.productId,
        variantId: l.v.id,
        productName: l.v.product.name,
        size: l.v.size,
        color: l.v.color,
        image: l.v.product.images[0]?.url ?? null,
        price: l.price,
        quantity: l.qty,
      }));
      await tx.insert(t.orderItems).values(itemRows);
      await tx.insert(t.orderEvents).values({
        orderId: created.id,
        message: `Order placed (${data.paymentMethod === "COD" ? "cash on delivery" : "card payment"})${couponCode ? ` with code ${couponCode}` : ""}`,
      });
      return { order: created, lines: itemRows };
    });

    // After the order is safely saved: address book + emails (failures here never fail the order)
    if (customer && data.saveAddress) {
      await saveAddressFor(customer.id, {
        fullName: data.customerName, phone: data.phone, address: data.address, city: data.city, district: data.district,
      }).catch(() => {});
    }
    if (order.paymentMethod === "COD") {
      const mail = { ...order, items: lines };
      if (order.email) await sendEmail({ to: order.email, ...orderConfirmationEmail(mail) });
      const adminTo = process.env.ADMIN_NOTIFY_EMAIL ?? store.email;
      if (adminTo) await sendEmail({ to: adminTo, ...adminNewOrderEmail(mail) });
    }
    // Card orders get their emails once PayHere confirms the payment

    return {
      ok: true,
      orderNumber: order.orderNumber,
      redirectTo: order.paymentMethod === "CARD" ? `/pay/${order.orderNumber}` : `/order/${order.orderNumber}?new=1`,
    };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    console.error("Checkout failed", e);
    return { ok: false, error: "Something went wrong placing your order. Please try again." };
  }
}
