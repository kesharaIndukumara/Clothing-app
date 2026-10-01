import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/email";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/order/", "/pay/", "/api/", "/track"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
