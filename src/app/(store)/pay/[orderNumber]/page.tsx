import { notFound, redirect } from "next/navigation";
import { getOrderByNumber } from "@/lib/orders";
import { checkoutHash, payhereCheckoutUrl, payhereEnabled } from "@/lib/payhere";
import { formatPrice } from "@/lib/format";
import { AutoSubmit } from "./auto-submit";

export const metadata = { title: "Redirecting to payment", robots: { index: false } };

export default async function PayPage(props: PageProps<"/pay/[orderNumber]">) {
  const { orderNumber } = await props.params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();
  if (order.paymentMethod !== "CARD" || order.paymentStatus === "PAID" || order.status !== "PENDING" || !payhereEnabled()) {
    redirect(`/order/${order.orderNumber}`);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [first, ...rest] = order.customerName.split(" ");
  const fields: Record<string, string> = {
    merchant_id: process.env.PAYHERE_MERCHANT_ID!,
    return_url: `${site}/order/${order.orderNumber}`,
    cancel_url: `${site}/order/${order.orderNumber}?cancelled=1`,
    notify_url: `${site}/api/payhere/notify`,
    order_id: order.orderNumber,
    items: order.items.map((i) => `${i.productName} x${i.quantity}`).join(", ").slice(0, 250),
    currency: "LKR",
    amount: order.total.toFixed(2),
    first_name: first,
    last_name: rest.join(" ") || first,
    email: order.email ?? "noreply@example.com",
    phone: order.phone,
    address: order.address,
    city: order.city,
    country: "Sri Lanka",
    hash: checkoutHash(order.orderNumber, order.total),
  };

  return (
    <div className="container-x max-w-md py-24 text-center">
      <h1 className="font-display text-3xl">Taking you to PayHere…</h1>
      <p className="mt-3 text-muted">Order {order.orderNumber} · {formatPrice(order.total)}</p>
      <form id="payhere" method="post" action={payhereCheckoutUrl()} className="mt-8">
        {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <button className="btn">Continue to secure payment</button>
      </form>
      <AutoSubmit formId="payhere" />
    </div>
  );
}
