/**
 * Main categories (Women, Men, Kids, Gifting, Bridal sets) and their subcategories.
 * A category with no parent is a main category. Designs sit in a subcategory,
 * or directly in a main category that has no subcategories (e.g. Gifting).
 */
import type { Category } from "./types";

const bySort = (a: Category, b: Category) => a.sort_order - b.sort_order || a.name_en.localeCompare(b.name_en);

/** Main categories, in order. A category whose parent no longer exists counts as main. */
export function mainCats(cats: Category[]): Category[] {
  const slugs = new Set(cats.map((c) => c.slug));
  return cats.filter((c) => !c.parent || !slugs.has(c.parent)).sort(bySort);
}

/** Subcategories of a main category, in order. */
export function subCats(cats: Category[], slug: string): Category[] {
  return cats.filter((c) => c.parent === slug).sort(bySort);
}

/** The main category a category belongs to (itself if it is a main category). */
export function mainOf(cats: Category[], slug: string): Category | undefined {
  const c = cats.find((x) => x.slug === slug);
  if (!c) return undefined;
  return (c.parent && cats.find((x) => x.slug === c.parent)) || c;
}

/** The category and everything under it, for filtering designs. */
export function slugsUnder(cats: Category[], slug: string): string[] {
  return [slug, ...subCats(cats, slug).map((c) => c.slug)];
}

/** Categories a design can be placed in: subcategories, plus main categories without any. */
export function placeableCats(cats: Category[]): { main: Category; items: Category[] }[] {
  return mainCats(cats).map((m) => { const subs = subCats(cats, m.slug); return { main: m, items: subs.length ? subs : [m] }; });
}
