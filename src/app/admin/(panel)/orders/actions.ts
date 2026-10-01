"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, t } from "@/db";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { RESTOCK_STATUSES, STATUS_LABEL } from "@/lib/order-status";
import { reserveOrderStock, restockOrder } from "@/lib/stock";
import type { ActionState } from "@/components/admin/action-form";

const statusSchema = z.object({ orderId: z.string(), status: z.enum(ORDER_STATUSES), message: z.string().trim().max(300).optional() });

export async function updateOrderStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid status" };
  const { orderId, status, message } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: eq(t.orders.id, orderId) });
      if (!order) throw new Error("Order not found");
      if (order.status === status) throw new Error(`Order is already ${STATUS_LABEL[status].toLowerCase()}`);

      const restock = RESTOCK_STATUSES.includes(status);
      if (restock) await restockOrder(tx, orderId);
      else if (order.stockRestored) await reserveOrderStock(tx, orderId);

      const patch: Partial<typeof t.orders.$inferInsert> = { status };
      // Courier delivered a COD order → the cash is collected
      if (status === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus === "UNPAID") {
        patch.paymentStatus = "PAID";
      }
      await tx.update(t.orders).set(patch).where(eq(t.orders.id, orderId));
      await tx.insert(t.orderEvents).values({
        orderId,
        message: `${STATUS_LABEL[order.status]} → ${STATUS_LABEL[status]}${restock ? " (stock returned)" : ""}${message ? `: ${message}` : ""} · ${admin.name}`,
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update status" };
  }
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: `Status updated to ${STATUS_LABEL[status]}` };
}

export async function updatePaymentStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const parsed = z.enum(PAYMENT_STATUSES).safeParse(formData.get("paymentStatus"));
  if (!parsed.success) return { error: "Invalid payment status" };
  await db.update(t.orders).set({ paymentStatus: parsed.data }).where(eq(t.orders.id, orderId));
  await db.insert(t.orderEvents).values({ orderId, message: `Payment marked ${parsed.data.toLowerCase()} · ${admin.name}` });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: "Payment status saved" };
}

export async function saveOrderNotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId"));
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 100) || null;
  const adminNote = String(formData.get("adminNote") ?? "").trim().slice(0, 2000) || null;
  await db.update(t.orders).set({ trackingNumber, adminNote }).where(eq(t.orders.id, orderId));
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: "Saved" };
}
