// Starting categories and designs. Used before the database is connected, and as the
// database's starting data (supabase/kraft-setup.sql is generated from this file).
import type { Category, Design, StoneOption } from "./types";
import { DEFAULT_RATES } from "./gold";
import type { Settings } from "./types";

export const DEMO_SETTINGS: Settings = {
  phone: "+974 5068 3626",
  whatsapp: "97450683626",
  email: "contact@kohinoorjewelleryqa.shop",
  address_en: "Gold Center, Old Gold Souq (beside Al Fardan), Old Al Ghanim, Doha, Qatar",
  address_ar: "جولد سنتر، سوق الذهب القديم (بجانب الفردان)، الغانم القديم، الدوحة، قطر",
  hours_en: "Sat–Thu 10 am–10 pm · Fri 4 pm–10 pm",
  hours_ar: "السبت–الخميس ١٠ ص–١٠ م · الجمعة ٤ م–١٠ م",
  rates: DEFAULT_RATES,
  rates_updated_at: null,
  advance_pct: 30,
  production_min_days: 14,
  production_max_days: 28,
};

export const DEMO_CATEGORIES: Category[] = [
  { slug: "name-jewellery", name_en: "Name jewellery", name_ar: "مجوهرات بالأسماء", art: "pendants:2", sort_order: 1 },
  { slug: "rings", name_en: "Rings", name_ar: "خواتم", art: "rings:1", sort_order: 2 },
  { slug: "bangles", name_en: "Bangles & bracelets", name_ar: "أساور وبناجر", art: "bangles:2", sort_order: 3 },
  { slug: "earrings", name_en: "Earrings", name_ar: "أقراط", art: "earrings:0", sort_order: 4 },
  { slug: "pendants", name_en: "Pendants", name_ar: "دلايات", art: "pendants:0", sort_order: 5 },
  { slug: "sets", name_en: "Bridal sets", name_ar: "أطقم العرائس", art: "sets:1", sort_order: 6 },
  { slug: "men", name_en: "For men", name_ar: "للرجال", art: "chains:2", sort_order: 7 },
];

const RING = ["6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22"];
const BANGLE = ["2.2", "2.4", "2.6", "2.8", "2.10"];
const CHAIN = ['16"', '18"', '20"', '22"'];
const ALL_K = ["22", "21", "18"];
const ALL_C = ["yellow", "rose", "white"];
const STONES: StoneOption[] = [
  { id: "cz", name_en: "Cubic zirconia", name_ar: "زركون", price: 60 },
  { id: "ruby", name_en: "Ruby", name_ar: "ياقوت أحمر", price: 280 },
  { id: "emerald", name_en: "Emerald", name_ar: "زمرد", price: 280 },
  { id: "diamond", name_en: "Natural diamond (about 0.10 ct)", name_ar: "ألماس طبيعي (حوالي ٠٫١٠ قيراط)", price: 1200 },
];

