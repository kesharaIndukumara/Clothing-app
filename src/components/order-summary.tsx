import type { FullOrder } from "@/lib/orders";
import { FLOW, STATUS_LABEL } from "@/lib/order-status";
import { formatPrice } from "@/lib/format";

export function OrderProgress({ status }: { status: FullOrder["status"] }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return <p className="rounded-lg bg-line/60 p-4 text-sm">This order was {STATUS_LABEL[status].toLowerCase()}.</p>;
  }
  const idx = FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1 text-center text-[11px] sm:text-xs">
      {FLOW.map((s, i) => (
        <li key={s}>
          <div className={`h-1.5 rounded-full ${i <= idx ? "bg-accent" : "bg-line"}`} />
          <p className={`mt-2 ${i <= idx ? "text-ink" : "text-muted"}`}>{STATUS_LABEL[s]}</p>
        </li>
      ))}
    </ol>
  );
}

export function OrderItemsTable({ order }: { order: FullOrder }) {
  return (
    <>
      <ul className="divide-y divide-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex gap-3 py-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-line">
              {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p>{i.productName}</p>
              <p className="text-xs text-muted">{i.color} · {i.size} · Qty {i.quantity}</p>
            </div>
            <p className="text-sm">{formatPrice(i.price * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-accent"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{formatPrice(order.discount)}</dd></div>
        )}
        <div className="flex justify-between"><dt>Delivery</dt><dd>{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</dd></div>
        <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
      </dl>
    </>
  );
}
