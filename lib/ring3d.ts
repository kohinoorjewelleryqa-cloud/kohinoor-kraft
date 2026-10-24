/**
 * Live 3D ring preview: which designs get it, the ring styles they offer, and how metals and stones look.
 * The rings are built in code (no 3D files needed), so adding a style to a design is a one-line change below.
 */
export type RingStyle = "round" | "oval" | "emerald" | "eastwest" | "princess" | "halo" | "band";

export const RING_STYLES: Record<RingStyle, { en: string; ar: string }> = {
  round: { en: "Round solitaire", ar: "سوليتير دائري" },
  oval: { en: "Oval", ar: "بيضاوي" },
  emerald: { en: "Emerald cut", ar: "قَطع الزمرد" },
  eastwest: { en: "East-west", ar: "أفقي" },
  princess: { en: "Princess", ar: "مربع (برنسيس)" },
  halo: { en: "Halo", ar: "هالة" },
  band: { en: "Plain band", ar: "دبلة سادة" },
};

/** Design slug → ring styles shown in 3D (the first is the default). Designs not listed keep their photo or drawing. */
export const RING_3D: Record<string, RingStyle[]> = {
  "solitaire-ring": ["round", "oval", "emerald", "eastwest", "princess", "halo"],
  "wedding-bands": ["band"],
  "baby-ring": ["band"],
};
export const ringStylesFor = (slug?: string) => (slug ? RING_3D[slug] : undefined);

/** Metal colours in 3D, a little richer for higher karats. */
export function metalColor(color: string, karat: string) {
  if (color === "white") return "#E4E6EA";
  if (color === "rose") return karat === "18" ? "#E9AE95" : "#E7A387";
  return karat === "22" ? "#F2C25C" : karat === "21" ? "#EFC468" : "#EAC97E";
}
