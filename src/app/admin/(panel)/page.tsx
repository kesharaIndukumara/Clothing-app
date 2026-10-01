import Link from "next/link";
import { and, count, desc, eq, gte, inArray, lte, notInArray, sum } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/config";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";

export const metadata = { title: "Dashboard" };

function startOfDayColombo(daysAgo = 0) {
  // Midnight in Sri Lanka (UTC+5:30)
  const now = new Date(Date.now() + 5.5 * 3600e3);
  now.setUTCHours(0, 0, 0, 0);
  return new Date(now.getTime() - 5.5 * 3600e3 - daysAgo * 86400e3);
}

export default async function Dashboard() {
  await requireAdmin();
  const today = startOfDayColombo();
  const monthAgo = startOfDayColombo(30);
  const notCancelled = notInArray(t.orders.status, ["CANCELLED", "RETURNED"]);

  const [[todayStats], [monthStats], [pending], lowStock, recent] = await Promise.all([
    db.select({ n: count(), total: sum(t.orders.total) }).from(t.orders).where(and(gte(t.orders.createdAt, today), notCancelled)),
    db.select({ n: count(), total: sum(t.orders.total) }).from(t.orders).where(and(gte(t.orders.createdAt, monthAgo), notCancelled)),
    db.select({ n: count() }).from(t.orders).where(inArray(t.orders.status, ["PENDING", "CONFIRMED", "PACKED"])),
    db.query.variants.findMany({
      where: lte(t.variants.stock, store.lowStockThreshold),
      with: { product: { columns: { id: true, name: true, active: true } } },
      orderBy: t.variants.stock,
      limit: 12,
    }),
    db.query.orders.findMany({ orderBy: desc(t.orders.createdAt), limit: 8 }),
  ]);
  const unpaidCod = await db.select({ n: count(), total: sum(t.orders.total) }).from(t.orders)
    .where(and(eq(t.orders.paymentMethod, "COD"), eq(t.orders.paymentStatus, "UNPAID"), eq(t.orders.status, "DELIVERED")));

  const cards = [
    { label: "Orders today", value: String(todayStats.n), sub: formatPrice(Number(todayStats.total ?? 0)) },
    { label: "Last 30 days", value: formatPrice(Number(monthStats.total ?? 0)), sub: `${monthStats.n} orders` },
    { label: "To fulfil", value: String(pending.n), sub: "Pending, confirmed or packed", href: "/admin/orders?status=open" },
    { label: "COD to collect", value: formatPrice(Number(unpaidCod[0].total ?? 0)), sub: `${unpaidCod[0].n} delivered, not marked paid` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="label">{c.label}</p>
              <p className="font-display text-3xl">{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.sub}</p>
            </>
          );
          return c.href
            ? <Link key={c.label} href={c.href} className="rounded-xl border border-line bg-card p-5 hover:border-ink">{inner}</Link>
            : <div key={c.label} className="rounded-xl border border-line bg-card p-5">{inner}</div>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-medium">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs underline">View all</Link>
          </div>
          {recent.length === 0 ? <p className="p-5 text-sm text-muted">No orders yet.</p> : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-paper">
                    <div className="flex-1">
                      <p className="font-medium">{o.orderNumber} · {o.customerName}</p>
                      <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.paymentMethod}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="w-24 text-right">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-line bg-card">
          <div className="border-b border-line px-5 py-4"><h2 className="font-medium">Low stock</h2></div>
          {lowStock.length === 0 ? <p className="p-5 text-sm text-muted">Everything is well stocked.</p> : (
            <ul className="divide-y divide-line">
              {lowStock.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/products/${v.product.id}`} className="flex items-center justify-between px-5 py-2.5 text-sm hover:bg-paper">
                    <span>{v.product.name} <span className="text-muted">· {v.color} / {v.size}</span></span>
                    <span className={v.stock === 0 ? "font-medium text-red-700" : "text-amber-700"}>{v.stock === 0 ? "Out" : `${v.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
