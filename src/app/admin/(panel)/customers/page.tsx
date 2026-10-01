import { count, desc, eq, like, notInArray, or, sql, sum } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const rows = await db
    .select({
      id: t.user.id,
      name: t.user.name,
      email: t.user.email,
      createdAt: t.user.createdAt,
      orders: count(t.orders.id),
      spent: sum(sql`case when ${t.orders.status} not in ('CANCELLED','RETURNED') then ${t.orders.total} else 0 end`),
      lastOrder: sql<number | null>`max(${t.orders.createdAt})`,
    })
    .from(t.user)
    .leftJoin(t.orders, eq(t.orders.userId, t.user.id))
    .where(q ? or(like(t.user.name, `%${q}%`), like(t.user.email, `%${q}%`)) : undefined)
    .groupBy(t.user.id)
    .orderBy(desc(t.user.createdAt))
    .limit(200);

  const [guest] = await db
    .select({ n: count() })
    .from(t.orders)
    .where(sql`${t.orders.userId} is null and ${notInArray(t.orders.status, ["CANCELLED"])}`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Customers <span className="text-base text-muted">{rows.length}</span></h1>
          <p className="mt-1 text-sm text-muted">Registered accounts. {guest.n} orders were placed as guest checkout.</p>
        </div>
        <form className="w-full sm:w-72"><input name="q" defaultValue={q} placeholder="Search name or email" className="input" /></form>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3 font-medium">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No customers yet.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{c.name}<p className="text-xs text-muted">{c.email}</p></td>
                <td className="px-4 py-3 text-muted">{formatDate(c.createdAt).split(",")[0]}</td>
                <td className="px-4 py-3">{c.orders}</td>
                <td className="px-4 py-3">{formatPrice(Number(c.spent ?? 0))}</td>
                <td className="px-4 py-3 text-muted">{c.lastOrder ? formatDate(new Date(c.lastOrder * 1000)).split(",")[0] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
