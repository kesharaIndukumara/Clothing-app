import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { verifyNotification } from "@/lib/payhere";
import { restockOrder } from "@/lib/stock";
import { store } from "@/lib/config";
import { adminNewOrderEmail, orderConfirmationEmail, sendEmail } from "@/lib/email";
import { notifyRestocked } from "@/lib/stock-alerts";

// PayHere calls this URL server-to-server after a payment attempt.
// It must be reachable from the internet (use your real domain, or ngrok while testing).
export async function POST(req: Request) {
  const form = await req.formData();
  const f = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));

  if (!verifyNotification(f)) {
    console.warn("PayHere notification with invalid signature", f.order_id);
    return new Response("Invalid signature", { status: 400 });
  }

  const order = await db.query.orders.findFirst({ where: eq(t.orders.orderNumber, f.order_id) });
  if (!order) return new Response("Unknown order", { status: 404 });

  // Make sure the amount paid matches the order total
  if (Number(f.payhere_amount) !== order.total || f.payhere_currency !== "LKR") {
    await db.insert(t.orderEvents).values({ orderId: order.id, message: `Payment amount mismatch: ${f.payhere_currency} ${f.payhere_amount}` });
    return new Response("Amount mismatch", { status: 400 });
  }

  const status = f.status_code;
  if (status === "2" && order.paymentStatus !== "PAID") {
    await db.transaction(async (tx) => {
      await tx.update(t.orders).set({
        paymentStatus: "PAID",
        paymentRef: f.payment_id,
        status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      }).where(eq(t.orders.id, order.id));
      await tx.insert(t.orderEvents).values({ orderId: order.id, message: `Card payment received (PayHere ${f.payment_id})` });
    });
    const items = await db.query.orderItems.findMany({ where: eq(t.orderItems.orderId, order.id) });
    const mail = { ...order, items };
    if (order.email) await sendEmail({ to: order.email, ...orderConfirmationEmail(mail) });
    await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL ?? store.email, ...adminNewOrderEmail(mail) });
  } else if ((status === "-1" || status === "-2") && order.paymentStatus !== "PAID" && order.status === "PENDING") {
    // Cancelled or failed: release the stock
    await db.transaction(async (tx) => {
      await tx.update(t.orders).set({ paymentStatus: "FAILED", status: "CANCELLED" }).where(eq(t.orders.id, order.id));
      await restockOrder(tx, order.id);
      await tx.insert(t.orderEvents).values({ orderId: order.id, message: status === "-1" ? "Payment cancelled" : "Payment failed" });
    });
    await notifyRestocked();
  } else if (status === "-3") {
    await db.update(t.orders).set({ paymentStatus: "REFUNDED" }).where(eq(t.orders.id, order.id));
    await db.insert(t.orderEvents).values({ orderId: order.id, message: "Payment charged back" });
  }

  return new Response("OK");
}
