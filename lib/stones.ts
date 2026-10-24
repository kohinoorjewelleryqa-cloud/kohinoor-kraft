import type { Lang } from "./i18n";
import type { Design, StoneOption } from "./types";

/**
 * Stone types (Admin → Stones). They power "Shop by stone", the stone filters, "Create your own" and the 3D ring.
 * A design's stone option belongs to a type when its id is the type's id (chosen from the list in the design editor),
 * or, for older options typed by hand, when its name contains the type's name ("Natural diamond 0.10 ct" → Diamond).
 */
export type StoneKind = "brilliant" | "gem" | "pearl";
export type StoneType = { id: string; name_en: string; name_ar: string; color: string; kind: StoneKind; about_en: string; about_ar: string; sort_order: number; is_active: boolean };

/** Used until the stones table exists, and as the starting list. */
export const DEFAULT_STONES: StoneType[] = [
  { id: "diamond", name_en: "Diamond", name_ar: "ألماس", color: "#FFFFFF", kind: "brilliant", about_en: "The hardest natural stone, for a lifetime of sparkle. April's birthstone.", about_ar: "أصلب الأحجار الطبيعية، لبريق يدوم مدى الحياة. حجر شهر أبريل.", sort_order: 1, is_active: true },
  { id: "ruby", name_en: "Ruby", name_ar: "ياقوت أحمر", color: "#E0103F", kind: "gem", about_en: "Deep red, the stone of love and passion. July's birthstone.", about_ar: "أحمر عميق، حجر الحب والشغف. حجر شهر يوليو.", sort_order: 2, is_active: true },
  { id: "emerald", name_en: "Emerald", name_ar: "زمرد", color: "#12B05E", kind: "gem", about_en: "Rich green, linked with renewal and growth. May's birthstone.", about_ar: "أخضر غني، رمز التجدد والنماء. حجر شهر مايو.", sort_order: 3, is_active: true },
  { id: "sapphire", name_en: "Sapphire", name_ar: "ياقوت أزرق", color: "#2350D8", kind: "gem", about_en: "Royal blue, the stone of wisdom. September's birthstone.", about_ar: "أزرق ملكي، حجر الحكمة. حجر شهر سبتمبر.", sort_order: 4, is_active: true },
  { id: "pearl", name_en: "Pearl", name_ar: "لؤلؤ", color: "#F4EEE3", kind: "pearl", about_en: "Soft and timeless, a classic for brides. June's birthstone.", about_ar: "ناعم وخالد، اختيار كلاسيكي للعرائس. حجر شهر يونيو.", sort_order: 5, is_active: true },
  { id: "amethyst", name_en: "Amethyst", name_ar: "جمشت", color: "#9A4BE0", kind: "gem", about_en: "A calming purple. February's birthstone.", about_ar: "بنفسجي هادئ. حجر شهر فبراير.", sort_order: 6, is_active: true },
  { id: "cz", name_en: "Cubic zirconia", name_ar: "زركون", color: "#FBFBFF", kind: "brilliant", about_en: "Diamond-like sparkle at a gentle price.", about_ar: "بريق يشبه الألماس بسعر مناسب.", sort_order: 7, is_active: true },
];

/** Extra words that also identify the starting stones in hand-typed option names. */
const EXTRA_WORDS: Record<string, string[]> = { diamond: ["الماس"], cz: ["zircon", "cz"] };

/** Which stone type a design's stone option is (or undefined if it matches none). */
export function stoneTypeOf(s: Pick<StoneOption, "id" | "name_en" | "name_ar">, types: StoneType[]): StoneType | undefined {
  const exact = types.find((t) => t.id === s.id) ?? [...types].sort((a, b) => b.id.length - a.id.length).find((t) => s.id.startsWith(`${t.id}-`)); // "ruby-2" = a second ruby option
  if (exact) return exact;
  const hay = `${s.id} ${s.name_en} ${s.name_ar}`.toLowerCase();
  const words = (t: StoneType) => [t.name_en.toLowerCase(), t.name_ar, ...(EXTRA_WORDS[t.id] ?? [])].filter((w) => w && w.length > 1);
  const hit = (w: string) => (w.length <= 3 && /^[a-z]+$/.test(w) ? new RegExp(`\\b${w}\\b`).test(hay) : hay.includes(w));
  // Longer names first, so "Pink sapphire" wins over "Sapphire" and "Cubic zirconia" over "Diamond".
  return [...types].sort((a, b) => b.name_en.length - a.name_en.length).find((t) => words(t).some(hit));
}

export const findStone = (types: StoneType[], id?: string) => (id ? types.find((t) => t.id === id) : undefined);
export const stoneName = (t: StoneType, lang: Lang) => (lang === "ar" ? t.name_ar || t.name_en : t.name_en);
export const stoneAbout = (t: StoneType, lang: Lang) => (lang === "ar" ? t.about_ar : t.about_en);

/** The design's option for a stone type (to pre-select it), if it offers one. */
export const optionFor = (d: Pick<Design, "stones">, typeId: string | undefined, types: StoneType[]) => (typeId ? d.stones.find((s) => stoneTypeOf(s, types)?.id === typeId) : undefined);

/** Stone types offered by at least one design, with how many designs and the lowest stone price. */
export function stoneCounts(designs: Design[], types: StoneType[], keep?: string) {
  return types.map((t) => {
    const opts = designs.map((d) => optionFor(d, t.id, types)).filter(Boolean) as StoneOption[];
    return { t, count: opts.length, from: opts.length ? Math.min(...opts.map((o) => o.price)) : 0 };
  }).filter((x) => x.count > 0 || x.t.id === keep);
}

// ---------- colours ----------
const rgb = (hex: string) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: string, b: string, k: number) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * k)); };
/** How light a colour is, 0 (black) to 1 (white). */
export const lightness = (c: string) => { const [r, g, b] = rgb(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

/** Light, main and dark shades for drawing a stone. */
export function gemShades(color: string): [string, string, string] {
  const pale = lightness(color) > 0.82;
  return [mix(color, "#FFFFFF", 0.55), pale ? mix(color, "#C9D6E6", 0.5) : color, pale ? mix(color, "#7F93AE", 0.6) : mix(color, "#000000", 0.45)];
}

export type StoneLook = { color: string; ior: number; dispersion: number; pearl: boolean; clear: boolean };
/** How a stone type looks in the 3D ring. */
export function stoneLook(t?: StoneType): StoneLook {
  if (!t) return { color: "#FBFBFF", ior: 2.15, dispersion: 6, pearl: false, clear: true };
  const clear = lightness(t.color) > 0.9;
  if (t.kind === "pearl") return { color: t.color, ior: 1.5, dispersion: 0, pearl: true, clear: false };
  if (t.kind === "brilliant") return { color: t.color, ior: t.id === "diamond" ? 2.42 : 2.15, dispersion: 5, pearl: false, clear };
  return { color: t.color, ior: 1.7, dispersion: 0.4, pearl: false, clear };
}
