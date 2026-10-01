import Link from "next/link";
import { Stars } from "@/components/stars";
import { formatDate } from "@/lib/format";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  sizeBought: string | null;
  verifiedPurchase: boolean;
  createdAt: Date;
};

export function Reviews({
  productId,
  summary,
  reviews,
  signedIn,
}: {
  productId: string;
  summary: { count: number; average: number; dist: { rating: number; n: number }[] };
  reviews: Review[];
  signedIn: boolean;
}) {
  const writeHref = signedIn ? `/account/review/${productId}` : `/account/login?next=${encodeURIComponent(`/account/review/${productId}`)}`;
  return (
    <section id="reviews" className="mt-20 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl">Reviews</h2>
        <Link href={writeHref} className="btn-outline btn-sm">Write a review</Link>
      </div>

      {summary.count === 0 ? (
        <p className="mt-4 text-sm text-muted">No reviews yet. Bought this? Be the first to share how it fits.</p>
      ) : (
        <div className="mt-6 grid gap-10 md:grid-cols-[240px_1fr]">
          <div>
            <p className="font-display text-5xl">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size={18} />
            <p className="mt-1 text-sm text-muted">{summary.count} review{summary.count === 1 ? "" : "s"}</p>
            <ul className="mt-4 space-y-1.5">
              {summary.dist.map((d) => (
                <li key={d.rating} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{d.rating}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <span className="block h-full bg-accent" style={{ width: `${summary.count ? (d.n / summary.count) * 100 : 0}%` }} />
                  </span>
                  <span className="w-6 text-right text-muted">{d.n}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} />
                  {r.title && <p className="font-medium">{r.title}</p>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {r.authorName}
                  {r.verifiedPurchase && <span className="ml-2 text-emerald-700">✓ Verified buyer</span>}
                  {r.sizeBought && <> · Bought size {r.sizeBought}</>}
                  {" · "}{formatDate(r.createdAt).split(",")[0]}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink/85 whitespace-pre-line">{r.body}</p>
                {r.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="h-24 w-20 overflow-hidden rounded-lg bg-line">
                        <img src={src} alt="Customer photo" loading="lazy" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
