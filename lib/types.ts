export type Settings = {
  phone: string;
  whatsapp: string; // digits with country code, e.g. 97450683627
  email: string;
  address_en: string;
  address_ar: string;
  hours_en: string;
  hours_ar: string;
  rates: Record<string, number>;
  rates_updated_at: string | null;
  advance_pct: number;
  production_min_days: number;
  production_max_days: number;
};

export type Category = { slug: string; name_en: string; name_ar: string; art: string; sort_order: number };

export type StoneOption = { id: string; name_en: string; name_ar: string; price: number };

export type Design = {
  id: string;
  slug: string;
  category: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  images: string[];
  karats: string[];
  colors: string[];
  weight_min: number;
  weight_max: number;
  making_per_g: number;
  stones: StoneOption[];
  engraving: boolean;
  engraving_max: number;
  sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  art_variant: number;
};

export type PortfolioItem = { id: string; title_en: string; title_ar: string; image: string; category: string | null; sort_order: number };

export type Catalog = { settings: Settings; categories: Category[]; designs: Design[]; portfolio: PortfolioItem[]; demo: boolean };

export type QuoteDetails = {
  karat: string;
  weight: number;
  rate: number;
  making_per_g: number;
  stones: number;
  discount: number;
  total: number;
  advance_pct: number;
  advance: number;
  ready_by: string | null;
  note: string;
};
