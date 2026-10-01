import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, t } from "@/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Puts an order's items back into stock (once). */
export async function restockOrder(tx: Tx, orderId: string) {
  const order = await tx.query.orders.findFirst({ where: eq(t.orders.id, orderId), with: { items: true } });
  if (!order || order.stockRestored) return;
  for (const item of order.items) {
    if (!item.variantId) continue; // variant was deleted
    await tx.update(t.variants)
      .set({ stock: sql`${t.variants.stock} + ${item.quantity}` })
      .where(eq(t.variants.id, item.variantId));
  }
  await tx.update(t.orders).set({ stockRestored: true }).where(eq(t.orders.id, orderId));
}

/** Takes stock again when a cancelled order is re-opened. Throws if not enough stock. */
export async function reserveOrderStock(tx: Tx, orderId: string) {
  const order = await tx.query.orders.findFirst({ where: eq(t.orders.id, orderId), with: { items: true } });
  if (!order || !order.stockRestored) return;
  for (const item of order.items) {
    if (!item.variantId) continue;
    const res = await tx.update(t.variants)
      .set({ stock: sql`${t.variants.stock} - ${item.quantity}` })
      .where(and(eq(t.variants.id, item.variantId), gte(t.variants.stock, item.quantity)));
    if (res.rowsAffected === 0) {
      throw new Error(`Not enough stock left for ${item.productName} (${item.color}, ${item.size}) to re-open this order`);
    }
  }
  await tx.update(t.orders).set({ stockRestored: false }).where(eq(t.orders.id, orderId));
}
