"use client";
import { useCart } from "./cart-context";
import { BagIcon } from "./icons";

export function CartButton() {
  const { count, setDrawerOpen } = useCart();
  return (
    <button
      onClick={() => setDrawerOpen(true)}
      className="relative rounded-full p-2 hover:bg-line/60"
      aria-label={`Cart, ${count} items`}
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
