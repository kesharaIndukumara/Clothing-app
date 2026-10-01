"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import type { ActionState } from "@/components/admin/action-form";

async function slugTaken(slug: string, exceptId?: string) {
  const row = await db.query.categories.findFirst({
    where: exceptId ? and(eq(t.categories.slug, slug), ne(t.categories.id, exceptId)) : eq(t.categories.slug, slug),
  });
  return Boolean(row);
}

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Enter a category name" };
  const slug = slugify(name);
  if (await slugTaken(slug)) return { error: "A category with that name already exists" };
  const count = (await db.query.categories.findMany({ columns: { id: true } })).length;
  await db.insert(t.categories).values({ name, slug, position: count });
  revalidatePath("/admin/categories");
  return { ok: `Added "${name}"` };
}

export async function updateCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const position = Number(formData.get("position") ?? 0) || 0;
  if (name.length < 2) return { error: "Enter a category name" };
  const slug = slugify(name);
  if (await slugTaken(slug, id)) return { error: "A category with that name already exists" };
  await db.update(t.categories).set({ name, slug, position }).where(eq(t.categories.id, id));
  revalidatePath("/admin/categories");
  return { ok: "Saved" };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  // Products in this category are kept, just left without a category
  await db.delete(t.categories).where(eq(t.categories.id, String(formData.get("id"))));
  revalidatePath("/admin/categories");
}
