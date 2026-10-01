import "server-only";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { db, t } from "@/db";
import { backInStockEmail, sendEmail } from "./email";

/**
 * Emails everyone waiting for a variant that is now in stock.
 * Call after anything that can increase stock (saving a product, cancelling an order).
 */
export async function notifyRestocked(variantIds?: string[]) {
  if (variantIds && variantIds.length === 0) return 0;
  const pending = await db
    .select({
      alertId: t.stockAlerts.id,
      email: t.stockAlerts.email,
      color: t.variants.color,
      size: t.variants.size,
      name: t.products.name,
      slug: t.products.slug,
    })
    .from(t.stockAlerts)
    .innerJoin(t.variants, eq(t.variants.id, t.stockAlerts.variantId))
    .innerJoin(t.products, eq(t.products.id, t.variants.productId))
    .where(
      and(
        isNull(t.stockAlerts.notifiedAt),
        gt(t.variants.stock, 0),
        eq(t.products.active, true),
        variantIds ? inArray(t.stockAlerts.variantId, variantIds) : undefined,
      ),
    );

  for (const a of pending) {
    await sendEmail({ to: a.email, ...backInStockEmail(a.name, a.color, a.size, a.slug) });
    await db.update(t.stockAlerts).set({ notifiedAt: new Date() }).where(eq(t.stockAlerts.id, a.alertId));
  }
  return pending.length;
}
