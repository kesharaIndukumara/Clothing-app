import { store } from "@/lib/config";
export const metadata = { title: "Contact us" };
export default function ContactPage() {
  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="font-display text-4xl">Contact us</h1>
      <p className="mt-3 text-muted">We usually reply within a few hours, Monday to Saturday, 9am–6pm.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-line bg-card p-5 hover:border-ink">
          <p className="label">WhatsApp</p><p>{store.phone}</p>
        </a>
        <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="rounded-xl border border-line bg-card p-5 hover:border-ink">
          <p className="label">Call</p><p>{store.phone}</p>
        </a>
        <a href={`mailto:${store.email}`} className="rounded-xl border border-line bg-card p-5 hover:border-ink">
          <p className="label">Email</p><p>{store.email}</p>
        </a>
        <div className="rounded-xl border border-line bg-card p-5">
          <p className="label">Address</p><p>{store.address}</p>
        </div>
      </div>
    </div>
  );
}
