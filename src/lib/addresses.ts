import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { DISTRICTS } from "./config";
import { normalizePhone } from "./format";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a name").max(100),
  phone: z.string().transform(normalizePhone).refine((p) => /^0\d{9}$/.test(p), "Enter a valid mobile number"),
  address: z.string().trim().min(5, "Enter the full address").max(300),
  city: z.string().trim().min(2, "Enter a city").max(80),
  district: z.string().refine((d) => d in DISTRICTS, "Choose a district"),
});

/** Saves an address for the signed-in customer. The first one becomes the default. */
export async function saveAddressFor(userId: string, data: z.infer<typeof addressSchema>, makeDefault = false) {
  const existing = await db.query.addresses.findMany({ where: eq(t.addresses.userId, userId) });
  const dup = existing.find((a) => a.address === data.address && a.phone === data.phone && a.city === data.city);
  if (dup) return dup.id;
  const isDefault = makeDefault || existing.length === 0;
  if (isDefault) await db.update(t.addresses).set({ isDefault: false }).where(eq(t.addresses.userId, userId));
  const [row] = await db.insert(t.addresses).values({ ...data, userId, isDefault }).returning({ id: t.addresses.id });
  return row.id;
}

