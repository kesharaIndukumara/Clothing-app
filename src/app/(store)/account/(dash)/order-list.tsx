import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/order-status";
import type { OrderStatus } from "@/db/schema";

type O = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  total: number;
  items: { id: string; productName: string; image: string | null; quantity: number; productId: string | null; size: string }[];
};

export function OrderList({ orders, reviewed, showReviewLinks }: { orders: O[]; reviewed?: Set<string>; showReviewLinks?: boolean }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-card p-8 text-center">
        <p className="text-muted">You haven&apos;t placed any orders yet.</p>
        <Link href="/shop" className="btn mt-5">Start shopping</Link>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="rounded-xl border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/order/${o.orderNumber}`} className="font-medium hover:underline">{o.orderNumber}</Link>
              <p className="text-xs text-muted">{formatDate(o.createdAt)} · {formatPrice(o.total)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              <a href={`/order/${o.orderNumber}/invoice`} className="text-xs underline">Invoice</a>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-3">
            {o.items.map((i) => (
              <li key={i.id} className="flex w-full items-center gap-3 sm:w-auto">
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded bg-line">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
                <div className="text-sm">
                  <p>{i.productName}</p>
                  <p className="text-xs text-muted">Size {i.size} · Qty {i.quantity}</p>
                  {showReviewLinks && o.status === "DELIVERED" && i.productId && !reviewed?.has(i.productId) && (
                    <Link href={`/account/review/${i.productId}`} className="text-xs text-accent underline">Write a review</Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
