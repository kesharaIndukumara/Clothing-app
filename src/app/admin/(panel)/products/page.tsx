import Link from "next/link";
import { asc, desc, like } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { toggleActive } from "./actions";

export const metadata = { title: "Products" };

export default async function ProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = (await props.searchParams) as Record<string, string | undefined>;
  const q = sp.q?.trim();
  const products = await db.query.products.findMany({
    where: q ? like(t.products.name, `%${q}%`) : undefined,
    orderBy: desc(t.products.createdAt),
    with: {
      category: { columns: { name: true } },
      images: { limit: 1, orderBy: asc(t.productImages.position) },
      variants: { columns: { stock: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Products <span className="text-base text-muted">{products.length}</span></h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <form className="flex-1 sm:w-64"><input name="q" defaultValue={q} placeholder="Search products" className="input" /></form>
          <Link href="/admin/products/new" className="btn btn-sm">+ Add product</Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Visible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No products yet. <Link href="/admin/products/new" className="underline">Add your first one</Link>.</td></tr>}
            {products.map((p) => {
              const stock = p.variants.reduce((a, v) => a + v.stock, 0);
              const low = p.variants.filter((v) => v.stock <= store.lowStockThreshold).length;
              return (
                <tr key={p.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-line">{p.images[0] && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}</div>
                      <span className="font-medium hover:underline">{p.name}{p.featured && <span className="ml-2 text-xs text-accent">★ Featured</span>}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}{p.compareAtPrice && <span className="ml-1 text-xs text-muted line-through">{formatPrice(p.compareAtPrice)}</span>}</td>
                  <td className="px-4 py-3">
                    <span className={stock === 0 ? "text-red-700" : ""}>{stock} in {p.variants.length} variants</span>
                    {low > 0 && stock > 0 && <p className="text-xs text-amber-700">{low} low or out</p>}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className={`rounded-full px-2.5 py-0.5 text-xs ${p.active ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-600"}`} title="Click to toggle">
                        {p.active ? "Live" : "Hidden"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
