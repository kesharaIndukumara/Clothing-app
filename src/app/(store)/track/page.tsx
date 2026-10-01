import type { Metadata } from "next";
import { getOrderByNumber } from "@/lib/orders";
import { normalizePhone, formatDate } from "@/lib/format";
import { OrderItemsTable, OrderProgress } from "@/components/order-summary";
import { STATUS_LABEL } from "@/lib/order-status";

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackPage(props: PageProps<"/track">) {
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const orderNumber = sp.order?.trim().toUpperCase();
  const phone = sp.phone ? normalizePhone(sp.phone) : undefined;

  let order = null;
  let notFound = false;
  if (orderNumber && phone) {
    const found = await getOrderByNumber(orderNumber);
    // Require the phone number too, so order numbers alone can't be used to look up details
    if (found && found.phone === phone) order = found;
    else notFound = true;
  }

  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="font-display text-4xl">Track your order</h1>
      <p className="mt-2 text-muted">Enter the order number from your confirmation and the phone number you used.</p>
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input name="order" defaultValue={sp.order} placeholder="Order number, e.g. KS2610011234" className="input" required />
        <input name="phone" defaultValue={sp.phone} placeholder="Phone number" className="input" required />
        <button className="btn">Track</button>
      </form>

      {notFound && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">We couldn&apos;t find an order with those details. Please check and try again.</p>}

      {order && (
        <div className="mt-10 space-y-8">
          <div>
            <p className="label">Status</p>
            <p className="mb-4 font-display text-2xl">{STATUS_LABEL[order.status]}</p>
            <OrderProgress status={order.status} />
            {order.trackingNumber && <p className="mt-4 text-sm">Courier tracking number: <strong>{order.trackingNumber}</strong></p>}
          </div>
          <OrderItemsTable order={order} />
          <div>
            <p className="label">History</p>
            <ul className="space-y-2 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-4"><span className="w-40 shrink-0 text-muted">{formatDate(e.createdAt)}</span>{e.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
