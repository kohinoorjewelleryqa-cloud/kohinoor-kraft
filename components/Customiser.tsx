"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import NamePendant, { fontFor } from "./NamePendant";
import DesignVisual from "./DesignVisual";
import Gem from "./Gem";
import { gemShades, stoneLook, stoneName, stoneTypeOf, type StoneType } from "@/lib/stones";
import Ring3D from "./ring/Ring3D";
import { RING_STYLES, metalColor, ringStylesFor, type RingStyle } from "@/lib/ring3d";
import { COLORS, ENGRAVING_FONTS, KARATS, colorAllowed, estimate, isArabicText, qar } from "@/lib/gold";
import type { Dict, Lang } from "@/lib/i18n";
import { href, pick } from "@/lib/i18n";
import type { Category, Design } from "@/lib/types";
import { getUploadSlots, submitEnquiry, type EnquiryResult } from "@/lib/actions";
import { supabaseBrowser, browserConfigured } from "@/lib/supabase-browser";

type Props = {
  lang: Lang;
  d: Dict;
  design: Design | null; // null = "Create your own"
  categories: Category[];
  rates: Record<string, number>;
  weeks: [number, number];
  initial?: { name?: string; font?: string; color?: string; stone?: string };
  stones: StoneType[];
};

const MAX_PHOTOS = 3;
const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Shrinks big phone photos before upload (keeps HEIC as-is when the browser can't read it). */
async function prepare(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    if (k === 1 && file.size < 1.5e6 && file.type !== "image/heic") { bmp.close(); return file; }
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
  } catch { return file; }
}

