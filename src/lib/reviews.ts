import "server-only";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { db, t } from "@/db";

export async function getReviewSummary(productId: string) {
  const where = and(eq(t.reviews.productId, productId), eq(t.reviews.status, "APPROVED"));
  const [[agg], rows] = await Promise.all([
    db.select({ n: count(), avg: avg(t.reviews.rating) }).from(t.reviews).where(where),
    db.select({ rating: t.reviews.rating, n: count() }).from(t.reviews).where(where).groupBy(t.reviews.rating),
  ]);
  const dist = [5, 4, 3, 2, 1].map((r) => ({ rating: r, n: rows.find((x) => x.rating === r)?.n ?? 0 }));
  return { count: agg.n, average: agg.avg ? Number(agg.avg) : 0, dist };
}

export function getApprovedReviews(productId: string, limit = 20) {
  return db.query.reviews.findMany({
    where: and(eq(t.reviews.productId, productId), eq(t.reviews.status, "APPROVED")),
    orderBy: desc(t.reviews.createdAt),
    limit,
  });
}

/** True if this customer has a delivered order containing the product. */
export async function hasBought(userId: string, productId: string) {
  const rows = await db
    .select({ id: t.orderItems.id, size: t.orderItems.size })
    .from(t.orderItems)
    .innerJoin(t.orders, eq(t.orders.id, t.orderItems.orderId))
    .where(and(eq(t.orders.userId, userId), eq(t.orders.status, "DELIVERED"), eq(t.orderItems.productId, productId)))
    .limit(1);
  return rows[0] ?? null;
}
