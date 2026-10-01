import Link from "next/link";
import { Price } from "./price";

export type CardProduct = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: { url: string }[];
  variants: { stock: number; colorHex: string; color: string }[];
};

export function ProductCard({ p }: { p: CardProduct }) {
  const soldOut = p.variants.every((v) => v.stock <= 0);
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const colors = [...new Map(p.variants.map((v) => [v.color, v.colorHex])).entries()];
  const [first, second] = p.images;

  return (
    <Link href={`/products/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-line">
        {first && (
          <img src={first.url} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
        {second && (
          <img src={second.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {soldOut && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] text-paper">Sold out</span>}
          {!soldOut && onSale && <span className="rounded-full bg-sale px-2.5 py-1 text-[11px] text-white">Sale</span>}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="text-sm">{p.name}</h3>
        <div className="flex shrink-0 gap-1 pt-1">
          {colors.slice(0, 4).map(([name, hex]) => (
            <span key={name} title={name} className="h-3 w-3 rounded-full border border-black/10" style={{ background: hex }} />
          ))}
        </div>
      </div>
      <Price price={p.price} compareAt={p.compareAtPrice} className="mt-1 text-sm" />
    </Link>
  );
}
