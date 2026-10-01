import { desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { OrderList } from "../order-list";

export const metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireCustomer("/account/orders");
  const [orders, reviews] = await Promise.all([
    db.query.orders.findMany({ where: eq(t.orders.userId, user.id), orderBy: desc(t.orders.createdAt), with: { items: true } }),
    db.query.reviews.findMany({ where: eq(t.reviews.userId, user.id), columns: { productId: true } }),
  ]);
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl">Orders</h2>
      <OrderList orders={orders} reviewed={new Set(reviews.map((r) => r.productId))} showReviewLinks />
    </div>
  );
}
