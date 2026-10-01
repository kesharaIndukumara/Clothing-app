import { notFound } from "next/navigation";
import { store, FREE_DELIVERY_OVER } from "@/lib/config";
import { formatPrice } from "@/lib/format";

// Starter policy text. Review it and adapt it to your business before launching.
const POLICIES: Record<string, { title: string; body: React.ReactNode }> = {
  shipping: {
    title: "Delivery policy",
    body: (
      <>
        <p>We deliver island-wide through our courier partner.</p>
        <h2>Delivery times</h2>
        <ul>
          <li>Colombo and suburbs: 1–2 working days</li>
          <li>Other areas: 2–4 working days</li>
        </ul>
        <h2>Delivery charges</h2>
        <p>Charges depend on your district and are shown at checkout. {FREE_DELIVERY_OVER > 0 && <>Orders over {formatPrice(FREE_DELIVERY_OVER)} are delivered free.</>}</p>
        <h2>Cash on delivery</h2>
        <p>Pay the courier in cash when your parcel arrives. We may call to confirm COD orders before dispatch.</p>
      </>
    ),
  },
  returns: {
    title: "Returns & exchanges",
    body: (
      <>
        <h2>Size exchanges</h2>
        <p>If something doesn&apos;t fit, you can exchange it for a different size within 7 days of delivery, subject to stock.</p>
        <h2>Conditions</h2>
        <ul>
          <li>Items must be unworn, unwashed, and have all original tags attached.</li>
          <li>Sale items and innerwear can&apos;t be exchanged unless faulty.</li>
        </ul>
        <h2>Damaged or wrong items</h2>
        <p>If you receive a faulty or wrong item, contact us within 48 hours with a photo and we&apos;ll replace it or refund you in full.</p>
        <h2>How to request an exchange</h2>
        <p>WhatsApp us on {store.phone} with your order number.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>This policy explains how {store.name} collects and uses your personal data, in line with Sri Lanka&apos;s Personal Data Protection Act No. 9 of 2022.</p>
        <h2>What we collect</h2>
        <p>Your name, phone number, email (optional) and delivery address when you place an order.</p>
        <h2>Why we collect it</h2>
        <p>Only to process and deliver your order and to contact you about it. We share your delivery details with our courier for that purpose.</p>
        <h2>Payments</h2>
        <p>Card payments are processed by PayHere. We never see or store your card details.</p>
        <h2>Your rights</h2>
        <p>You can ask to see, correct or delete your data by emailing {store.email}.</p>
      </>
    ),
  },
  terms: {
    title: "Terms & conditions",
    body: (
      <>
        <p>By placing an order on this website you agree to these terms.</p>
        <h2>Orders</h2>
        <p>All orders are subject to availability. We may cancel an order if an item is out of stock or a pricing error occurs, and will refund any payment in full.</p>
        <h2>Prices</h2>
        <p>Prices are in Sri Lankan Rupees and include applicable taxes. Delivery is charged separately.</p>
        <h2>Contact</h2>
        <p>{store.name}, {store.address}. {store.email}</p>
      </>
    ),
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  return { title: POLICIES[slug]?.title };
}

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const policy = POLICIES[slug];
  if (!policy) notFound();
  return (
    <div className="container-x prose-store max-w-2xl py-12">
      <h1 className="font-display text-4xl">{policy.title}</h1>
      <div className="mt-4">{policy.body}</div>
    </div>
  );
}
