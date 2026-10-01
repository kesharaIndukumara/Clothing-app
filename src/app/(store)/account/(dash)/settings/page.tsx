import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Account settings", robots: { index: false } };

export default async function SettingsPage() {
  const user = await requireCustomer("/account/settings");
  const hasPassword = Boolean(
    await db.query.account.findFirst({ where: eq(t.account.userId, user.id), columns: { password: true } }).then((a) => a?.password),
  );
  return <SettingsForms name={user.name} email={user.email} hasPassword={hasPassword} />;
}