export default function Customiser({ lang, d, design, categories, rates, weeks, initial, stones }: Props) {
  const D = d.design;
  const karats = design?.karats?.length ? design.karats : KARATS.map((k) => k.id as string);
  const colors = design?.colors?.length ? design.colors : COLORS.map((c) => c.id as string);
  const [karat, setKarat] = useState(karats[0]);
  const [color, setColor] = useState(colors.includes(initial?.color ?? "") ? initial!.color! : colors[0]);
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState(design ? Math.round(((design.weight_min + design.weight_max) / 2) * 2) / 2 : 0);
  const [stone, setStone] = useState(initial?.stone ?? "");
  const ringStyles = ringStylesFor(design ?? undefined);
  const [ringStyle, setRingStyle] = useState<RingStyle>(ringStyles?.[0] ?? "round");
  const [text, setText] = useState(initial?.name ?? "");
  const [font, setFont] = useState(initial?.font ?? "");
  const [type, setType] = useState(categories[0]?.slug ?? "");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Extract<EnquiryResult, { ok: true }> | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const effColor = colorAllowed(color, karat) ? color : colors.find((c) => colorAllowed(c, karat)) ?? "yellow";
  const stoneOpt = design?.stones.find((s) => s.id === stone);
  const est = useMemo(() => design ? estimate({ rates, karat, weightMin: weight, weightMax: weight, stonePrice: stoneOpt?.price }) : null, [design, rates, karat, weight, stoneOpt]);
  const range = useMemo(() => design ? estimate({ rates, karat, weightMin: design.weight_min, weightMax: design.weight_max, stonePrice: stoneOpt?.price }) : null, [design, rates, karat, stoneOpt]);
  const engravable = !design || design.engraving;
  const showPendant = engravable && (design ? ["name-jewellery", "pendants"].includes(design.category) : type === "name-jewellery" || text.trim().length > 0);
  const fonts = isArabicText(text || d.hero.namePlaceholder) ? ENGRAVING_FONTS.ar : ENGRAVING_FONTS.en;
  const curFont = fontFor(text || d.hero.namePlaceholder, font).id;
  const designName = design ? pick(design, "name", lang) : d.create.title;

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    setErr("");
    const next = [...photos];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!OK_TYPES.includes(f.type) && !/\.(heic|heif)$/i.test(f.name)) { setErr(d.errors.photoType); continue; }
      if (f.size > MAX_BYTES) { setErr(d.errors.photoSize); continue; }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPhotos(next);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removePhoto = (i: number) => { URL.revokeObjectURL(photos[i].url); setPhotos(photos.filter((_, k) => k !== i)); };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) || "");
    setErr("");
    if (!v("name").trim()) { setErr(d.errors.name); return; }
    if (v("phone").replace(/\D/g, "").length < 8) { setErr(d.errors.phone); return; }
    start(async () => {
      // 1) upload reference photos straight to private storage
      const paths: string[] = [];
      if (photos.length && browserConfigured) {
        const blobs = await Promise.all(photos.map((p) => prepare(p.file)));
        const types = blobs.map((b, i) => (b.type || photos[i].file.type || "image/heic").replace("image/heif", "image/heic"));
        const slots = await getUploadSlots(types);
        if (!slots.ok) { setErr(d.errors.upload); return; }
        for (let i = 0; i < slots.slots.length; i++) {
          const { error } = await supabaseBrowser().storage.from("kraft-private").uploadToSignedUrl(slots.slots[i].path, slots.slots[i].token, blobs[i], { contentType: types[i] });
          if (error) { setErr(d.errors.upload); return; }
          paths.push(slots.slots[i].path);
        }
      }
      // 2) send the request
      const notes = [ringStyles && ringStyles.length > 1 && `${D.ringStyle}: ${RING_STYLES[ringStyle][lang]}`, v("budget") && `${d.create.budget}: ${v("budget")}`, v("notes")].filter(Boolean).join("\n");
      const r = await submitEnquiry({
        lang, designSlug: design?.slug, customType: design ? undefined : categories.find((c) => c.slug === type)?.[lang === "ar" ? "name_ar" : "name_en"],
        name: v("name"), phone: v("phone"), email: v("email"),
        karat, color: effColor, size: size || undefined, weight: design ? weight : undefined, stone: stone || undefined,
        engraving: engravable ? text : undefined, font: engravable && text ? curFont : undefined, notes, photos: paths,
      });
      if (!r.ok) { setErr(r.error); return; }
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setDone(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  if (done) {
    return (
      <div className="done panel">
        <span className="done-mark" aria-hidden="true">✓</span>
        <h2>{d.done.title}</h2>
        <p className="ref">{d.done.ref}: <b className="num" dir="ltr">{done.ref}</b></p>
        <p>{d.done.next}</p>
        <div className="done-actions">
          <a className="btn wa" href={done.whatsappUrl} target="_blank" rel="noopener">{d.done.whatsapp}</a>
          <Link className="btn line" href={`${href(lang, "/track")}?ref=${encodeURIComponent(done.ref)}`}>{d.done.track}</Link>
          <Link className="btn line" href={href(lang, "/designs")}>{d.done.again}</Link>
        </div>
        {done.demo && <p className="demo-flag">Demo mode: the request was not saved.</p>}
      </div>
    );
  }

  return (
    <div className="cz">
      <div className="cz-visual">
        <div className="cz-stage">
          {design && ringStyles ? (
            <>
              <Ring3D style={ringStyle} metal={metalColor(effColor, karat)} stone={stoneOpt ? stoneLook(stoneTypeOf(stoneOpt, stones)) : undefined} hint={D.drag}>
                <DesignVisual d={design} color={effColor} alt={designName} priority lang={lang} />
              </Ring3D>
              {(ringStyles.length > 1 || design.stones.length > 0) && (
                <div className="ring-bar">
                  {ringStyles.length > 1 && (
                    <div className="rb-styles" role="radiogroup" aria-label={D.ringStyle}>
                      {ringStyles.map((rs) => <button key={rs} type="button" role="radio" aria-checked={ringStyle === rs} onClick={() => setRingStyle(rs)}><RingIcon s={rs} />{RING_STYLES[rs][lang]}</button>)}
                    </div>
                  )}
                  {design.stones.length > 0 && (
                    <div className="rb-stones" role="radiogroup" aria-label={D.stoneColour}>
                      {design.stones.map((s) => { const t = stoneTypeOf(s, stones); const c = t ? gemShades(t.color)[1] : "#EEF2F7"; return (
                        <button key={s.id} type="button" role="radio" aria-checked={stone === s.id} title={pick(s, "name", lang)} aria-label={pick(s, "name", lang)} onClick={() => setStone(stone === s.id ? "" : s.id)} style={{ "--c": c } as React.CSSProperties} />
                      ); })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : showPendant ? (
            <NamePendant text={text} placeholder={d.hero.namePlaceholder} fontId={font} color={effColor} label={D.preview} className="cz-pendant" />
          ) : design ? (
            <DesignVisual d={design} color={effColor} alt={designName} priority lang={lang} />
          ) : (
            <NamePendant text={text} placeholder={d.hero.namePlaceholder} fontId={font} color={effColor} label={D.preview} className="cz-pendant" />
          )}
        </div>
        {showPendant && <p className="cz-note">{D.previewNote}</p>}
        {design && design.images.length > 1 && (
          <div className="cz-thumbs">{design.images.slice(0, 6).map((src) => <img key={src} src={src} alt="" loading="lazy" />)}</div>
        )}
        {showPendant && design?.images[0] && <img className="cz-photo" src={design.images[0]} alt={designName} loading="lazy" />}
      </div>

      <form className="cz-form" ref={formRef} onSubmit={submit} noValidate>
        {!design && (
          <div className="field">
            <label htmlFor="type">{d.create.type}</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{pick(c, "name", lang)}</option>)}
            </select>
          </div>
        )}

        <fieldset className="opt">
          <legend>{D.karat}</legend>
          <div className="seg">
            {karats.map((k) => { const kk = KARATS.find((x) => x.id === k); return (
              <label key={k} className={karat === k ? "on" : ""}><input type="radio" name="karat" value={k} checked={karat === k} onChange={() => setKarat(k)} />{kk?.[lang] ?? `${k}K`}</label>
            ); })}
          </div>
        </fieldset>

        <fieldset className="opt">
          <legend>{D.color}</legend>
          <div className="colors">
            {colors.map((c) => { const cc = COLORS.find((x) => x.id === c)!; const ok = colorAllowed(c, karat); return (
              <label key={c} className={`${effColor === c ? "on" : ""}${ok ? "" : " off"}`} title={ok ? "" : D.whiteNote}>
                <input type="radio" name="color" value={c} checked={effColor === c} disabled={!ok} onChange={() => setColor(c)} />
                <span className="sw" style={{ background: `linear-gradient(135deg,${cc.swatch[0]},${cc.swatch[1]} 55%,${cc.swatch[2]})` }} />{cc[lang]}
              </label>
            ); })}
          </div>
          {colors.includes("white") && karat !== "18" && <p className="hint">{D.whiteNote}</p>}
        </fieldset>

        {engravable && (
          <fieldset className="opt">
            <legend>{D.engraving}</legend>
            <input className="engrave" value={text} maxLength={design?.engraving_max || 40} placeholder={D.engravingPlaceholder} onChange={(e) => setText(e.target.value)} dir="auto" />
            <div className="chips" role="radiogroup" aria-label={D.font}>
              {fonts.map((f) => <button key={f.id} type="button" role="radio" aria-checked={curFont === f.id} className="chip" style={{ fontFamily: f.family }} onClick={() => setFont(f.id)}>{f.label}</button>)}
            </div>
          </fieldset>
        )}

        {design && design.sizes.length > 0 && (
          <div className="field">
            <label htmlFor="size">{D.size}</label>
            <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">{D.sizeUnknown}</option>
              {design.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {design && design.weight_max > design.weight_min && (
          <fieldset className="opt">
            <legend>{D.weight}</legend>
            <div className="wrow"><input type="range" min={design.weight_min} max={design.weight_max} step={0.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} aria-label={D.weight} /><b className="num"><bdi>{weight.toLocaleString(lang === "ar" ? "ar-QA" : "en-US")} {D.grams}</bdi></b></div>
          </fieldset>
        )}

        {design && design.stones.length > 0 && (
          <fieldset className="opt">
            <legend>{D.stones}</legend>
            <div className="stones">
              <label className={stone === "" ? "on" : ""}><input type="radio" name="stone" checked={stone === ""} onChange={() => setStone("")} />{D.noStones}</label>
              {design.stones.map((s) => { const st = stoneTypeOf(s, stones); return (
                <label key={s.id} className={stone === s.id ? "on" : ""}><input type="radio" name="stone" checked={stone === s.id} onChange={() => setStone(s.id)} />{st && <Gem t={st} />}{pick(s, "name", lang)} <small className="num">+{qar(s.price, lang)}</small></label>
              ); })}
            </div>
          </fieldset>
        )}

        {!design && (
          <fieldset className="opt">
            <legend>{D.stones}</legend>
            <div className="stones">
              <label className={stone === "" ? "on" : ""}><input type="radio" name="stone" checked={stone === ""} onChange={() => setStone("")} />{D.noStones}</label>
              {stones.map((st) => (
                <label key={st.id} className={stone === st.id ? "on" : ""}><input type="radio" name="stone" checked={stone === st.id} onChange={() => setStone(st.id)} /><Gem t={st} />{stoneName(st, lang)}</label>
              ))}
            </div>
          </fieldset>
        )}

        {est && range && (
          <div className="estimate" aria-live="polite">
            <span>{D.estimate}</span>
            <b className="num"><bdi>≈ {qar(est.lo, lang)}</bdi></b>
            <small>{D.estimateNote} <bdi className="num">({qar(range.lo, lang)} – {qar(range.hi, lang)})</bdi></small>
            <small>{D.madeIn} <bdi className="num">{lang === "ar" ? `${(weeks[0]).toLocaleString("ar-QA")}–${weeks[1].toLocaleString("ar-QA")}` : `${weeks[0]}–${weeks[1]}`}</bdi> {D.weeks}</small>
          </div>
        )}

        {!design && (
          <div className="field">
            <label htmlFor="budget">{d.create.budget}</label>
            <input id="budget" name="budget" maxLength={60} />
          </div>
        )}

        <fieldset className="opt">
          <legend>{D.reference}</legend>
          <div className="photos">
            {photos.map((p, i) => (
              <span key={p.url} className="ph"><img src={p.url} alt="" /><button type="button" aria-label="Remove" onClick={() => removePhoto(i)}>×</button></span>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="ph add"><input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple onChange={(e) => addPhotos(e.target.files)} /><span aria-hidden="true">+</span>{D.addPhoto}</label>
            )}
          </div>
          <p className="hint">{D.referenceHint}</p>
        </fieldset>

        <div className="field">
          <label htmlFor="notes">{D.notes}</label>
          <textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder={D.notesPlaceholder} />
        </div>

        <fieldset className="opt details">
          <legend>{D.yourDetails}</legend>
          <div className="field"><label htmlFor="name">{D.name}</label><input id="name" name="name" required autoComplete="name" /></div>
          <div className="field"><label htmlFor="phone">{D.phone}</label><input id="phone" name="phone" required inputMode="tel" autoComplete="tel" dir="ltr" placeholder="5X XXX XXX" /></div>
          <div className="field"><label htmlFor="email">{D.email}</label><input id="email" name="email" type="email" autoComplete="email" dir="ltr" /></div>
        </fieldset>

        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn gold block" type="submit" disabled={pending}>{pending ? D.sending : D.submit}</button>
      </form>
    </div>
  );
}

/** Small outline icons for the ring styles. */
function RingIcon({ s }: { s: RingStyle }) {
  const isBand = ["band", "flatband", "twist", "signet", "halfeternity", "eternity"].includes(s);
  const top =
    s === "round" ? <circle cx="12" cy="8" r="3.4" />
    : s === "halo" ? <><circle cx="12" cy="8" r="2.3" /><circle cx="12" cy="8" r="4" strokeDasharray="1.2 1.2" /></>
    : s === "oval" ? <ellipse cx="12" cy="8" rx="2.6" ry="3.8" />
    : s === "emerald" ? <path d="M10 4h4l1.5 1.5v5L14 12h-4l-1.5-1.5v-5z" />
    : s === "eastwest" ? <path d="M8 6h8l1.5 1.5v1L16 10H8L6.5 8.5v-1z" />
    : s === "princess" ? <rect x="9" y="5" width="6" height="6" />
    : s === "threestone" ? <><circle cx="12" cy="8" r="2.6" /><circle cx="7" cy="10" r="1.7" /><circle cx="17" cy="10" r="1.7" /></>
    : s === "bezel" ? <><circle cx="12" cy="8" r="3.6" strokeWidth="2.2" /><circle cx="12" cy="8" r="1.6" /></>
    : s === "cluster" ? <><circle cx="12" cy="8" r="1.4" />{[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={12 + 3 * Math.cos((a * Math.PI) / 180)} cy={8 + 3 * Math.sin((a * Math.PI) / 180)} r="1.1" />)}</>
    : s === "signet" ? <rect x="8" y="6.5" width="8" height="5" rx="2.4" />
    : null;
  const band = s === "flatband" ? { sw: 3.2 } : s === "twist" ? { sw: 2.4, dash: "2.2 1.2" } : s === "eternity" ? { sw: 2.6, dash: "0.01 2.4" } : s === "halfeternity" ? { sw: 2.2 } : { sw: isBand ? 2.2 : 1.4 };
  return (
    <svg className="ri" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <ellipse cx="12" cy={isBand ? 13 : 16} rx={isBand ? 7 : 6.5} ry={isBand ? 5.5 : 4.5} strokeWidth={band.sw} strokeDasharray={band.dash} />
      {s === "halfeternity" && <path d="M6.2 10.4Q12 5.6 17.8 10.4" strokeWidth="2.6" strokeDasharray="0.01 2.3" stroke="currentColor" opacity=".55" />}
      {top}
    </svg>
  );
}
