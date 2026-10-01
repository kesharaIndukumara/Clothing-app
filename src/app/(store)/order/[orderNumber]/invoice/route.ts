import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getOrderByNumber } from "@/lib/orders";
import { InvoiceDocument } from "./invoice-doc";

// Anyone with the order number can see the order page, so the invoice follows the same rule.
export async function GET(_req: Request, ctx: RouteContext<"/order/[orderNumber]/invoice">) {
  const { orderNumber } = await ctx.params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) return new Response("Not found", { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf expects its own Document element type
  const pdf = await renderToBuffer(createElement(InvoiceDocument, { order }) as any);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
