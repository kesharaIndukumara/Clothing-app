"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-context";
import { Price } from "@/components/price";
import { WishlistButton } from "@/components/wishlist-button";
import { SIZES, store } from "@/lib/config";
import { track } from "@/lib/track";
import { Stars } from "@/components/stars";
import { NotifyMe } from "./notify-me";

type Variant = { id: string; size: string; color: string; colorHex: string; stock: number };
type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    description: string;
    fitNote: string;
    images: string[];
    variants: Variant[];
  };
  inWishlist: boolean;
  rating?: { average: number; count: number };
  defaultEmail?: string;
  children: React.ReactNode;
};

export function ProductView({ product, inWishlist, rating, defaultEmail, children }: Props) {
  const { add } = useCart();

  useEffect(() => {
    track("view_item", { id: product.id, name: product.name, price: product.price });
  }, [product.id, product.name, product.price]);
  const colors = useMemo(
    () => [...new Map(product.variants.map((v) => [v.color, v.colorHex])).entries()],
    [product.variants],
  );
  const sizes = useMemo(() => {
    const present = new Set(product.variants.map((v) => v.size));
    const ordered = SIZES.filter((s) => present.has(s)) as string[];
    return [...ordered, ...[...present].filter((s) => !ordered.includes(s))];
  }, [product.variants]);

  const firstInStock = product.variants.find((v) => v.stock > 0);
  const [color, setColor] = useState(firstInStock?.color ?? colors[0]?.[0]);
  const [size, setSize] = useState<string | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [error, setError] = useState("");

  const variantFor = (s: string) => product.variants.find((v) => v.color === color && v.size === s);
  const selected = size ? variantFor(size) : undefined;
  const allSoldOut = product.variants.every((v) => v.stock <= 0);

  function addToBag() {
    if (!size) return setError("Please choose a size");
    if (!selected || selected.stock <= 0) return setError("This size is sold out");
    setError("");
    add({
      variantId: selected.id,
      slug: product.slug,
      name: product.name,
      size: selected.size,
      color: selected.color,
      price: product.price,
      image: product.images[0] ?? null,
      maxStock: selected.stock,
    });
    track("add_to_cart", { id: product.id, name: product.name, price: product.price, quantity: 1 });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      {/* Gallery */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <div className="flex gap-2 sm:w-20 sm:flex-col">
          {product.images.map((src, i) => (
            <button
              key={src}
              onClick={() => setImageIdx(i)}
              className={`aspect-[4/5] w-16 overflow-hidden rounded-md border-2 sm:w-full ${i === imageIdx ? "border-ink" : "border-transparent"}`}
              aria-label={`Image ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="aspect-[4/5] flex-1 overflow-hidden rounded-xl bg-line">
          {product.images[imageIdx] && (
            <img src={product.images[imageIdx]} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
        <Price price={product.price} compareAt={product.compareAtPrice} className="mt-2 text-lg" />
        {rating && rating.count > 0 && (
          <a href="#reviews" className="mt-2 flex items-center gap-2 text-xs text-muted hover:text-ink">
            <Stars value={rating.average} /> {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? "" : "s"}
          </a>
        )}
        <p className="mt-5 leading-relaxed text-ink/80">{product.description}</p>

        <div className="mt-7">
          <p className="label">Colour: <span className="text-ink normal-case">{color}</span></p>
          <div className="flex flex-wrap gap-2">
            {colors.map(([name, hex]) => (
              <button
                key={name}
                onClick={() => { setColor(name); setError(""); }}
                title={name}
                aria-label={name}
                className={`h-9 w-9 rounded-full border-2 p-0.5 ${color === name ? "border-ink" : "border-transparent"}`}
              >
                <span className="block h-full w-full rounded-full border border-black/10" style={{ background: hex }} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="label">Size {size && <span className="text-ink">: {size}</span>}</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const v = variantFor(s);
              const out = !v || v.stock <= 0;
              return (
                <button
                  key={s}
                  disabled={!v}
                  title={out ? "Sold out. Select to get notified" : undefined}
                  onClick={() => { setSize(s); setError(""); }}
                  className={`h-11 min-w-12 rounded-lg border px-3 text-sm transition ${
                    size === s ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"
                  } ${out && size !== s ? "text-muted/60 line-through" : ""} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {selected && selected.stock > 0 && selected.stock <= store.lowStockThreshold && (
            <p className="mt-2 text-xs text-accent">Only {selected.stock} left in this size</p>
          )}
          {product.fitNote && <p className="mt-2 text-xs text-muted">{product.fitNote}</p>}
        </div>

        {selected && selected.stock <= 0 ? (
          <NotifyMe key={selected.id} variantId={selected.id} label={`${selected.color} / ${selected.size}`} defaultEmail={defaultEmail} />
        ) : allSoldOut && !size ? (
          <div className="mt-7 rounded-xl border border-line bg-card p-4 text-sm">
            <p className="font-medium">Sold out</p>
            <p className="mt-1 text-muted">Choose your size above and we&apos;ll email you when it&apos;s back.</p>
          </div>
        ) : (
          <button onClick={addToBag} className="btn mt-7 w-full py-4">Add to bag</button>
        )}
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-3"><WishlistButton productId={product.id} initial={inWishlist} withLabel /></div>
        <a
          href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in "${product.name}". Is it available?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline mt-3 w-full"
        >
          Ask on WhatsApp
        </a>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
