import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { store } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin login", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 shadow-sm">
        <p className="font-display text-2xl font-semibold">{store.name}</p>
        <p className="mt-1 text-sm text-muted">Sign in to manage your store</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
