"use server";

import { and, eq, ne, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, t } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { deleteImage, saveImage } from "@/lib/uploads";
import type { ActionState } from "@/components/admin/action-form";
import { notifyRestocked } from "@/lib/stock-alerts";

const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Every variant needs a size").max(20),
  color: z.string().trim().min(1, "Every variant needs a colour").max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid colour"),
  sku: z.string().trim().max(60).default(""),
  stock: z.coerce.number().int().min(0, "Stock can't be negative").max(100000),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().max(140).optional(),
  categoryId: z.string().optional(),
  price: z.coerce.number().int("Use whole rupees").min(1, "Price is required"),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  description: z.string().trim().max(5000).default(""),
  fabric: z.string().trim().max(300).default(""),
  care: z.string().trim().max(500).default(""),
  fitNote: z.string().trim().max(200).default(""),
  featured: z.literal("on").optional(),
  active: z.literal("on").optional(),
  variants: z.array(variantSchema).min(1, "Add at least one size/colour variant"),
  keepImages: z.array(z.string()).default([]),
});

function parse(formData: FormData) {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  return productSchema.safeParse({
    ...raw,
    variants: JSON.parse(String(formData.get("variants") ?? "[]")),
    keepImages: JSON.parse(String(formData.get("keepImages") ?? "[]")),
  });
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base || "product";
  for (let i = 2; ; i++) {
    const clash = await db.query.products.findFirst({
      where: excludeId ? and(eq(t.products.slug, slug), ne(t.products.id, excludeId)) : eq(t.products.slug, slug),
      columns: { id: true },
    });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
}

function checkDuplicateVariants(variants: { size: string; color: string }[]) {
  const seen = new Set<string>();
  for (const v of variants) {
    const k = `${v.color.toLowerCase()}|${v.size.toLowerCase()}`;
    if (seen.has(k)) return `Duplicate variant: ${v.color} / ${v.size}`;
    seen.add(k);
  }
  return null;
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const productId = (formData.get("id") as string) || undefined;
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const dup = checkDuplicateVariants(d.variants);
  if (dup) return { error: dup };
  const compareAt = d.compareAtPrice === "" || d.compareAtPrice === undefined ? null : d.compareAtPrice;
  if (compareAt !== null && compareAt <= d.price) return { error: "\"Was\" price must be higher than the selling price (or leave it empty)" };

  // Upload new images first; if a file is invalid nothing is saved
  const files = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  let uploaded: string[];
  try {
    uploaded = await Promise.all(files.map(saveImage));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image upload failed" };
  }

  const slug = await uniqueSlug(slugify(d.slug || d.name), productId);
  const values = {
    name: d.name,
    slug,
    categoryId: d.categoryId || null,
    price: d.price,
    compareAtPrice: compareAt,
    description: d.description,
    fabric: d.fabric,
    care: d.care,
    fitNote: d.fitNote,
    featured: d.featured === "on",
    active: d.active === "on",
  };

  let id = productId;
  let removedImages: string[] = [];
  try {
    await db.transaction(async (tx) => {
      if (id) {
        await tx.update(t.products).set(values).where(eq(t.products.id, id));
      } else {
        const [row] = await tx.insert(t.products).values(values).returning({ id: t.products.id });
        id = row.id;
      }

      // Images: keep the ones still listed (in that order), then append new uploads
      const existing = await tx.query.productImages.findMany({ where: eq(t.productImages.productId, id) });
      removedImages = existing.filter((img) => !d.keepImages.includes(img.url)).map((img) => img.url);
      await tx.delete(t.productImages).where(eq(t.productImages.productId, id));
      const allImages = [...d.keepImages.filter((u) => existing.some((e) => e.url === u)), ...uploaded];
      if (allImages.length) {
        await tx.insert(t.productImages).values(allImages.map((url, position) => ({ productId: id!, url, position })));
      }

      // Variants: update existing, insert new, delete removed
      const keepIds = d.variants.map((v) => v.id).filter(Boolean) as string[];
      await tx.delete(t.variants).where(
        keepIds.length ? and(eq(t.variants.productId, id), notInArray(t.variants.id, keepIds)) : eq(t.variants.productId, id),
      );
      for (const v of d.variants) {
        const row = { size: v.size, color: v.color, colorHex: v.colorHex, sku: v.sku, stock: v.stock };
        if (v.id) await tx.update(t.variants).set(row).where(and(eq(t.variants.id, v.id), eq(t.variants.productId, id)));
        else await tx.insert(t.variants).values({ ...row, productId: id });
      }
    });
  } catch (e) {
    await Promise.all(uploaded.map(deleteImage));
    console.error(e);
    return { error: "Could not save the product. Please try again." };
  }
  await Promise.all(removedImages.map(deleteImage));

  // Email anyone waiting for a size of this product that's now back in stock
  const variantIds = (await db.query.variants.findMany({ where: eq(t.variants.productId, id!), columns: { id: true } })).map((v) => v.id);
  await notifyRestocked(variantIds).catch((e) => console.error("Back-in-stock emails failed", e));

  revalidatePath("/admin/products");
  redirect(`/admin/products/${id}?${productId ? "saved" : "created"}=${Date.now()}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const images = await db.query.productImages.findMany({ where: eq(t.productImages.productId, id) });
  // Past orders keep their snapshot (name, price, size) so they still display correctly
  await db.delete(t.products).where(eq(t.products.id, id));
  await Promise.all(images.map((i) => deleteImage(i.url)));
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function toggleActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const p = await db.query.products.findFirst({ where: eq(t.products.id, id), columns: { active: true } });
  if (p) await db.update(t.products).set({ active: !p.active }).where(eq(t.products.id, id));
  revalidatePath("/admin/products");
}
