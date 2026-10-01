import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { ProductCard } from "@/components/product-card";
import { WishlistButton } from "@/components/wishlist-button";

export const metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireCustomer("/account/wishlist");
  const items = await db.query.wishlistItems.findMany({
    where: eq(t.wishlistItems.userId, user.id),
    orderBy: desc(t.wishlistItems.createdAt),
    with: {
      product: {
        with: {
          images: { orderBy: asc(t.productImages.position), columns: { url: true } },
          variants: { columns: { stock: true, colorHex: true, color: true, size: true } },
        },
      },
    },
  });
  const visible = items.filter((i) => i.product.active);

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl">Wishlist</h2>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-line bg-card p-8 text-center">
          <p className="text-muted">Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn mt-5">Browse the shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
          {visible.map((i) => (
            <div key={i.id} className="relative">
              <ProductCard p={i.product} />
              <div className="absolute top-2 right-2"><WishlistButton productId={i.product.id} initial /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
