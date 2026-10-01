import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, t } from "@/db";

export function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: eq(t.orders.orderNumber, orderNumber),
    with: { items: true, events: { orderBy: asc(t.orderEvents.createdAt) } },
  });
}
export type FullOrder = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;
