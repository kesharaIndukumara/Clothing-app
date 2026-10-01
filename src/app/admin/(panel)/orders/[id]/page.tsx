import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_STYLE, STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import { ActionForm } from "@/components/admin/action-form";
import { saveOrderNotes, updateOrderStatus, updatePaymentStatus } from "../actions";
import { PrintButton } from "./print-button";

export const metadata = { title: "Order" };

export default async function OrderDetail(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const order = await db.query.orders.findFirst({
    where: eq(t.orders.id, id),
    with: { items: true, events: { orderBy: asc(t.orderEvents.createdAt) } },
  });
  if (!order) notFound();
  const waPhone = "94" + order.phone.replace(/^0/, "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link href="/admin/orders" className="text-xs text-muted hover:underline">← Orders</Link>
          <h1 className="mt-1 font-display text-3xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
          <span className={`rounded-full px-3 py-1 text-xs ${PAYMENT_STYLE[order.paymentStatus]}`}>{order.paymentMethod} · {order.paymentStatus.toLowerCase()}</span>
          <PrintButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Items — also the printable packing slip */}
          <section className="rounded-xl border border-line bg-card p-5">
            <div className="hidden print:block">
              <h1 className="font-display text-2xl">Packing slip · {order.orderNumber}</h1>
              <p className="mb-4 text-sm">{order.customerName} · {order.phone}<br />{order.address}, {order.city}, {order.district}</p>
            </div>
            <h2 className="mb-3 font-medium">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-line print:hidden">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="flex-1">
                    {i.productId ? <Link href={`/admin/products/${i.productId}`} className="hover:underline">{i.productName}</Link> : i.productName}
                    <p className="text-xs text-muted">{i.color} · {i.size}</p>
                  </div>
                  <span className="text-muted">{formatPrice(i.price)} × {i.quantity}</span>
                  <span className="w-24 text-right">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery ({order.district})</dt><dd>{formatPrice(order.deliveryFee)}</dd></div>
              <div className="flex justify-between font-medium"><dt>Total {order.paymentMethod === "COD" && order.paymentStatus !== "PAID" && "(collect on delivery)"}</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-card p-5 print:hidden">
            <h2 className="mb-3 font-medium">History</h2>
            <ul className="space-y-2 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-4"><span className="w-36 shrink-0 text-xs text-muted">{formatDate(e.createdAt)}</span><span>{e.message}</span></li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6 print:hidden">
          <section className="rounded-xl border border-line bg-card p-5 text-sm">
            <h2 className="mb-3 font-medium">Customer</h2>
            <p>{order.customerName}</p>
            <p><a href={`tel:${order.phone}`} className="underline">{order.phone}</a> · <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a></p>
            {order.email && <p><a href={`mailto:${order.email}`} className="underline">{order.email}</a></p>}
            <p className="mt-3 text-muted">{order.address}<br />{order.city}, {order.district}</p>
            {order.note && <p className="mt-3 rounded-lg bg-amber-50 p-3">Note: {order.note}</p>}
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="mb-3 font-medium">Update status</h2>
            <ActionForm action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select key={order.status} name="status" defaultValue={order.status} className="input">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <input name="message" placeholder="Note for history (optional)" className="input" />
              <button className="btn btn-sm w-full">Update status</button>
            </ActionForm>
            <p className="mt-3 text-xs text-muted">Cancelling or returning puts the items back in stock. Marking a COD order delivered also marks it paid.</p>
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="mb-3 font-medium">Payment</h2>
            <ActionForm action={updatePaymentStatus} className="flex gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select key={order.paymentStatus} name="paymentStatus" defaultValue={order.paymentStatus} className="input">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
              <button className="btn-outline btn-sm">Save</button>
            </ActionForm>
            {order.paymentRef && <p className="mt-2 text-xs text-muted">PayHere ref: {order.paymentRef}</p>}
          </section>

          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="mb-3 font-medium">Shipping &amp; notes</h2>
            <ActionForm action={saveOrderNotes} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label className="label">Courier tracking no.</label>
                <input key={order.trackingNumber ?? ""} name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Internal note</label>
                <textarea key={order.adminNote ?? ""} name="adminNote" defaultValue={order.adminNote ?? ""} rows={3} className="input" placeholder="Only visible to admins" />
              </div>
              <button className="btn-outline btn-sm w-full">Save</button>
            </ActionForm>
          </section>
        </div>
      </div>
    </div>
  );
}
