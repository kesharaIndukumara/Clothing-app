import { requireCustomer } from "@/lib/customer-auth";
import { AccountNav } from "./account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  return (
    <div className="container-x py-10">
      <p className="label">My account</p>
      <h1 className="font-display text-4xl">Hi, {user.name.split(" ")[0]}</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
