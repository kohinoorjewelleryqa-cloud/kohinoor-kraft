import { artSvg, CATEGORY_ART } from "@/lib/art";
import NamePendant from "./NamePendant";
import type { Design } from "@/lib/types";

/** The design's first photo, or a gold drawing until photos are uploaded. */
/** Sample name shown on name-jewellery designs until real photos are uploaded. */
export const sampleName = (slug: string, lang: "en" | "ar") => (slug.includes("arabic") ? "فاطمة" : slug.includes("script") ? "Fatima" : lang === "ar" ? "نور" : "Noor");

export default function DesignVisual({ d, color, alt, priority = false, lang = "en" }: { d: Pick<Design, "images" | "category" | "art_variant" | "colors" | "slug">; color?: string; alt: string; priority?: boolean; lang?: "en" | "ar" }) {
  const src = d.images?.[0];
  if (src) return <img className="dv-img" src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />;
  const c = color || (d.colors?.includes("yellow") ? "yellow" : d.colors?.[0]) || "yellow";
  if (d.category === "name-jewellery") return <span className="dv-name"><NamePendant text={sampleName(d.slug, lang)} color={c} label={alt} /></span>;
  return <span className="dv-art" role="img" aria-label={alt} dangerouslySetInnerHTML={{ __html: artSvg(CATEGORY_ART[d.category] ?? "pendants", c, "none", d.art_variant ?? 0) }} />;
}
