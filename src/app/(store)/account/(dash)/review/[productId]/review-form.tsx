"use client";
import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { submitReview } from "@/app/(store)/products/review-actions";

export function ReviewForm({ productId, defaultName, sizeBought }: { productId: string; defaultName: string; sizeBought: string }) {
  const [state, action] = useActionState(submitReview, null);
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-line bg-card p-6">
        <p className="font-display text-xl">Thank you!</p>
        <p className="mt-2 text-sm text-muted">Your review has been sent and will appear on the product page after a quick check.</p>
        <Link href="/account/orders" className="btn-outline btn-sm mt-5">Back to orders</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("rating", String(rating));
        fd.delete("photosPicker");
        files.forEach((f) => fd.append("photos", f));
        start(() => action(fd));
      }}
      className="space-y-5 rounded-xl border border-line bg-card p-5"
    >
      <input type="hidden" name="productId" value={productId} />
      <div>
        <p className="label">Your rating</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} aria-label={`${i} star${i > 1 ? "s" : ""}`}>
              <svg width="32" height="32" viewBox="0 0 24 24"><path fill={(hover || rating) >= i ? "#b4532a" : "#e3ddd2"} d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name shown</label><input name="authorName" defaultValue={defaultName.split(" ")[0]} className="input" required maxLength={60} /></div>
        <div><label className="label">Size you bought</label><input name="sizeBought" defaultValue={sizeBought} className="input" maxLength={10} placeholder="e.g. M" /></div>
      </div>
      <div><label className="label">Title</label><input name="title" className="input" maxLength={100} placeholder="Sum it up in a few words" /></div>
      <div><label className="label">Review</label><textarea name="body" rows={5} className="input" required minLength={10} maxLength={2000} placeholder="How was the fit, fabric and quality?" /></div>
      <div>
        <p className="label">Photos (optional, up to 3)</p>
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <button key={i} type="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="relative h-20 w-16 overflow-hidden rounded-lg border border-line" title="Remove">
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/50 text-[10px] text-white">Remove</span>
            </button>
          ))}
          {files.length < 3 && (
            <label className="flex h-20 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-line text-xl text-muted hover:border-ink">
              +
              <input type="file" name="photosPicker" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={(e) => { const picked = [...(e.target.files ?? [])]; setFiles((p) => [...p, ...picked].slice(0, 3)); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Sending…" : "Submit review"}</button>
    </form>
  );
}
