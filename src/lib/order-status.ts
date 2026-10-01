import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-sky-100 text-sky-900",
  PACKED: "bg-indigo-100 text-indigo-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  CANCELLED: "bg-stone-200 text-stone-700",
  RETURNED: "bg-rose-100 text-rose-900",
};

export const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  UNPAID: "bg-stone-100 text-stone-700",
  PAID: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-rose-100 text-rose-900",
  REFUNDED: "bg-stone-200 text-stone-700",
};

// The normal path an order moves through, used for the customer progress bar
export const FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

// Statuses that put stock back on the shelf
export const RESTOCK_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];
