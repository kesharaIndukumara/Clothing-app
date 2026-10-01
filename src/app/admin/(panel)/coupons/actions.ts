"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, t } from "@/db";
import { COUPON_TYPES } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/components/admin/action-form";

const optionalDate = z.string().optional().transform((v) => (v ? new Date(`${v}T00:00:00+05:30`) : null));

const schema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3–30 letters, numbers, - or _"),
    type: z.enum(COUPON_TYPES),
    value: z.coerce.number().int().min(0).default(0),
    minSubtotal: z.coerce.number().int().min(0).default(0),
    maxUses: z.string().optional().transform((v) => (v ? Number(v) : null)).pipe(z.number().int().min(1).nullable()),
    onePerCustomer: z.literal("on").optional(),
    startsAt: optionalDate,
    expiresAt: optionalDate,
  })
  .refine((d) => d.type !== "PERCENT" || (d.value >= 1 && d.value <= 100), { message: "Percent must be between 1 and 100", path: ["value"] })
  .refine((d) => d.type !== "FIXED" || d.value >= 1, { message: "Enter the amount off", path: ["value"] });

export async function createCoupon(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (await db.query.coupons.findFirst({ where: eq(t.coupons.code, d.code) })) return { error: "That code already exists" };
  // Expiry is inclusive: valid until the end of that day
  const expiresAt = d.expiresAt ? new Date(d.expiresAt.getTime() + 86400e3 - 1) : null;
  await db.insert(t.coupons).values({ ...d, onePerCustomer: d.onePerCustomer === "on", expiresAt });
  revalidatePath("/admin/coupons");
  return { ok: `Created ${d.code}` };
}

export async function toggleCoupon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const c = await db.query.coupons.findFirst({ where: eq(t.coupons.id, id) });
  if (c) await db.update(t.coupons).set({ active: !c.active }).where(eq(t.coupons.id, id));
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  await db.delete(t.coupons).where(eq(t.coupons.id, String(formData.get("id"))));
  revalidatePath("/admin/coupons");
}
