import { desc } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createCoupon, deleteCoupon, toggleCoupon } from "./actions";

export const metadata = { title: "Coupons" };

const day = (d: Date | null) => (d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" }) : null);

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = await db.query.coupons.findMany({ orderBy: desc(t.coupons.createdAt) });
  const now = new Date();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Discount codes</h1>
        <p className="mt-1 text-sm text-muted">Customers enter these at checkout. Discounts apply to items, not delivery (except free-delivery codes).</p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="mb-4 font-medium">New code</h2>
        <ActionForm action={createCoupon} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><label className="label">Code</label><input name="code" className="input uppercase" placeholder="AVURUDU20" required /></div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="PERCENT">
              <option value="PERCENT">% off</option>
              <option value="FIXED">Rs off</option>
              <option value="FREE_DELIVERY">Free delivery</option>
            </select>
          </div>
          <div><label className="label">Value (% or Rs)</label><input name="value" type="number" min={0} className="input" placeholder="20" /></div>
          <div><label className="label">Min. spend (Rs)</label><input name="minSubtotal" type="number" min={0} className="input" placeholder="0" /></div>
          <div><label className="label">Max uses</label><input name="maxUses" type="number" min={1} className="input" placeholder="Unlimited" /></div>
          <div><label className="label">Starts</label><input name="startsAt" type="date" className="input" /></div>
          <div><label className="label">Ends (inclusive)</label><input name="expiresAt" type="date" className="input" /></div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="onePerCustomer" className="accent-ink" /> Once per customer</label>
          <div className="sm:col-span-2 lg:col-span-4"><button className="btn btn-sm">Create code</button></div>
        </ActionForm>
      </section>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Rules</th>
              <th className="px-4 py-3 font-medium">Used</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No codes yet.</td></tr>}
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now;
              const used = c.maxUses !== null && c.usedCount >= c.maxUses;
              const live = c.active && !expired && !used && (!c.startsAt || c.startsAt <= now);
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3">{c.type === "PERCENT" ? `${c.value}% off` : c.type === "FIXED" ? `${formatPrice(c.value)} off` : "Free delivery"}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.minSubtotal > 0 && <div>Min {formatPrice(c.minSubtotal)}</div>}
                    {c.onePerCustomer && <div>Once per customer</div>}
                    {(c.startsAt || c.expiresAt) && <div>{day(c.startsAt) ?? "Now"} → {day(c.expiresAt) ?? "No end"}</div>}
                  </td>
                  <td className="px-4 py-3">{c.usedCount}{c.maxUses !== null && ` / ${c.maxUses}`}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${live ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-600"}`}>
                      {!c.active ? "Paused" : expired ? "Expired" : used ? "Used up" : live ? "Live" : "Scheduled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs">
                      <form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><button className="underline">{c.active ? "Pause" : "Resume"}</button></form>
                      <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`Delete ${c.code}?`} className="text-muted underline hover:text-red-700">Delete</ConfirmButton></form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
