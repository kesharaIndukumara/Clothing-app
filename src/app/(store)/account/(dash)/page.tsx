import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { OrderList } from "./order-list";

export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireCustomer();
  const [orders, [wish], defaultAddress] = await Promise.all([
    db.query.orders.findMany({ where: eq(t.orders.userId, user.id), orderBy: desc(t.orders.createdAt), limit: 3, with: { items: true } }),
    db.select({ n: count() }).from(t.wishlistItems).where(eq(t.wishlistItems.userId, user.id)),
    db.query.addresses.findFirst({ where: eq(t.addresses.userId, user.id), orderBy: desc(t.addresses.isDefault) }),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-5">
          <p className="label">Email</p>
          <p className="truncate text-sm">{user.email}</p>
        </div>
        <Link href="/account/wishlist" className="rounded-xl border border-line bg-card p-5 hover:border-ink">
          <p className="label">Wishlist</p>
          <p className="font-display text-2xl">{wish.n} <span className="text-sm text-muted">saved</span></p>
        </Link>
        <Link href="/account/addresses" className="rounded-xl border border-line bg-card p-5 hover:border-ink">
          <p className="label">Default address</p>
          <p className="truncate text-sm">{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.district}` : "Add one for faster checkout"}</p>
        </Link>
      </div>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          <Link href="/account/orders" className="text-sm underline">All orders</Link>
        </div>
        <OrderList orders={orders} />
      </section>
    </div>
  );
}
