import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { DISTRICTS } from "@/lib/config";
import { getCustomer } from "@/lib/customer-auth";
import { payhereEnabled } from "@/lib/payhere";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const customer = await getCustomer();
  const addresses = customer
    ? await db.query.addresses.findMany({
        where: eq(t.addresses.userId, customer.id),
        orderBy: [desc(t.addresses.isDefault), desc(t.addresses.createdAt)],
      })
    : [];

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl">Checkout</h1>
        {!customer && (
          <p className="text-sm text-muted">
            Have an account? <Link href="/account/login?next=/checkout" className="text-ink underline">Sign in</Link> for faster checkout.
          </p>
        )}
      </div>
      <CheckoutForm
        districts={DISTRICTS}
        cardEnabled={payhereEnabled()}
        customer={customer ? { name: customer.name, email: customer.email } : null}
        addresses={addresses.map((a) => ({ id: a.id, fullName: a.fullName, phone: a.phone, address: a.address, city: a.city, district: a.district }))}
      />
    </div>
  );
}
