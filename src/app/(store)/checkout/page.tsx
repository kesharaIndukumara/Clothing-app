import type { Metadata } from "next";
import { DISTRICTS } from "@/lib/config";
import { payhereEnabled } from "@/lib/payhere";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl">Checkout</h1>
      <CheckoutForm districts={DISTRICTS} cardEnabled={payhereEnabled()} />
    </div>
  );
}
