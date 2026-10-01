import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { REVIEW_STATUSES, type ReviewStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Stars } from "@/components/stars";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteReview, setReviewStatus } from "./actions";

export const metadata = { title: "Reviews" };
const LABEL: Record<ReviewStatus, string> = { PENDING: "Waiting", APPROVED: "Published", REJECTED: "Rejected" };

export default async function ReviewsPage(props: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = (REVIEW_STATUSES as readonly string[]).includes(String(sp.status)) ? (sp.status as ReviewStatus) : "PENDING";
  const [reviews, counts] = await Promise.all([
    db.query.reviews.findMany({
      where: eq(t.reviews.status, status),
      orderBy: desc(t.reviews.createdAt),
      limit: 100,
      with: { product: { columns: { name: true, slug: true, id: true } } },
    }),
    db.select({ status: t.reviews.status, n: count() }).from(t.reviews).groupBy(t.reviews.status),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl">Reviews</h1>
      <p className="mt-1 text-sm text-muted">New reviews wait here until you publish them.</p>
      <div className="mt-6 flex gap-1 border-b border-line">
        {REVIEW_STATUSES.map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`} className={`border-b-2 px-3 py-2 text-sm ${status === s ? "border-ink font-medium" : "border-transparent text-muted"}`}>
            {LABEL[s]} <span className="text-xs text-muted">{counts.find((c) => c.status === s)?.n ?? 0}</span>
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nothing here.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/products/${r.product.slug}`} target="_blank" className="text-xs text-muted hover:underline">{r.product.name} ↗</Link>
                  <div className="mt-1 flex items-center gap-2"><Stars value={r.rating} /> <span className="font-medium">{r.title}</span></div>
                  <p className="text-xs text-muted">
                    {r.authorName} · {formatDate(r.createdAt)}
                    {r.verifiedPurchase && <span className="ml-1 text-emerald-700">· ✓ Verified buyer</span>}
                    {r.sizeBought && <> · Size {r.sizeBought}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {status !== "APPROVED" && (
                    <form action={setReviewStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="APPROVED" /><button className="btn btn-sm">Publish</button></form>
                  )}
                  {status !== "REJECTED" && (
                    <form action={setReviewStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="REJECTED" /><button className="btn-outline btn-sm">{status === "APPROVED" ? "Unpublish" : "Reject"}</button></form>
                  )}
                  <form action={deleteReview}><input type="hidden" name="id" value={r.id} /><ConfirmButton message="Delete this review permanently?" className="px-2 text-xs text-muted hover:text-red-700">Delete</ConfirmButton></form>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{r.body}</p>
              {r.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.images.map((src) => <a key={src} href={src} target="_blank" className="h-20 w-16 overflow-hidden rounded bg-line"><img src={src} alt="" className="h-full w-full object-cover" /></a>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
