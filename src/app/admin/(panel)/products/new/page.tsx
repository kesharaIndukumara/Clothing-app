import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "../product-form";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await db.query.categories.findMany({ orderBy: asc(t.categories.position) });
  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted hover:underline">← Products</Link>
      <h1 className="mt-1 mb-6 font-display text-3xl">Add product</h1>
      <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
