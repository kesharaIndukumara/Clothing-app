import { desc, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { DISTRICTS } from "@/lib/config";
import { ActionForm } from "@/components/admin/action-form";
import { addAddress, deleteAddress, setDefaultAddress } from "../../actions";

export const metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireCustomer("/account/addresses");
  const addresses = await db.query.addresses.findMany({
    where: eq(t.addresses.userId, user.id),
    orderBy: [desc(t.addresses.isDefault), desc(t.addresses.createdAt)],
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-display text-2xl">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted">No saved addresses yet. Addresses you use at checkout are saved here automatically.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className={`rounded-xl border bg-card p-5 text-sm ${a.isDefault ? "border-ink" : "border-line"}`}>
                {a.isDefault && <p className="label text-accent">Default</p>}
                <p className="font-medium">{a.fullName}</p>
                <p className="text-muted">{a.phone}</p>
                <p className="mt-2 text-muted">{a.address}<br />{a.city}, {a.district}</p>
                <div className="mt-4 flex gap-4 text-xs">
                  {!a.isDefault && (
                    <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="underline">Make default</button></form>
                  )}
                  <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-muted underline hover:text-red-700">Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-5">
        <h3 className="mb-4 font-medium">Add an address</h3>
        <ActionForm action={addAddress} className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Full name</label><input name="fullName" className="input" required defaultValue={user.name} /></div>
          <div><label className="label">Mobile number</label><input name="phone" className="input" required placeholder="07X XXX XXXX" /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input name="address" className="input" required /></div>
          <div><label className="label">City</label><input name="city" className="input" required /></div>
          <div>
            <label className="label">District</label>
            <select name="district" className="input" required defaultValue="">
              <option value="" disabled>Choose district</option>
              {Object.keys(DISTRICTS).sort().map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isDefault" className="accent-ink" /> Make this my default address</label>
          <div className="sm:col-span-2"><button className="btn btn-sm">Save address</button></div>
        </ActionForm>
      </section>
    </div>
  );
}
