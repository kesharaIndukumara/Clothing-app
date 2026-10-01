import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProductForm } from "../product-form";
import { deleteProduct } from "../actions";

export const metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const sp = await props.searchParams;
  const [product, categories] = await Promise.all([
    db.query.products.findFirst({
      where: eq(t.products.id, id),
      with: { images: { orderBy: asc(t.productImages.position) }, variants: true },
    }),
    db.query.categories.findMany({ orderBy: asc(t.categories.position) }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted hover:underline">← Products</Link>
      <div className="mt-1 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <div className="flex gap-2">
          <Link href={`/products/${product.slug}`} target="_blank" className="btn-outline btn-sm">View in store ↗</Link>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton message={`Delete "${product.name}"? This can't be undone. Past orders will keep their details. To hide it from the shop instead, untick "Visible in store".`} className="btn-sm rounded-full border border-red-300 px-4 py-2 text-xs text-red-700 hover:bg-red-50">
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
      {(sp.created || sp.saved) && (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{sp.created ? "Product created." : "Changes saved."}</p>
      )}
      <ProductForm
        key={product.updatedAt.getTime() + String(sp.saved ?? "")}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          description: product.description,
          fabric: product.fabric,
          care: product.care,
          fitNote: product.fitNote,
          featured: product.featured,
          active: product.active,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku, stock: v.stock })),
        }}
      />
    </div>
  );
}
