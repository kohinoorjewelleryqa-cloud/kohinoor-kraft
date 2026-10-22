/**
 * Website photos (free Unsplash photos, served at full quality from Unsplash's image service).
 * To change a picture, replace its id with another Unsplash photo id (the part after "photo-" in the image address).
 * Real shop photos can replace these at any time.
 */
export type Photo = { id: string; en: string; ar: string; pos?: string };

export const PHOTOS = {
  hero: { id: "1758995116383-f51775896add", en: "Ornate gold bangles on a dark surface", ar: "بناجر ذهبية مزخرفة على سطح داكن" },
  craft: { id: "1786840320410-a7bec09c393c", en: "A goldsmith cutting a ring at the workbench", ar: "صائغ يقطع خاتمًا على طاولة العمل" },
  bench: { id: "1772442125267-7640b4b5f2fe", en: "A jeweller working at the bench", ar: "صائغة تعمل على طاولة الصياغة" },
  sketch: { id: "1777126413571-8ec9bf884245", en: "A gold jewellery set beside its design sketch", ar: "طقم ذهبي بجانب رسم تصميمه" },
  souq: { id: "1654781456542-fdd1683c79c3", en: "A wall of gold jewellery", ar: "جدار من المجوهرات الذهبية" },
  bars: { id: "1610375461246-83df859d849d", en: "Stacked gold bars", ar: "سبائك ذهب مكدّسة" },
  worn: { id: "1616837874254-8d5aaa63e273", en: "A woman wearing a gold necklace", ar: "امرأة ترتدي قلادة ذهبية" },
  store: { id: "1768359666502-306694fa6fcf", en: "Gold bracelets on display in a jewellery shop", ar: "أساور ذهبية معروضة في محل مجوهرات" },
} satisfies Record<string, Photo>;

/** One photo per category (by category slug). Name jewellery uses the live gold name drawing instead. */
export const CATEGORY_PHOTOS: Record<string, Photo> = {
  rings: { id: "1622398925373-3f91b1e275f5", en: "Gold rings", ar: "خواتم ذهبية" },
  bangles: { id: "1741071520904-37ef3c0fea09", en: "Gold bangles", ar: "بناجر ذهبية" },
  earrings: { id: "1617038220319-276d3cfab638", en: "Gold earrings", ar: "أقراط ذهبية" },
  pendants: { id: "1569397288884-4d43d6738fbd", en: "Gold pendant", ar: "دلاية ذهبية" },
  sets: { id: "1758995115857-2de1eb6283d0", en: "Gold bridal set", ar: "طقم عروس ذهبي" },
  men: { id: "1780565336226-b53294a9592d", en: "Gold chains for men", ar: "سلاسل ذهبية للرجال" },
};

/** Address of a photo at a given width (and height, cropped to fill). */
export function photoUrl(id: string, w: number, h?: number) {
  const p = new URLSearchParams({ auto: "format", fit: "crop", crop: "entropy", q: w >= 2400 ? "75" : "80", w: String(w) });
  if (h) p.set("h", String(h));
  return `https://images.unsplash.com/photo-${id}?${p.toString()}`;
}

/** Sizes offered to the browser; it picks the right one for the screen, up to 4K (3840 px) for full-width images. */
export function photoSrcSet(id: string, widths: number[], ratio?: number) {
  return widths.map((w) => `${photoUrl(id, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`).join(", ");
}
