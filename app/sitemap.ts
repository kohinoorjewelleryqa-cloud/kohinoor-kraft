import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { designs } = await getCatalog();
  const pages = ["", "/designs", "/create", "/portfolio", "/gold-rate", "/used-gold", "/about", "/faq", "/contact", "/terms", "/privacy", ...designs.map((d) => `/designs/${d.slug}`)];
  return pages.map((p) => ({
    url: `${site}/en${p}`,
    changeFrequency: "daily" as const,
    alternates: { languages: { en: `${site}/en${p}`, ar: `${site}/ar${p}` } },
  }));
}
