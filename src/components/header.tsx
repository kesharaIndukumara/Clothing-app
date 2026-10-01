import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, t } from "@/db";
import { store } from "@/lib/config";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";
import { HeartIcon, SearchIcon, UserIcon } from "./icons";
import { getCustomer } from "@/lib/customer-auth";

export async function Header() {
  const [categories, customer] = await Promise.all([
    db.query.categories.findMany({ orderBy: asc(t.categories.position) }),
    getCustomer(),
  ]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-paper">
        Cash on delivery island-wide · Free delivery over Rs 10,000
      </div>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MobileMenu categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} signedIn={Boolean(customer)} />
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            {store.name}
          </Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/shop" className="hover:text-accent">Shop all</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="hover:text-accent">
              {c.name}
            </Link>
          ))}
          <Link href="/shop?sale=1" className="text-sale">Sale</Link>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/shop" aria-label="Search" className="rounded-full p-2 hover:bg-line/60">
            <SearchIcon />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden rounded-full p-2 hover:bg-line/60 sm:block">
            <HeartIcon />
          </Link>
          <Link
            href={customer ? "/account" : "/account/login"}
            aria-label={customer ? "My account" : "Sign in"}
            title={customer ? `Signed in as ${customer.name}` : "Sign in"}
            className="relative rounded-full p-2 hover:bg-line/60"
          >
            <UserIcon />
            {customer && <span className="absolute right-1.5 bottom-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-paper" />}
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
