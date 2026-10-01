import "server-only";
import { Resend } from "resend";
import { store } from "./config";
import { formatPrice } from "./format";

// Emails go out through Resend when RESEND_API_KEY is set.
// Without a key (local development) they're printed to the terminal instead,
// so you can still click password-reset links while testing.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? `${store.name} <onboarding@resend.dev>`;
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type Mail = { to: string; subject: string; html: string; text?: string };

export async function sendEmail(mail: Mail) {
  if (!resend) {
    console.log(`\n📧 [email not sent: RESEND_API_KEY missing]\nTo: ${mail.to}\nSubject: ${mail.subject}\n${mail.text ?? stripHtml(mail.html)}\n`);
    return { ok: true, simulated: true };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: mail.to, subject: mail.subject, html: mail.html, text: mail.text });
    if (error) {
      console.error("Email failed", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    // Never let a failed email break checkout or admin actions
    console.error("Email failed", e);
    return { ok: false };
  }
}

function stripHtml(html: string) {
  return html.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, "$2 ($1)").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;color:#1c1a17">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="font-family:Georgia,serif;font-size:24px;font-weight:bold;margin:0 0 24px">${esc(store.name)}</p>
  <div style="background:#fffdf9;border:1px solid #e3ddd2;border-radius:12px;padding:28px">
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:normal;margin:0 0 16px">${esc(title)}</h1>
    ${body}
  </div>
  <p style="font-size:12px;color:#6f6a62;margin-top:20px">${esc(store.name)} · ${esc(store.address)} · ${esc(store.phone)}</p>
</div></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#1c1a17;color:#f6f3ee;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;display:inline-block">${esc(label)}</a></p>`;

type OrderForEmail = {
  orderNumber: string;
  customerName: string;
  address: string;
  city: string;
  district: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  deliveryFee: number;
  total: number;
  trackingNumber?: string | null;
  items: { productName: string; size: string; color: string; quantity: number; price: number }[];
};

function itemsTable(o: OrderForEmail) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)}<br><span style="color:#6f6a62;font-size:12px">${esc(i.color)} · ${esc(i.size)} · Qty ${i.quantity}</span></td><td style="text-align:right;padding:6px 0">${formatPrice(i.price * i.quantity)}</td></tr>`)
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:3px 0;${bold ? "font-weight:bold" : ""}">${label}</td><td style="text-align:right;${bold ? "font-weight:bold" : ""}">${value}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
  <tr><td colspan="2" style="border-top:1px solid #e3ddd2;padding-top:8px"></td></tr>
  ${line("Subtotal", formatPrice(o.subtotal))}
  ${o.discount > 0 ? line(`Discount${o.couponCode ? ` (${esc(o.couponCode)})` : ""}`, "−" + formatPrice(o.discount)) : ""}
  ${line("Delivery", o.deliveryFee === 0 ? "Free" : formatPrice(o.deliveryFee))}
  ${line("Total", formatPrice(o.total), true)}</table>`;
}

export function orderConfirmationEmail(o: OrderForEmail) {
  const url = `${siteUrl()}/order/${o.orderNumber}`;
  return {
    subject: `Order ${o.orderNumber} received`,
    html: layout(
      `Thank you, ${o.customerName.split(" ")[0]}!`,
      `<p style="font-size:14px;line-height:1.6">We've received your order <b>${o.orderNumber}</b>. ${
        o.paymentMethod === "COD" ? `Please keep <b>${formatPrice(o.total)}</b> ready to pay the courier on delivery.` : "Your card payment was received."
      }</p>
      ${itemsTable(o)}
      <p style="font-size:14px;margin-top:20px"><b>Delivering to</b><br>${esc(o.customerName)}<br>${esc(o.address)}<br>${esc(o.city)}, ${esc(o.district)}</p>
      ${button(url, "View your order")}`,
    ),
  };
}

export function orderShippedEmail(o: OrderForEmail) {
  const url = `${siteUrl()}/order/${o.orderNumber}`;
  return {
    subject: `Your order ${o.orderNumber} is on its way`,
    html: layout(
      "Your order has shipped",
      `<p style="font-size:14px;line-height:1.6">Good news! Order <b>${o.orderNumber}</b> has been handed to our courier and should reach you in 1–4 working days.</p>
      ${o.trackingNumber ? `<p style="font-size:14px">Courier tracking number: <b>${esc(o.trackingNumber)}</b></p>` : ""}
      ${o.paymentMethod === "COD" ? `<p style="font-size:14px">Amount to pay on delivery: <b>${formatPrice(o.total)}</b></p>` : ""}
      ${button(url, "Track your order")}`,
    ),
  };
}

export function orderDeliveredEmail(o: OrderForEmail) {
  return {
    subject: `Order ${o.orderNumber} delivered`,
    html: layout(
      "Delivered. We hope you love it!",
      `<p style="font-size:14px;line-height:1.6">Your order <b>${o.orderNumber}</b> has been delivered. If something doesn't fit, you can exchange it within 7 days. Just reply on WhatsApp ${esc(store.phone)}.</p>
      <p style="font-size:14px;line-height:1.6">We'd really appreciate a quick review. It helps other shoppers pick the right size.</p>
      ${button(`${siteUrl()}/account/orders`, "Leave a review")}`,
    ),
  };
}

export function adminNewOrderEmail(o: OrderForEmail) {
  return {
    subject: `New order ${o.orderNumber} · ${formatPrice(o.total)} (${o.paymentMethod})`,
    html: layout(`New order ${o.orderNumber}`, `${itemsTable(o)}<p style="font-size:14px">${esc(o.customerName)}, ${esc(o.city)}, ${esc(o.district)}</p>${button(`${siteUrl()}/admin/orders`, "Open in admin")}`),
  };
}

export function passwordResetEmail(name: string, url: string) {
  return {
    subject: `Reset your ${store.name} password`,
    html: layout("Reset your password", `<p style="font-size:14px;line-height:1.6">Hi ${esc(name)}, we got a request to reset your password. The link below works for 1 hour.</p>${button(url, "Choose a new password")}<p style="font-size:12px;color:#6f6a62">If you didn't ask for this, you can ignore this email.</p>`),
    text: `Reset your password: ${url}`,
  };
}

export function backInStockEmail(productName: string, color: string, size: string, slug: string) {
  return {
    subject: `Back in stock: ${productName} (${size})`,
    html: layout("It's back!", `<p style="font-size:14px;line-height:1.6"><b>${esc(productName)}</b> in ${esc(color)}, size ${esc(size)} is back in stock. Popular sizes go quickly.</p>${button(`${siteUrl()}/products/${slug}`, "Shop now")}`),
  };
}
