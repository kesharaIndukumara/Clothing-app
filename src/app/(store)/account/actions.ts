"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, t } from "@/db";
import { getCustomer, requireCustomer } from "@/lib/customer-auth";
import { addressSchema, saveAddressFor } from "@/lib/addresses";

export async function addAddress(_prev: { error?: string; ok?: string } | null, formData: FormData) {
  const user = await requireCustomer("/account/addresses");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await saveAddressFor(user.id, parsed.data, formData.get("isDefault") === "on");
  revalidatePath("/account/addresses");
  return { ok: "Address saved" };
}

export async function deleteAddress(formData: FormData) {
  const user = await requireCustomer("/account/addresses");
  const id = String(formData.get("id"));
  await db.delete(t.addresses).where(and(eq(t.addresses.id, id), eq(t.addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await requireCustomer("/account/addresses");
  const id = String(formData.get("id"));
  await db.update(t.addresses).set({ isDefault: false }).where(eq(t.addresses.userId, user.id));
  await db.update(t.addresses).set({ isDefault: true }).where(and(eq(t.addresses.id, id), eq(t.addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

/** Adds or removes a product from the wishlist. */
export async function toggleWishlist(productId: string): Promise<{ signedIn: false } | { signedIn: true; saved: boolean }> {
  const user = await getCustomer();
  if (!user) return { signedIn: false };
  const where = and(eq(t.wishlistItems.userId, user.id), eq(t.wishlistItems.productId, productId));
  const existing = await db.query.wishlistItems.findFirst({ where });
  if (existing) {
    await db.delete(t.wishlistItems).where(where);
    revalidatePath("/account/wishlist");
    return { signedIn: true, saved: false };
  }
  const product = await db.query.products.findFirst({ where: eq(t.products.id, productId), columns: { id: true } });
  if (!product) return { signedIn: true, saved: false };
  await db.insert(t.wishlistItems).values({ userId: user.id, productId }).onConflictDoNothing();
  revalidatePath("/account/wishlist");
  return { signedIn: true, saved: true };
}
