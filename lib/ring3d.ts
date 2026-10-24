/**
 * Live 3D ring preview: the ring styles, which designs show them, and how metals look.
 * The rings are built in code (no 3D files needed). Admin → Designs → a design → "3D ring preview"
 * chooses the styles for each design.
 */
export type RingStyle =
  | "round" | "oval" | "emerald" | "eastwest" | "princess" | "halo" | "threestone" | "bezel" | "cluster"
  | "band" | "flatband" | "twist" | "signet" | "halfeternity" | "eternity";

export const RING_STYLES: Record<RingStyle, { en: string; ar: string }> = {
  round: { en: "Round solitaire", ar: "سوليتير دائري" },
  oval: { en: "Oval", ar: "بيضاوي" },
  emerald: { en: "Emerald cut", ar: "قَطع الزمرد" },
  eastwest: { en: "East-west", ar: "أفقي" },
  princess: { en: "Princess", ar: "مربع (برنسيس)" },
  halo: { en: "Halo", ar: "هالة" },
  threestone: { en: "Three stone", ar: "ثلاثة أحجار" },
  bezel: { en: "Bezel set", ar: "إطار مغلق" },
  cluster: { en: "Cluster", ar: "عنقودي" },
  band: { en: "Classic band", ar: "دبلة كلاسيكية" },
  flatband: { en: "Flat band", ar: "دبلة مسطحة" },
  twist: { en: "Twisted band", ar: "دبلة مجدولة" },
  signet: { en: "Signet", ar: "خاتم ختم" },
  halfeternity: { en: "Half eternity", ar: "نصف إيترنيتي" },
  eternity: { en: "Full eternity", ar: "إيترنيتي كامل" },
};

/** Styles grouped for the admin. */
export const STONE_RING_STYLES: RingStyle[] = ["round", "oval", "emerald", "eastwest", "princess", "halo", "threestone", "bezel", "cluster"];
export const BAND_STYLES: RingStyle[] = ["band", "flatband", "twist", "signet", "halfeternity", "eternity"];
export const ALL_RING_STYLES: RingStyle[] = [...STONE_RING_STYLES, ...BAND_STYLES];
/** Styles that show the chosen stone. */
export const STYLE_HAS_STONES = (s: RingStyle) => STONE_RING_STYLES.includes(s) || s === "halfeternity" || s === "eternity";

/** Used before the "3D ring preview" setting exists in the database. */
export const RING_3D: Record<string, RingStyle[]> = {
  "solitaire-ring": ["round", "oval", "emerald", "eastwest", "princess", "halo", "threestone", "bezel", "cluster"],
  "wedding-bands": ["band", "flatband", "twist", "halfeternity", "eternity"],
  "baby-ring": ["band", "flatband", "twist"],
};

/** The 3D styles for a design (the first is the default), or undefined when it shows its photo instead. */
export function ringStylesFor(d?: { slug: string; ring_3d?: string[] | null }): RingStyle[] | undefined {
  if (!d) return undefined;
  const list = Array.isArray(d.ring_3d) ? d.ring_3d.filter((s): s is RingStyle => s in RING_STYLES) : RING_3D[d.slug];
  return list && list.length ? list : undefined;
}

/** Metal colours in 3D, a little richer for higher karats. */
export function metalColor(color: string, karat: string) {
  if (color === "white") return "#E4E6EA";
  if (color === "rose") return karat === "18" ? "#E9AE95" : "#E7A387";
  return karat === "22" ? "#F2C25C" : karat === "21" ? "#EFC468" : "#EAC97E";
}
