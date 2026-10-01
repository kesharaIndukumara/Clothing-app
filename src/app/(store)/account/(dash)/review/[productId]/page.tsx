import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { hasBought } from "@/lib/reviews";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Write a review", robots: { index: false } };

export default async function ReviewPage(props: PageProps<"/account/review/[productId]">) {
  const { productId } = await props.params;
  const user = await requireCustomer(`/account/review/${productId}`);
  const product = await db.query.products.findFirst({
    where: eq(t.products.id, productId),
    with: { images: { orderBy: asc(t.productImages.position), limit: 1 } },
  });
  if (!product) notFound();
  const [existing, bought] = await Promise.all([
    db.query.reviews.findFirst({ where: and(eq(t.reviews.productId, productId), eq(t.reviews.userId, user.id)) }),
    hasBought(user.id, productId),
  ]);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-line">{product.images[0] && <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />}</div>
        <div>
          <p className="label mb-0">Reviewing</p>
          <Link href={`/products/${product.slug}`} className="font-display text-2xl hover:underline">{product.name}</Link>
        </div>
      </div>
      {existing ? (
        <div className="rounded-xl border border-line bg-card p-5 text-sm">
          You&apos;ve already reviewed this product.{" "}
          {existing.status === "PENDING" ? "It will appear once approved." : existing.status === "APPROVED" ? "Thanks for sharing!" : "It wasn't published."}
        </div>
      ) : (
        <ReviewForm productId={product.id} defaultName={user.name} sizeBought={bought?.size ?? ""} />
      )}
    </div>
  );
}
