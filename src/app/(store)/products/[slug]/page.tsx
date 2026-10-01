import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { SizeChart } from "@/components/size-chart";
import { ProductView } from "./product-view";

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: { title: p.name, description: p.description, images: p.images[0] ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelated(product.id, product.categoryId);

  return (
    <div className="container-x py-8">
      <nav className="mb-6 text-xs text-muted">
        <Link href="/shop" className="hover:underline">Shop</Link>
        {product.category && (
          <> / <Link href={`/shop?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link></>
        )}
        {" / "}<span className="text-ink">{product.name}</span>
      </nav>

      <ProductView
        product={{
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          description: product.description,
          fitNote: product.fitNote,
          images: product.images.map((i) => i.url),
          variants: product.variants.map((v) => ({
            id: v.id, size: v.size, color: v.color, colorHex: v.colorHex, stock: v.stock,
          })),
        }}
      >
        <div className="divide-y divide-line border-y border-line text-sm">
          {product.fabric && (
            <details className="group py-4" open>
              <summary className="cursor-pointer list-none font-medium">Fabric</summary>
              <p className="mt-2 text-muted">{product.fabric}</p>
            </details>
          )}
          {product.care && (
            <details className="py-4">
              <summary className="cursor-pointer list-none font-medium">Care</summary>
              <p className="mt-2 text-muted">{product.care}</p>
            </details>
          )}
          <details className="py-4">
            <summary className="cursor-pointer list-none font-medium">Size chart</summary>
            <div className="mt-3"><SizeChart /></div>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer list-none font-medium">Delivery &amp; exchanges</summary>
            <p className="mt-2 text-muted">
              Island-wide delivery in 2–4 working days. Cash on delivery available. Wrong size? Exchange within 7 days.{" "}
              <Link href="/policies/returns" className="underline">Read the policy</Link>.
            </p>
          </details>
        </div>
      </ProductView>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-2xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
