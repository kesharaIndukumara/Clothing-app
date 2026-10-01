import { formatPrice } from "@/lib/format";

export function Price({ price, compareAt, className = "" }: { price: number; compareAt?: number | null; className?: string }) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-sale" : ""}>{formatPrice(price)}</span>
      {onSale && <span className="text-muted line-through text-[0.85em]">{formatPrice(compareAt)}</span>}
    </span>
  );
}
