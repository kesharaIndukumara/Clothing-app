"use client";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";

export function MobileMenu({ categories, signedIn }: { categories: { name: string; slug: string }[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button className="rounded-full p-2 hover:bg-line/60 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <MenuIcon />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={close} />
          <nav className="absolute inset-y-0 left-0 flex w-72 flex-col gap-1 bg-paper p-6 shadow-xl">
            <button onClick={close} className="mb-4 self-end p-1" aria-label="Close menu"><CloseIcon /></button>
            <Link onClick={close} href="/shop" className="py-2 text-lg">Shop all</Link>
            {categories.map((c) => (
              <Link onClick={close} key={c.slug} href={`/shop?category=${c.slug}`} className="py-2 text-lg">{c.name}</Link>
            ))}
            <Link onClick={close} href="/shop?sale=1" className="py-2 text-lg text-sale">Sale</Link>
            <hr className="my-4 border-line" />
            <Link onClick={close} href={signedIn ? "/account" : "/account/login"} className="py-1.5 text-sm text-muted">{signedIn ? "My account" : "Sign in / Register"}</Link>
            <Link onClick={close} href="/account/wishlist" className="py-1.5 text-sm text-muted">Wishlist</Link>
            <Link onClick={close} href="/track" className="py-1.5 text-sm text-muted">Track your order</Link>
            <Link onClick={close} href="/size-guide" className="py-1.5 text-sm text-muted">Size guide</Link>
            <Link onClick={close} href="/contact" className="py-1.5 text-sm text-muted">Contact</Link>
          </nav>
        </div>
      )}
    </>
  );
}
