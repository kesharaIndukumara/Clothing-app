"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { DISTRICTS, deliveryFeeFor } from "@/lib/config";
import { normalizePhone } from "@/lib/format";
import { payhereEnabled } from "@/lib/payhere";

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

  if (data.paymentMethod === "CARD" && !payhereEnabled()) {
    return { ok: false, error: "Card payment isn't available right now. Please choose cash on delivery." };
  }

  // Merge duplicate lines
  const qtyByVariant = new Map<string, number>();
  for (const i of data.items) qtyByVariant.set(i.variantId, (qtyByVariant.get(i.variantId) ?? 0) + i.qty);

  try {
    const order = await db.transaction(async (tx) => {
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
          throw new CheckoutError(
            `Sorry, only ${v.stock} left of ${v.product.name} (${v.color}, ${v.size}). Please update your bag.`,
          );
        }
        // Price always comes from the database, never from the browser
        lines.push({ v, qty, price: v.product.price });
      }

      const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
      const deliveryFee = deliveryFeeFor(data.district, subtotal);

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
          customerName: data.customerName,
          phone: data.phone,
          email: data.email || null,
          address: data.address,
          city: data.city,
          district: data.district,
          note: data.note || null,
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          paymentMethod: data.paymentMethod,
        })
        .returning();

      await tx.insert(t.orderItems).values(
        lines.map((l) => ({
          orderId: created.id,
          productId: l.v.productId,
          variantId: l.v.id,
          productName: l.v.product.name,
          size: l.v.size,
          color: l.v.color,
          image: l.v.product.images[0]?.url ?? null,
          price: l.price,
          quantity: l.qty,
        })),
      );
      await tx.insert(t.orderEvents).values({
        orderId: created.id,
        message: `Order placed (${data.paymentMethod === "COD" ? "cash on delivery" : "card payment"})`,
      });
      return created;
    });

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
