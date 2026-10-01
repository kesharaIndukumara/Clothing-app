"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, t } from "@/db";
import { REVIEW_STATUSES, type ReviewStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { deleteImage } from "@/lib/uploads";

export async function setReviewStatus(formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as ReviewStatus;
  if (!REVIEW_STATUSES.includes(status)) return;
  await db.update(t.reviews).set({ status }).where(eq(t.reviews.id, String(formData.get("id"))));
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const review = await db.query.reviews.findFirst({ where: eq(t.reviews.id, id) });
  if (!review) return;
  await db.delete(t.reviews).where(eq(t.reviews.id, id));
  await Promise.all(review.images.map(deleteImage));
  revalidatePath("/admin/reviews");
}
