"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";

const schema = z.object({ variantId: z.string().min(1), email: z.email("Enter a valid email") });

export async function subscribeStockAlert(input: { variantId: string; email: string }) {
  const parsed = schema.safeParse({ ...input, email: input.email.trim().toLowerCase() });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const variant = await db.query.variants.findFirst({ where: eq(t.variants.id, parsed.data.variantId), columns: { stock: true } });
  if (!variant) return { error: "Item not found" };
  if (variant.stock > 0) return { error: "Good news, this size is in stock now!" };
  // If they signed up before and were already notified, reset so they get the next restock email
  await db
    .insert(t.stockAlerts)
    .values(parsed.data)
    .onConflictDoUpdate({ target: [t.stockAlerts.variantId, t.stockAlerts.email], set: { notifiedAt: null } });
  return { ok: true };
}
