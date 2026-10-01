import "server-only";
import { and, asc, desc, eq, gt, isNotNull, like, sql } from "drizzle-orm";
import { db, t } from "@/db";

export type ShopFilters = {
  category?: string;
  size?: string;
  color?: string;
  q?: string;
  sale?: boolean;
  sort?: "new" | "price-asc" | "price-desc";
};

const withCard = {
  images: { orderBy: asc(t.productImages.position), columns: { url: true } },
  variants: { columns: { stock: true, colorHex: true, color: true, size: true } },
} as const;

export async function getProducts(f: ShopFilters = {}) {
  const conditions = [eq(t.products.active, true)];

  if (f.category) {
    const cat = await db.query.categories.findFirst({ where: eq(t.categories.slug, f.category) });
    if (!cat) return [];
    conditions.push(eq(t.products.categoryId, cat.id));
  }
  if (f.q) conditions.push(like(t.products.name, `%${f.q}%`));
  if (f.sale) {
    conditions.push(isNotNull(t.products.compareAtPrice));
    conditions.push(gt(t.products.compareAtPrice, t.products.price));
  }

  const orderBy =
    f.sort === "price-asc" ? asc(t.products.price)
    : f.sort === "price-desc" ? desc(t.products.price)
    : desc(t.products.createdAt);

  const rows = await db.query.products.findMany({
    where: and(...conditions),
    orderBy: [orderBy, asc(t.products.name)],
    with: withCard,
  });

  // Size and colour filters only show items that are actually in stock in that option
  return rows.filter((p) =>
    (!f.size && !f.color) ||
    p.variants.some(
      (v) => v.stock > 0 && (!f.size || v.size === f.size) && (!f.color || v.color === f.color),
    ),
  );
}

export async function getFeatured(limit = 4) {
  return db.query.products.findMany({
    where: and(eq(t.products.active, true), eq(t.products.featured, true)),
    orderBy: desc(t.products.createdAt),
    limit,
    with: withCard,
  });
}

export async function getNewArrivals(limit = 8) {
  return db.query.products.findMany({
    where: eq(t.products.active, true),
    orderBy: desc(t.products.createdAt),
    limit,
    with: withCard,
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(t.products.slug, slug), eq(t.products.active, true)),
    with: {
      category: true,
      images: { orderBy: asc(t.productImages.position) },
      variants: true,
    },
  });
}

export async function getRelated(productId: string, categoryId: string | null, limit = 4) {
  if (!categoryId) return [];
  return db.query.products.findMany({
    where: and(
      eq(t.products.active, true),
      eq(t.products.categoryId, categoryId),
      sql`${t.products.id} != ${productId}`,
    ),
    limit,
    with: withCard,
  });
}

export async function getFilterOptions() {
  const [categories, colors] = await Promise.all([
    db.query.categories.findMany({ orderBy: asc(t.categories.position) }),
    db
      .selectDistinct({ color: t.variants.color, hex: t.variants.colorHex })
      .from(t.variants)
      .orderBy(asc(t.variants.color)),
  ]);
  // One swatch per colour name
  const uniqueColors = [...new Map(colors.map((c) => [c.color, c])).values()];
  return { categories, colors: uniqueColors };
}
