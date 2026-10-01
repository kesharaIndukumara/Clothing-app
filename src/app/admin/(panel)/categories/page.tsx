import { asc } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { createCategory, deleteCategory, updateCategory } from "./actions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.query.categories.findMany({
    orderBy: asc(t.categories.position),
    with: { products: { columns: { id: true } } },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Categories</h1>
      <p className="mt-1 text-sm text-muted">Shown in the store menu and filters, in this order (lowest number first).</p>

      <ActionForm action={createCategory} className="mt-6 flex gap-2">
        <input name="name" placeholder="New category name" className="input" required />
        <button className="btn btn-sm shrink-0">Add category</button>
      </ActionForm>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-card">
        {categories.length === 0 && <li className="p-5 text-sm text-muted">No categories yet.</li>}
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <ActionForm action={updateCategory} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="position" type="number" defaultValue={c.position} className="input w-16 py-1.5" aria-label="Order" title="Display order" />
              <input name="name" defaultValue={c.name} className="input min-w-40 flex-1 py-1.5" />
              <span className="w-20 text-xs text-muted">{c.products.length} products</span>
              <button className="btn-outline btn-sm">Save</button>
            </ActionForm>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton message={`Delete "${c.name}"? Its ${c.products.length} products will be kept but left without a category.`} className="text-xs text-muted hover:text-red-700">
                Delete
              </ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
