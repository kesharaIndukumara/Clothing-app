import Link from "next/link";
import { and, count, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { db, t } from "@/db";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_STYLE, STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";

export const metadata = { title: "Orders" };
const PER_PAGE = 30;
const OPEN: OrderStatus[] = ["PENDING", "CONFIRMED", "PACKED"];

export default async function OrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const status = sp.status;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (status === "open") where.push(inArray(t.orders.status, OPEN));
  else if (status && (ORDER_STATUSES as readonly string[]).includes(status)) where.push(eq(t.orders.status, status as OrderStatus));
  if (q) where.push(or(like(t.orders.orderNumber, `%${q.toUpperCase()}%`), like(t.orders.phone, `%${q}%`), like(t.orders.customerName, `%${q}%`))!);
  const cond = where.length ? and(...where) : undefined;

  const [orders, [{ n }], counts] = await Promise.all([
    db.query.orders.findMany({ where: cond, orderBy: desc(t.orders.createdAt), limit: PER_PAGE, offset: (page - 1) * PER_PAGE, with: { items: { columns: { quantity: true } } } }),
    db.select({ n: count() }).from(t.orders).where(cond),
    db.select({ status: t.orders.status, n: count() }).from(t.orders).groupBy(t.orders.status),
  ]);
  const countFor = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const tabs = [
    { key: undefined, label: "All", n: counts.reduce((a, c) => a + c.n, 0) },
    { key: "open", label: "To fulfil", n: OPEN.reduce((a, s) => a + countFor(s), 0) },
    ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABEL[s], n: countFor(s) })),
  ];
  const pages = Math.max(1, Math.ceil(n / PER_PAGE));
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status, q, ...patch })) if (v) p.set(k, v);
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Orders</h1>
        <form className="w-full sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search order no., phone or name" className="input" />
        </form>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <Link key={tab.label} href={link({ status: tab.key, page: undefined })}
            className={`border-b-2 px-3 py-2 text-sm whitespace-nowrap ${status === tab.key ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}>
            {tab.label} <span className="text-xs text-muted">{tab.n}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No orders found.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium underline-offset-2 hover:underline">{o.orderNumber}</Link>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </td>
                <td className="px-4 py-3">{o.customerName}<p className="text-xs text-muted">{o.phone} · {o.district}</p></td>
                <td className="px-4 py-3">{o.items.reduce((a, i) => a + i.quantity, 0)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs">{o.paymentMethod}</span>{" "}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STYLE[o.paymentStatus]}`}>{o.paymentStatus.toLowerCase()}</span>
                </td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="px-4 py-3 text-right">{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={link({ page: String(page - 1) })} className="btn-outline btn-sm">Previous</Link>}
            {page < pages && <Link href={link({ page: String(page + 1) })} className="btn-outline btn-sm">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
