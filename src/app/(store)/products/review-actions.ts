"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { requireCustomer } from "@/lib/customer-auth";
import { hasBought } from "@/lib/reviews";
import { deleteImage, saveImage } from "@/lib/uploads";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Please choose a star rating").max(5),
  authorName: z.string().trim().min(1, "Enter a name").max(60),
  title: z.string().trim().max(100).default(""),
  body: z.string().trim().min(10, "Please write at least a sentence").max(2000),
  sizeBought: z.string().trim().max(10).optional(),
});

export async function submitReview(_prev: { ok?: boolean; error?: string } | null, formData: FormData) {
  const user = await requireCustomer();
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const product = await db.query.products.findFirst({ where: eq(t.products.id, d.productId), columns: { id: true } });
  if (!product) return { error: "Product not found" };
  const existing = await db.query.reviews.findFirst({ where: and(eq(t.reviews.productId, d.productId), eq(t.reviews.userId, user.id)) });
  if (existing) return { error: "You've already reviewed this product" };

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  let images: string[] = [];
  try {
    images = await Promise.all(files.map(saveImage));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Photo upload failed" };
  }

  try {
    await db.insert(t.reviews).values({
      productId: d.productId,
      userId: user.id,
      authorName: d.authorName,
      rating: d.rating,
      title: d.title,
      body: d.body,
      sizeBought: d.sizeBought || null,
      images,
      verifiedPurchase: Boolean(await hasBought(user.id, d.productId)),
      status: "PENDING", // shown after an admin approves it
    });
  } catch {
    await Promise.all(images.map(deleteImage));
    return { error: "Could not save your review" };
  }
  return { ok: true };
}
