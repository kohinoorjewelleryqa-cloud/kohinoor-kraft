import { estimate } from "./gold";
import type { Lang } from "./i18n";
import type { Design } from "./types";

/** A design's starting price: lightest weight in the lowest karat it is offered in (the "From" price on cards). */
export function fromPrice(d: Pick<Design, "karats" | "weight_min">, rates: Record<string, number>) {
  const k = [...d.karats].sort()[0] ?? "18";
  return estimate({ rates, karat: k, weightMin: d.weight_min, weightMax: d.weight_min }).lo;
}

/** Shop-by-budget bands (QAR). "under-1000" means the design starts below QAR 1,000. */
const LIMITS = [500, 1000, 2500, 5000, 10000];
const TOP = 10000;

export type Budget = { id: string; max?: number; min?: number };
export const BUDGETS: Budget[] = [...LIMITS.map((max) => ({ id: `under-${max}`, max })), { id: `${TOP}-plus`, min: TOP }];

export const inBudget = (b: Budget, price: number) => (b.max !== undefined ? price < b.max : price >= (b.min ?? 0));
export const findBudget = (id?: string) => BUDGETS.find((b) => b.id === id);

const n = (v: number, lang: Lang) => v.toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
/** Short parts for the budget tiles: a small label and a big amount. */
export function budgetParts(b: Budget, lang: Lang) {
  if (lang === "ar") return b.max !== undefined ? { pre: "أقل من", amount: n(b.max, lang), post: "ر.ق" } : { pre: "", amount: n(b.min!, lang), post: "ر.ق فأكثر" };
  return b.max !== undefined ? { pre: "Under", amount: n(b.max, lang), post: "QAR" } : { pre: "From", amount: n(b.min!, lang), post: "QAR & above" };
}
export function budgetLabel(b: Budget, lang: Lang) {
  if (lang === "ar") return b.max !== undefined ? `أقل من ${n(b.max, lang)} ر.ق` : `${n(b.min!, lang)} ر.ق فأكثر`;
  return b.max !== undefined ? `Under QAR ${n(b.max, lang)}` : `QAR ${n(b.min!, lang)} & above`;
}

/** Budgets that have at least one design, with how many. */
export function budgetCounts(designs: Design[], rates: Record<string, number>, keep?: string) {
  const prices = designs.map((d) => fromPrice(d, rates));
  return BUDGETS.map((b) => ({ b, count: prices.filter((p) => inBudget(b, p)).length })).filter((x) => x.count > 0 || x.b.id === keep);
}

export function designCount(n: number, lang: Lang) {
  if (lang !== "ar") return `${n} ${n === 1 ? "design" : "designs"}`;
  const v = n.toLocaleString("ar-QA");
  return n === 1 ? "تصميم واحد" : n === 2 ? "تصميمان" : n <= 10 ? `${v} تصاميم` : `${v} تصميمًا`;
}
