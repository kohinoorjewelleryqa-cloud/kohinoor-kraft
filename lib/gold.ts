// Gold, prices and order stages for Kohinoor Kraft Jewellery (custom-made gold).

export type Lang = "en" | "ar";

export const KARATS = [
  { id: "22", purity: "916", en: "22K", ar: "عيار ٢٢" },
  { id: "21", purity: "875", en: "21K", ar: "عيار ٢١" },
  { id: "18", purity: "750", en: "18K", ar: "عيار ١٨" },
] as const;
export type KaratId = (typeof KARATS)[number]["id"];
/** Rate keys shown on the gold-rate page (24K is for reference; pieces are made in 22K, 21K or 18K). */
export const RATE_KEYS = ["24", "22", "21", "18"] as const;
export const DEFAULT_RATES: Record<string, number> = { "24": 480, "22": 440, "21": 420, "18": 360 };

/**
 * Used-gold buying rates (QAR per gram), kept with the selling rates under keys "u24", "u22", "u21", "u18".
 * Until the shop sets them, they default to 94% of the selling rate.
 */
export const BUY_DEFAULT_PCT = 0.94;
export function buyRates(rates: Record<string, number>) {
  return Object.fromEntries(RATE_KEYS.map((k) => {
    const v = Number(rates[`u${k}`]);
    return [k, v > 0 ? v : Math.round((rates[k] ?? DEFAULT_RATES[k]) * BUY_DEFAULT_PCT)];
  })) as Record<string, number>;
}

export const COLORS = [
  { id: "yellow", en: "Yellow gold", ar: "ذهب أصفر", swatch: ["#FBE7A1", "#D9A93C", "#8C6516"] },
  { id: "rose", en: "Rose gold", ar: "ذهب وردي", swatch: ["#FAD4C0", "#D58C6A", "#8E4E36"] },
  { id: "white", en: "White gold", ar: "ذهب أبيض", swatch: ["#FFFFFF", "#D9DCE0", "#8F959C"] },
] as const;
export type ColorId = (typeof COLORS)[number]["id"];
/** White gold is an 18K alloy. */
export const colorAllowed = (color: string, karat: string) => color !== "white" || karat === "18";

export const ENGRAVING_FONTS = {
  en: [
    { id: "script", label: "Script", family: "'Great Vibes', cursive", size: 1 },
    { id: "classic", label: "Classic", family: "'Marcellus', serif", size: 0.72 },
    { id: "modern", label: "Modern", family: "'Figtree', sans-serif", size: 0.68 },
  ],
  ar: [
    { id: "ruqaa", label: "رقعة", family: "'Aref Ruqaa', serif", size: 0.95 },
    { id: "naskh", label: "نسخ", family: "'Amiri', serif", size: 0.9 },
    { id: "kufi", label: "كوفي", family: "'Reem Kufi', sans-serif", size: 0.82 },
  ],
} as const;
export const isArabicText = (s: string) => /[؀-ۿ]/.test(s);

/** Order stages, in sequence. Customers see these on the tracking page. */
export const STAGES = [
  { id: "new", en: "Request received", ar: "تم استلام الطلب" },
  { id: "quoted", en: "Quote sent", ar: "تم إرسال عرض السعر" },
  { id: "advance_paid", en: "Advance received", ar: "تم استلام الدفعة المقدمة" },
  { id: "design_approval", en: "Design ready for your approval", ar: "التصميم جاهز لموافقتك" },
  { id: "in_production", en: "Being handcrafted", ar: "قيد الصياغة اليدوية" },
  { id: "finishing", en: "Polishing and hallmarking", ar: "التلميع والدمغ" },
  { id: "ready", en: "Ready for you", ar: "جاهز للاستلام" },
  { id: "delivered", en: "Delivered", ar: "تم التسليم" },
] as const;
export const STAGE_IDS = [...STAGES.map((s) => s.id), "cancelled"] as const;
export type StageId = (typeof STAGE_IDS)[number];
export const stageLabel = (id: string, lang: Lang) =>
  id === "cancelled" ? (lang === "ar" ? "ملغي" : "Cancelled") : STAGES.find((s) => s.id === id)?.[lang] ?? id;

export const rateFor = (rates: Record<string, number>, karat: string) => Number(rates[karat] ?? DEFAULT_RATES[karat] ?? 0);

/** Rounds to the nearest 10 riyals. */
const r10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Making charge by weight (QAR per gram), set in Admin → Gold rates & settings and kept with the rates:
 * under mkw1 grams → mk1, from mkw1 to under mkw2 → mk2, mkw2 and above → mk3.
 * The shop's rule: 1–2 g 150/g, 3–6 g 120/g, 7 g and above 100/g. Customers never see it separately;
 * every price on the website already includes it.
 */
export const MAKING_DEFAULT = { mk1: 150, mk2: 120, mk3: 100, mkw1: 3, mkw2: 7 };
export function makingTiers(rates: Record<string, number>) {
  const v = (k: keyof typeof MAKING_DEFAULT) => (Number(rates[k]) > 0 ? Number(rates[k]) : MAKING_DEFAULT[k]);
  return { mk1: v("mk1"), mk2: v("mk2"), mk3: v("mk3"), mkw1: v("mkw1"), mkw2: v("mkw2") };
}
export function makingFor(weight: number, rates: Record<string, number>) {
  const t = makingTiers(rates);
  return weight < t.mkw1 ? t.mk1 : weight < t.mkw2 ? t.mk2 : t.mk3;
}

/**
 * Estimated price range (making charge included): (gold rate + making charge for that weight) × weight, plus stones.
 * The final price is confirmed by the shop with the exact weight and the work involved.
 */
export function estimate(opts: { rates: Record<string, number>; karat: string; weightMin: number; weightMax: number; stonePrice?: number }) {
  const rate = rateFor(opts.rates, opts.karat);
  const stones = Math.max(0, opts.stonePrice || 0);
  const price = (w: number) => r10((rate + makingFor(w, opts.rates)) * Math.max(0, w) + stones);
  const lo = price(opts.weightMin);
  const hi = Math.max(lo, price(Math.max(opts.weightMin, opts.weightMax)));
  return { rate, lo, hi };
}

export const qar = (n: number, lang: Lang = "en") =>
  lang === "ar" ? `${Math.round(n).toLocaleString("ar-QA")} ر.ق` : `QAR ${Math.round(n).toLocaleString("en-US")}`;
