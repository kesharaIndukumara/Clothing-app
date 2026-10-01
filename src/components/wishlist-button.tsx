"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleWishlist } from "@/app/(store)/account/actions";

export function WishlistButton({ productId, initial = false, withLabel = false }: { productId: string; initial?: boolean; withLabel?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s); // optimistic
        start(async () => {
          const res = await toggleWishlist(productId);
          if (!res.signedIn) {
            setSaved(false);
            router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
          } else {
            setSaved(res.saved);
            router.refresh();
          }
        });
      }}
      className={withLabel ? "btn-outline w-full" : "flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-sm backdrop-blur hover:bg-card"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "#b4532a" : "none"} stroke={saved ? "#b4532a" : "currentColor"} strokeWidth="1.7">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
      </svg>
      {withLabel && (saved ? "Saved to wishlist" : "Save to wishlist")}
    </button>
  );
}
