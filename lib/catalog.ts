import "server-only";
import { unstable_cache } from "next/cache";
import { publicClient, supabaseConfigured } from "./supabase-server";
import { DEMO_CATEGORIES, DEMO_DESIGNS, DEMO_SETTINGS } from "./demo";
import { DEFAULT_RATES } from "./gold";
import type { Catalog, Category, Design, PortfolioItem, Settings } from "./types";
import { DEFAULT_STONES, type StoneType } from "./stones";

// All Kraft data lives in tables starting with "kraft_", in the same Supabase project as the silver store.
async function load(): Promise<Omit<Catalog, "demo">> {
  const db = publicClient();
  const [s, c, d, p, st] = await Promise.all([
    db.from("kraft_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("kraft_categories").select("*").order("sort_order"),
    db.from("kraft_designs").select("*").eq("is_active", true).order("sort_order").order("created_at", { ascending: false }),
    db.from("kraft_portfolio").select("*").order("sort_order").order("created_at", { ascending: false }),
    db.from("kraft_stones").select("*").eq("is_active", true).order("sort_order").order("name_en"),
  ]);
  if (s.error) throw s.error;
  const settings = { ...DEMO_SETTINGS, ...(s.data ?? {}) } as Settings;
  settings.rates = { ...DEFAULT_RATES, ...(s.data?.rates ?? {}) };
  const num = (v: unknown, f = 0) => (v === null || v === undefined || v === "" ? f : Number(v));
  return {
    settings,
    categories: (c.data as Category[]) ?? [],
    designs: ((d.data as Design[]) ?? []).map((x) => ({
      ...x,
      images: x.images ?? [], karats: x.karats ?? [], colors: x.colors ?? [], sizes: x.sizes ?? [], stones: x.stones ?? [],
      weight_min: num(x.weight_min), weight_max: num(x.weight_max), making_per_g: num(x.making_per_g), engraving_max: num(x.engraving_max, 12), art_variant: num(x.art_variant),
    })),
    portfolio: (p.data as PortfolioItem[]) ?? [],
    // Until the stones table is added (supabase/kraft-stones.sql), the starting list is used.
    stones: st.error || !st.data ? DEFAULT_STONES : (st.data as StoneType[]),
  };
}

const cached = unstable_cache(load, ["kraft-catalog-v2"], { tags: ["kraft"], revalidate: 600 });

export async function getCatalog(): Promise<Catalog> {
  if (!supabaseConfigured) return { settings: DEMO_SETTINGS, categories: DEMO_CATEGORIES, designs: DEMO_DESIGNS, portfolio: [], stones: DEFAULT_STONES, demo: true };
  return { ...(await cached()), demo: false };
}

export async function getDesign(slug: string): Promise<Design | undefined> {
  return (await getCatalog()).designs.find((d) => d.slug === slug);
}
