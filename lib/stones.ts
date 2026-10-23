import type { Lang } from "./i18n";
import type { Design, StoneOption } from "./types";

/**
 * Gemstone types used for "Shop by stone". A design's stone options (set in Admin → Designs) are matched
 * to a type by their name or id, so "Natural diamond (about 0.10 ct)" counts as Diamond.
 */
export type StoneType = { id: string; en: string; ar: string; words: string[]; colors: [string, string, string]; about_en: string; about_ar: string; round?: boolean };

export const STONE_TYPES: StoneType[] = [
  { id: "diamond", en: "Diamond", ar: "ألماس", words: ["diamond", "ألماس", "الماس"], colors: ["#FFFFFF", "#DCE9F4", "#94AEC6"], about_en: "The hardest natural stone, for a lifetime of sparkle. April's birthstone.", about_ar: "أصلب الأحجار الطبيعية، لبريق يدوم مدى الحياة. حجر شهر أبريل." },
  { id: "ruby", en: "Ruby", ar: "ياقوت أحمر", words: ["ruby", "ياقوت أحمر"], colors: ["#FF9AAE", "#D3123A", "#760420"], about_en: "Deep red, the stone of love and passion. July's birthstone.", about_ar: "أحمر عميق، حجر الحب والشغف. حجر شهر يوليو." },
  { id: "emerald", en: "Emerald", ar: "زمرد", words: ["emerald", "زمرد"], colors: ["#86E8B6", "#0F9D58", "#04552F"], about_en: "Rich green, linked with renewal and growth. May's birthstone.", about_ar: "أخضر غني، رمز التجدد والنماء. حجر شهر مايو." },
  { id: "sapphire", en: "Sapphire", ar: "ياقوت أزرق", words: ["sapphire", "ياقوت أزرق"], colors: ["#9BBEFF", "#1F4FD1", "#0B2470"], about_en: "Royal blue, the stone of wisdom. September's birthstone.", about_ar: "أزرق ملكي، حجر الحكمة. حجر شهر سبتمبر." },
  { id: "pearl", en: "Pearl", ar: "لؤلؤ", words: ["pearl", "لؤلؤ"], colors: ["#FFFFFF", "#F2ECE0", "#C9BCA4"], about_en: "Soft and timeless, a classic for brides. June's birthstone.", about_ar: "ناعم وخالد، اختيار كلاسيكي للعرائس. حجر شهر يونيو.", round: true },
  { id: "amethyst", en: "Amethyst", ar: "جمشت", words: ["amethyst", "جمشت"], colors: ["#DCC0FF", "#8A3FD1", "#4B1580"], about_en: "A calming purple. February's birthstone.", about_ar: "بنفسجي هادئ. حجر شهر فبراير." },
  { id: "cz", en: "Cubic zirconia", ar: "زركون", words: ["zirconia", "zircon", "cz", "زركون"], colors: ["#FFFFFF", "#ECE7F6", "#B2A8C9"], about_en: "Diamond-like sparkle at a gentle price.", about_ar: "بريق يشبه الألماس بسعر مناسب." },
];

/** Which stone type a design's stone option is (or undefined if it isn't one we know). */
export function stoneTypeOf(s: Pick<StoneOption, "id" | "name_en" | "name_ar">): StoneType | undefined {
  const hay = `${s.id} ${s.name_en} ${s.name_ar}`.toLowerCase();
  // Cubic zirconia is checked first, so "zirconia (diamond look)" isn't counted as a diamond.
  return [...STONE_TYPES].sort((a, b) => Number(b.id === "cz") - Number(a.id === "cz")).find((t) => t.id === s.id || t.words.some((w) => (w === "cz" ? /\bcz\b/.test(hay) : hay.includes(w))));
}

export const findStone = (id?: string) => STONE_TYPES.find((t) => t.id === id);
export const stoneName = (t: StoneType, lang: Lang) => (lang === "ar" ? t.ar : t.en);

/** The design's option for a stone type (to pre-select it), if it offers one. */
export const optionFor = (d: Pick<Design, "stones">, typeId?: string) => (typeId ? d.stones.find((s) => stoneTypeOf(s)?.id === typeId) : undefined);

/** Stone types offered by at least one design, with how many designs and the lowest stone price. */
export function stoneCounts(designs: Design[], keep?: string) {
  return STONE_TYPES.map((t) => {
    const opts = designs.map((d) => optionFor(d, t.id)).filter(Boolean) as StoneOption[];
    return { t, count: opts.length, from: opts.length ? Math.min(...opts.map((o) => o.price)) : 0 };
  }).filter((x) => x.count > 0 || x.t.id === keep);
}
