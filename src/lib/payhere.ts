import "server-only";
import crypto from "crypto";

// PayHere integration. Check these formulas against PayHere's current docs
// (https://support.payhere.lk) before going live.

const md5 = (s: string) =>
  crypto.createHash("md5").update(s).digest("hex").toUpperCase();

export function payhereEnabled() {
  return Boolean(process.env.PAYHERE_MERCHANT_ID && process.env.PAYHERE_MERCHANT_SECRET);
}

export function payhereCheckoutUrl() {
  return process.env.PAYHERE_SANDBOX === "false"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";
}

/** Hash sent with the checkout form so PayHere knows the amount wasn't tampered with. */
export function checkoutHash(orderId: string, amount: number, currency = "LKR") {
  const merchantId = process.env.PAYHERE_MERCHANT_ID!;
  const secret = process.env.PAYHERE_MERCHANT_SECRET!;
  return md5(merchantId + orderId + amount.toFixed(2) + currency + md5(secret));
}

/** Verifies the server-to-server payment notification really came from PayHere. */
export function verifyNotification(f: Record<string, string>) {
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!secret || f.merchant_id !== process.env.PAYHERE_MERCHANT_ID) return false;
  const expected = md5(
    f.merchant_id + f.order_id + f.payhere_amount + f.payhere_currency + f.status_code + md5(secret),
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(f.md5sig ?? "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
