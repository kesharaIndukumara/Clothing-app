import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { store } from "@/lib/config";
import type { FullOrder } from "@/lib/orders";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1a17", fontFamily: "Helvetica" },
  row: { flexDirection: "row" },
  brand: { fontSize: 22, fontFamily: "Times-Bold" },
  muted: { color: "#6f6a62" },
  h: { fontSize: 9, color: "#6f6a62", textTransform: "uppercase", marginBottom: 4, letterSpacing: 0.5 },
  th: { fontSize: 9, color: "#6f6a62", textTransform: "uppercase", paddingVertical: 6, borderBottom: "1 solid #e3ddd2" },
  td: { paddingVertical: 7, borderBottom: "1 solid #f0ebe3" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
});

const rs = (n: number) => "Rs " + n.toLocaleString("en-LK", { maximumFractionDigits: 0 });
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Colombo" });

export function InvoiceDocument({ order }: { order: FullOrder }) {
  const paid = order.paymentStatus === "PAID";
  return (
    <Document title={`Invoice ${order.orderNumber}`} author={store.name}>
      <Page size="A4" style={s.page}>
        <View style={[s.row, { justifyContent: "space-between", marginBottom: 30 }]}>
          <View>
            <Text style={s.brand}>{store.name}</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>{store.address}</Text>
            <Text style={s.muted}>{store.phone} · {store.email}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold" }}>INVOICE</Text>
            <Text style={{ marginTop: 4 }}>{order.orderNumber}</Text>
            <Text style={s.muted}>{day(order.createdAt)}</Text>
            <Text style={{ marginTop: 6, color: paid ? "#047857" : "#b4532a", fontFamily: "Helvetica-Bold" }}>
              {paid ? "PAID" : order.paymentMethod === "COD" ? "CASH ON DELIVERY" : "UNPAID"}
            </Text>
          </View>
        </View>

        <View style={[s.row, { marginBottom: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.h}>Bill to / Ship to</Text>
            <Text>{order.customerName}</Text>
            <Text>{order.address}</Text>
            <Text>{order.city}, {order.district}</Text>
            <Text>{order.phone}</Text>
            {order.email ? <Text>{order.email}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h}>Payment</Text>
            <Text>{order.paymentMethod === "COD" ? "Cash on delivery" : "Card (PayHere)"}</Text>
            {order.paymentRef ? <Text style={s.muted}>Ref: {order.paymentRef}</Text> : null}
          </View>
        </View>

        <View style={s.row}>
          <Text style={[s.th, { flex: 4 }]}>Item</Text>
          <Text style={[s.th, { flex: 1, textAlign: "center" }]}>Qty</Text>
          <Text style={[s.th, { flex: 1.5, textAlign: "right" }]}>Price</Text>
          <Text style={[s.th, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
        </View>
        {order.items.map((i) => (
          <View key={i.id} style={s.row} wrap={false}>
            <View style={[s.td, { flex: 4 }]}>
              <Text>{i.productName}</Text>
              <Text style={[s.muted, { fontSize: 9 }]}>{i.color} · Size {i.size}</Text>
            </View>
            <Text style={[s.td, { flex: 1, textAlign: "center" }]}>{i.quantity}</Text>
            <Text style={[s.td, { flex: 1.5, textAlign: "right" }]}>{rs(i.price)}</Text>
            <Text style={[s.td, { flex: 1.5, textAlign: "right" }]}>{rs(i.price * i.quantity)}</Text>
          </View>
        ))}

        <View style={{ marginTop: 14, marginLeft: "auto", width: 220 }}>
          <View style={s.totalRow}><Text>Subtotal</Text><Text>{rs(order.subtotal)}</Text></View>
          {order.discount > 0 ? (
            <View style={s.totalRow}><Text>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</Text><Text>-{rs(order.discount)}</Text></View>
          ) : null}
          <View style={s.totalRow}><Text>Delivery</Text><Text>{order.deliveryFee === 0 ? "Free" : rs(order.deliveryFee)}</Text></View>
          <View style={[s.totalRow, { borderTop: "1 solid #1c1a17", marginTop: 4, paddingTop: 6 }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{rs(order.total)}</Text>
          </View>
        </View>

        <Text style={[s.muted, { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", fontSize: 9 }]}>
          Thank you for shopping with {store.name}. Size exchanges within 7 days of delivery. Questions? WhatsApp {store.phone}.
        </Text>
      </Page>
    </Document>
  );
}