type Seed = Omit<Design, "id" | "is_active" | "sort_order" | "images"> & { images?: string[] };
const seed: Seed[] = [
  { slug: "arabic-name-necklace", category: "name-jewellery", name_en: "Arabic name necklace", name_ar: "قلادة اسم بالخط العربي", description_en: "Your name, or a loved one's, cut in flowing Arabic calligraphy and finished with a fine chain.", description_ar: "اسمك أو اسم من تحب بخط عربي انسيابي، مع سلسلة رفيعة.", karats: ALL_K, colors: ALL_C, weight_min: 3, weight_max: 6, making_per_g: 60, stones: [], engraving: true, engraving_max: 14, sizes: CHAIN, is_featured: true, art_variant: 2 },
  { slug: "script-name-necklace", category: "name-jewellery", name_en: "Script name necklace", name_ar: "قلادة اسم بخط إنجليزي", description_en: "A classic script nameplate in English, polished to a mirror shine.", description_ar: "لوحة اسم كلاسيكية بخط إنجليزي مزخرف ولمعة كالمرآة.", karats: ALL_K, colors: ALL_C, weight_min: 3, weight_max: 5, making_per_g: 60, stones: [], engraving: true, engraving_max: 12, sizes: CHAIN, is_featured: true, art_variant: 2 },
  { slug: "name-bracelet", category: "name-jewellery", name_en: "Name bracelet", name_ar: "سوار بالاسم", description_en: "A slim bracelet with a name or date at the centre.", description_ar: "سوار رفيع يتوسطه اسم أو تاريخ.", karats: ALL_K, colors: ALL_C, weight_min: 5, weight_max: 9, making_per_g: 55, stones: [], engraving: true, engraving_max: 12, sizes: ["16 cm", "17 cm", "18 cm", "19 cm"], is_featured: true, art_variant: 3 },
  { slug: "baby-name-bracelet", category: "name-jewellery", name_en: "Baby name bracelet", name_ar: "سوار مولود بالاسم", description_en: "A first piece of gold for a newborn, with the baby's name.", description_ar: "أول قطعة ذهب للمولود، تحمل اسمه.", karats: ["21", "18"], colors: ["yellow", "rose"], weight_min: 2, weight_max: 4, making_per_g: 60, stones: [], engraving: true, engraving_max: 10, sizes: ["11 cm", "12 cm", "13 cm"], is_featured: false, art_variant: 0 },
  { slug: "signet-ring", category: "rings", name_en: "Initial signet ring", name_ar: "خاتم بالأحرف الأولى", description_en: "A solid signet ring engraved with your initials.", description_ar: "خاتم متين محفور بالأحرف الأولى من اسمك.", karats: ALL_K, colors: ALL_C, weight_min: 6, weight_max: 12, making_per_g: 45, stones: [], engraving: true, engraving_max: 3, sizes: RING, is_featured: true, art_variant: 1 },
  { slug: "wedding-bands", category: "rings", name_en: "Wedding bands, engraved inside", name_ar: "دبل زواج محفورة من الداخل", description_en: "A matching pair, engraved inside with your names or wedding date. Price is for the pair.", description_ar: "زوج متطابق، يُحفر من الداخل بالأسماء أو تاريخ الزواج. السعر للزوج.", karats: ALL_K, colors: ALL_C, weight_min: 8, weight_max: 14, making_per_g: 40, stones: [], engraving: true, engraving_max: 20, sizes: RING, is_featured: true, art_variant: 0 },
  { slug: "solitaire-ring", category: "rings", name_en: "Solitaire ring", name_ar: "خاتم سوليتير", description_en: "A single stone held high in a fine band. Choose the stone you like.", description_ar: "حجر واحد مرفوع على حلقة رفيعة. اختر الحجر الذي تحبه.", karats: ["18", "21"], colors: ALL_C, weight_min: 3, weight_max: 5, making_per_g: 70, stones: STONES, engraving: false, engraving_max: 0, sizes: RING, is_featured: false, art_variant: 2 },
  { slug: "classic-kada", category: "bangles", name_en: "Classic kada bangle", name_ar: "بنجرة كلاسيكية", description_en: "A solid bangle with a hand-finished edge, made to your wrist size.", description_ar: "بنجرة متينة بحافة مشغولة يدويًا، تُصنع على مقاس معصمك.", karats: ["22", "21"], colors: ["yellow", "rose"], weight_min: 15, weight_max: 30, making_per_g: 35, stones: [], engraving: true, engraving_max: 20, sizes: BANGLE, is_featured: true, art_variant: 0 },
  { slug: "engraved-bangle-set", category: "bangles", name_en: "Engraved bangle set", name_ar: "طقم بناجر محفورة", description_en: "A set of slim bangles with traditional engraving. Wear them together or apart.", description_ar: "طقم بناجر رفيعة بنقوش تقليدية، تُلبس معًا أو منفردة.", karats: ["22", "21"], colors: ["yellow"], weight_min: 25, weight_max: 45, making_per_g: 35, stones: [], engraving: false, engraving_max: 0, sizes: BANGLE, is_featured: false, art_variant: 2 },
  { slug: "gold-hoops", category: "earrings", name_en: "Gold hoops", name_ar: "أقراط حلقية", description_en: "Light everyday hoops in the size and thickness you choose.", description_ar: "أقراط حلقية خفيفة للاستخدام اليومي بالمقاس والسماكة التي تختارها.", karats: ALL_K, colors: ALL_C, weight_min: 4, weight_max: 8, making_per_g: 45, stones: [], engraving: false, engraving_max: 0, sizes: ["15 mm", "20 mm", "30 mm", "40 mm"], is_featured: false, art_variant: 2 },
  { slug: "drop-earrings", category: "earrings", name_en: "Drop earrings", name_ar: "أقراط متدلية", description_en: "Elegant drops for occasions, plain or set with stones.", description_ar: "أقراط متدلية أنيقة للمناسبات، سادة أو مرصعة بالأحجار.", karats: ALL_K, colors: ALL_C, weight_min: 6, weight_max: 12, making_per_g: 50, stones: STONES, engraving: false, engraving_max: 0, sizes: [], is_featured: true, art_variant: 0 },
  { slug: "calligraphy-pendant", category: "pendants", name_en: "Calligraphy pendant", name_ar: "دلاية بالخط العربي", description_en: "A word or phrase that matters to you, in Arabic calligraphy: Mashallah, a name or a verse.", description_ar: "كلمة أو عبارة تهمك بالخط العربي: ما شاء الله، اسم أو آية.", karats: ALL_K, colors: ALL_C, weight_min: 3, weight_max: 7, making_per_g: 60, stones: [], engraving: true, engraving_max: 16, sizes: CHAIN, is_featured: true, art_variant: 3 },
  { slug: "heart-pendant", category: "pendants", name_en: "Heart pendant with initials", name_ar: "دلاية قلب بالأحرف الأولى", description_en: "A heart engraved with two initials, a lasting gift.", description_ar: "قلب محفور بحرفين، هدية تدوم.", karats: ALL_K, colors: ALL_C, weight_min: 2, weight_max: 4, making_per_g: 55, stones: STONES, engraving: true, engraving_max: 5, sizes: CHAIN, is_featured: false, art_variant: 0 },
  { slug: "bridal-set", category: "sets", name_en: "Bridal necklace set", name_ar: "طقم عروس", description_en: "Necklace and earrings designed with you for your wedding day. Bangles and ring can be added.", description_ar: "قلادة وأقراط نصممها معك ليوم زفافك، ويمكن إضافة بناجر وخاتم.", karats: ["22", "21"], colors: ["yellow"], weight_min: 60, weight_max: 120, making_per_g: 30, stones: STONES, engraving: false, engraving_max: 0, sizes: [], is_featured: true, art_variant: 1 },
  { slug: "mens-chain", category: "men", name_en: "Men's chain", name_ar: "سلسلة رجالية", description_en: "A strong chain in the link style and length you choose.", description_ar: "سلسلة متينة بنوع الحلقات والطول الذي تختاره.", karats: ["22", "21", "18"], colors: ["yellow", "white"], weight_min: 20, weight_max: 40, making_per_g: 25, stones: [], engraving: false, engraving_max: 0, sizes: ['20"', '22"', '24"'], is_featured: false, art_variant: 2 },
  { slug: "mens-ring", category: "men", name_en: "Men's ring", name_ar: "خاتم رجالي", description_en: "A bold ring for him, plain, engraved, or set with a stone.", description_ar: "خاتم رجالي بارز، سادة أو محفور أو مرصع بحجر.", karats: ["21", "18"], colors: ["yellow", "white"], weight_min: 8, weight_max: 14, making_per_g: 45, stones: STONES, engraving: true, engraving_max: 10, sizes: RING, is_featured: false, art_variant: 3 },
  { slug: "gold-studs", category: "earrings", name_en: "Gold stud earrings", name_ar: "أقراط ذهبية صغيرة", description_en: "Small, light studs for every day: round, heart or star.", description_ar: "أقراط صغيرة وخفيفة للاستخدام اليومي: دائرة أو قلب أو نجمة.", karats: ["21", "18"], colors: ALL_C, weight_min: 1, weight_max: 2.5, making_per_g: 50, stones: [], engraving: false, engraving_max: 0, sizes: [], is_featured: false, art_variant: 1 },
  { slug: "baby-ring", category: "rings", name_en: "Baby gold ring", name_ar: "خاتم ذهب للمولود", description_en: "A tiny first ring for a baby, plain or with an initial.", description_ar: "خاتم صغير للمولود، سادة أو بحرف من اسمه.", karats: ["21", "18"], colors: ["yellow", "rose"], weight_min: 1, weight_max: 2, making_per_g: 55, stones: [], engraving: true, engraving_max: 1, sizes: ["Baby", "Child"], is_featured: false, art_variant: 0 },
  { slug: "initial-charm", category: "pendants", name_en: "Initial charm", name_ar: "دلاية بالحرف الأول", description_en: "A single letter in English or Arabic, light and easy to wear.", description_ar: "حرف واحد بالعربية أو الإنجليزية، خفيف وسهل الارتداء.", karats: ALL_K, colors: ALL_C, weight_min: 1, weight_max: 2, making_per_g: 60, stones: [], engraving: true, engraving_max: 1, sizes: CHAIN, is_featured: false, art_variant: 1 },
];

export const DEMO_DESIGNS: Design[] = seed.map((d, i) => ({ id: `demo-${i + 1}`, images: [], is_active: true, sort_order: i + 1, ...d }));
