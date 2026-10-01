import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { siteUrl } from "@/lib/email";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([
    db.query.products.findMany({ where: eq(t.products.active, true), columns: { slug: true, updatedAt: true } }),
    db.query.categories.findMany({ columns: { slug: true } }),
  ]);
  const pages = ["", "/shop", "/about", "/contact", "/size-guide", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.5 })),
    ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
