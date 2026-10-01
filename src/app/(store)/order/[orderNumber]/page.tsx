import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/orders";
import { OrderItemsTable, OrderProgress } from "@/components/order-summary";
import { formatPrice } from "@/lib/format";
import { store } from "@/lib/config";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage(props: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const sp = await props.searchParams;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const awaitingCard = order.paymentMethod === "CARD" && order.paymentStatus !== "PAID" && order.status === "PENDING";

  return (
    <div className="container-x max-w-3xl py-12">
      {sp.cancelled ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">Payment was cancelled. Your order is saved, so you can try again below.</div>
      ) : null}
      <p className="label text-accent">Order {order.orderNumber}</p>
      <h1 className="font-display text-4xl">
        {awaitingCard ? "Almost done" : `Thank you, ${order.customerName.split(" ")[0]}!`}
      </h1>
      <p className="mt-3 text-muted">
        {awaitingCard
          ? "We're waiting for your card payment to be confirmed."
          : order.paymentMethod === "COD"
            ? `We've received your order. Please keep ${formatPrice(order.total)} ready to pay the courier on delivery. We'll call you on ${order.phone} to confirm.`
            : "Your payment was received and your order is confirmed."}
      </p>
      {awaitingCard && <Link href={`/pay/${order.orderNumber}`} className="btn mt-5">Pay {formatPrice(order.total)} now</Link>}

      <div className="mt-8"><OrderProgress status={order.status} /></div>

      <div className="mt-10 grid gap-8 sm:grid-cols-[1fr_220px]">
        <div><OrderItemsTable order={order} /></div>
        <div className="text-sm">
          <p className="label">Delivering to</p>
          <p>{order.customerName}</p>
          <p className="text-muted">{order.city}, {order.district}</p>
          <p className="label mt-5">Payment</p>
          <p>{order.paymentMethod === "COD" ? "Cash on delivery" : "Card (PayHere)"}</p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-line bg-card p-5 text-sm">
        Save your order number <strong>{order.orderNumber}</strong> to <Link href="/track" className="underline">track your order</Link>.
        Questions? WhatsApp us on {store.phone}.
      </div>
    </div>
  );
}
