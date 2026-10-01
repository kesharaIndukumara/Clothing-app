"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort products"
      className="input w-auto"
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params);
        next.set("sort", e.target.value);
        router.push(`${pathname}?${next}`);
      }}
    >
      <option value="new">Newest</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}
