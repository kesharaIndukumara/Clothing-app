import Link from "next/link";
import type { Metadata } from "next";
import { getFilterOptions, getProducts, type ShopFilters } from "@/lib/catalog";
import { SIZES } from "@/lib/config";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Shop" };

type SP = Record<string, string | undefined>;

function hrefWith(sp: SP, key: string, value?: string) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) next.set(k, v);
  if (value === undefined || sp[key] === value) next.delete(key);
  else next.set(key, value);
  const qs = next.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-xs transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`;

export default async function ShopPage(props: PageProps<"/shop">) {
  const raw = (await props.searchParams) as SP;
  const filters: ShopFilters = {
    category: raw.category,
    size: raw.size,
    color: raw.color,
    q: raw.q?.trim() || undefined,
    sale: raw.sale === "1",
    sort: (["new", "price-asc", "price-desc"] as const).find((s) => s === raw.sort),
  };
  const [products, { categories, colors }] = await Promise.all([getProducts(filters), getFilterOptions()]);
  const current = categories.find((c) => c.slug === filters.category);
  const anyFilter = Boolean(filters.category || filters.size || filters.color || filters.q || filters.sale);

  return (
    <div className="container-x py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl">{filters.sale ? "Sale" : current?.name ?? "Shop all"}</h1>
          <p className="mt-1 text-sm text-muted">{products.length} {products.length === 1 ? "item" : "items"}</p>
        </div>
        <div className="flex gap-2">
          <form action="/shop" className="flex-1 sm:w-64">
            {Object.entries(raw).map(([k, v]) => k !== "q" && v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
            <input name="q" defaultValue={filters.q} placeholder="Search products" className="input" />
          </form>
          <SortSelect value={filters.sort ?? "new"} />
        </div>
      </div>

      <div className="mt-6 space-y-3 border-y border-line py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mb-0 w-16">Category</span>
          <Link href={hrefWith(raw, "category")} className={chip(!filters.category)}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={hrefWith(raw, "category", c.slug)} className={chip(filters.category === c.slug)}>{c.name}</Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mb-0 w-16">Size</span>
          {SIZES.map((s) => (
            <Link key={s} href={hrefWith(raw, "size", s)} className={chip(filters.size === s)}>{s}</Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label mb-0 w-16">Colour</span>
          {colors.map((c) => (
            <Link key={c.color} href={hrefWith(raw, "color", c.color)} className={`${chip(filters.color === c.color)} inline-flex items-center gap-1.5`}>
              <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: c.hex }} />
              {c.color}
            </Link>
          ))}
        </div>
        {anyFilter && <Link href="/shop" className="inline-block text-xs underline">Clear all filters</Link>}
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted">No products match these filters.</p>
          <Link href="/shop" className="btn mt-6">Clear filters</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
