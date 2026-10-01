import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/config";
import { logout } from "../login/actions";
import { AdminNav } from "./admin-nav";

export const metadata = { title: { default: "Admin", template: `%s · Admin` }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f3f1ec] print:block print:bg-white lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="print:hidden border-b border-line bg-ink text-paper lg:sticky lg:top-0 lg:h-screen lg:border-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <Link href="/admin" className="font-display text-xl font-semibold">{store.name} <span className="text-xs font-normal text-paper/60">admin</span></Link>
          <Link href="/" target="_blank" className="text-xs text-paper/60 underline lg:mt-1 lg:block">View store ↗</Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-6 text-xs text-paper/60 lg:absolute lg:bottom-0 lg:block">
          <p className="truncate">{admin.email}</p>
          <form action={logout}><button className="mt-2 underline">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex justify-end px-4 pt-3 lg:hidden print:hidden">
          <form action={logout}><button className="text-xs underline">Sign out</button></form>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
