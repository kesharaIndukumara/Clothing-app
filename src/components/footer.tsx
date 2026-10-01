import Link from "next/link";
import { store } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold">{store.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{store.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="label">Shop</p>
          <ul className="space-y-2">
            <li><Link href="/shop" className="hover:text-accent">All products</Link></li>
            <li><Link href="/shop?sale=1" className="hover:text-accent">Sale</Link></li>
            <li><Link href="/size-guide" className="hover:text-accent">Size guide</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="label">Help</p>
          <ul className="space-y-2">
            <li><Link href="/track" className="hover:text-accent">Track your order</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-accent">Delivery</Link></li>
            <li><Link href="/policies/returns" className="hover:text-accent">Returns &amp; exchanges</Link></li>
            <li><Link href="/contact" className="hover:text-accent">Contact us</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="label">Get in touch</p>
          <ul className="space-y-2 text-muted">
            <li>{store.phone}</li>
            <li>{store.email}</li>
            <li>{store.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/policies/terms">Terms</Link>
            <Link href="/policies/privacy">Privacy</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
