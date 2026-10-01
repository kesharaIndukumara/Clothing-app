// Sends ecommerce events to Google Analytics 4 and Meta Pixel when they're configured.
// Safe to call anywhere on the client; does nothing if neither is loaded.

type Item = { id: string; name: string; price: number; quantity?: number };
type EventMap = {
  view_item: Item;
  add_to_cart: Item;
  begin_checkout: { value: number; items: Item[] };
  purchase: { orderNumber: string; value: number; shipping: number; coupon?: string | null; items: Item[] };
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const toGa = (i: Item) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 });

export function track<K extends keyof EventMap>(event: K, data: EventMap[K]) {
  if (typeof window === "undefined") return;
  const { gtag, fbq } = window;
  const currency = "LKR";
  try {
    if (event === "view_item" || event === "add_to_cart") {
      const i = data as Item;
      gtag?.("event", event, { currency, value: i.price * (i.quantity ?? 1), items: [toGa(i)] });
      fbq?.("track", event === "view_item" ? "ViewContent" : "AddToCart", { content_ids: [i.id], content_name: i.name, content_type: "product", value: i.price, currency });
    } else if (event === "begin_checkout") {
      const d = data as EventMap["begin_checkout"];
      gtag?.("event", "begin_checkout", { currency, value: d.value, items: d.items.map(toGa) });
      fbq?.("track", "InitiateCheckout", { value: d.value, currency, num_items: d.items.length });
    } else if (event === "purchase") {
      const d = data as EventMap["purchase"];
      gtag?.("event", "purchase", { transaction_id: d.orderNumber, currency, value: d.value, shipping: d.shipping, coupon: d.coupon ?? undefined, items: d.items.map(toGa) });
      fbq?.("track", "Purchase", { value: d.value, currency, content_ids: d.items.map((i) => i.id), content_type: "product" });
    }
  } catch {
    // analytics must never break the store
  }
}
