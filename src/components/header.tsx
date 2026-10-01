import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, t } from "@/db";
import { store } from "@/lib/config";
import { CartButton } from "./cart-button";
import { MobileMenu } from "./mobile-menu";
import { SearchIcon } from "./icons";

export async function Header() {
  const categories = await db.query.categories.findMany({ orderBy: asc(t.categories.position) });

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-paper">
        Cash on delivery island-wide · Free delivery over Rs 10,000
      </div>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MobileMenu categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
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
          <CartButton />
        </div>
      </div>
    </header>
  );
}
