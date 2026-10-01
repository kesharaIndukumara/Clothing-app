"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const path = usePathname();
  const router = useRouter();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line pb-2 md:flex-col md:border-0 md:pb-0">
      {LINKS.map((l) => {
        const active = l.href === "/account" ? path === "/account" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap ${active ? "bg-ink text-paper" : "hover:bg-line/60"}`}>
            {l.label}
          </Link>
        );
      })}
      <button
        onClick={async () => {
          await authClient.signOut();
          router.push("/");
          router.refresh();
        }}
        className="rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap text-muted hover:bg-line/60"
      >
        Sign out
      </button>
    </nav>
  );
}
