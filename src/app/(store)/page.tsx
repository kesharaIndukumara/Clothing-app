import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, t } from "@/db";
import { getFeatured, getNewArrivals } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { CashIcon, ReturnIcon, TruckIcon } from "@/components/icons";

export default async function HomePage() {
  const [featured, arrivals, categories] = await Promise.all([
    getFeatured(4),
    getNewArrivals(8),
    db.query.categories.findMany({
      orderBy: asc(t.categories.position),
      with: { products: { limit: 1, with: { images: { limit: 1 } } } },
    }),
  ]);
  const hero = featured[0]?.images[0]?.url;

  return (
    <>
      {/* Hero */}
      <section className="container-x grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div className="order-2 md:order-1">
          <p className="label text-accent">New season</p>
          <h1 className="font-display text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-7xl">
            Clothes for the way you actually live.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Breathable fabrics, honest prices and easy exchanges. Delivered anywhere in Sri Lanka, pay when it arrives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn">Shop the collection</Link>
            <Link href="/shop?sale=1" className="btn-outline">View sale</Link>
          </div>
        </div>
        <div className="order-1 aspect-[4/3] overflow-hidden rounded-2xl bg-line md:order-2 md:aspect-[4/5]">
          {hero && <img src={hero} alt="" className="h-full w-full object-cover" />}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-card">
        <div className="container-x grid gap-6 py-6 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-3"><TruckIcon className="text-accent" /> Island-wide delivery in 2–4 days</p>
          <p className="flex items-center gap-3"><CashIcon className="text-accent" /> Cash on delivery available</p>
          <p className="flex items-center gap-3"><ReturnIcon className="text-accent" /> Free size exchanges within 7 days</p>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">Shop by category</h2>
          <Link href="/shop" className="text-sm underline">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group">
              <div className="aspect-square overflow-hidden rounded-lg bg-line">
                {c.products[0]?.images[0] && (
                  <img src={c.products[0].images[0].url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-x pb-16">
          <h2 className="mb-6 font-display text-3xl">Customer favourites</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="container-x pb-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl">New arrivals</h2>
          <Link href="/shop" className="text-sm underline">Shop all</Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {arrivals.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
