"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import NamePendant, { fontFor } from "./NamePendant";
import DesignVisual from "./DesignVisual";
import Gem from "./Gem";
import { stoneLook, stoneName, stoneTypeOf, type StoneType } from "@/lib/stones";
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
  intro?: React.ReactNode;
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

type StepId = "type" | "color" | "karat" | "stone" | "style" | "name" | "fit" | "details";

export default function Customiser({ lang, d, design, categories, rates, weeks, initial, stones, intro }: Props) {
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
  const [who, setWho] = useState({ name: "", phone: "", email: "", notes: "", budget: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Extract<EnquiryResult, { ok: true }> | null>(null);
  const [pending, start] = useTransition();
  const [view, setView] = useState(0); // 0 = live preview, 1.. = the design's photos
  const [openInfo, setOpenInfo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const effColor = colorAllowed(color, karat) ? color : colors.find((c) => colorAllowed(c, karat)) ?? "yellow";
  const stoneOpt = design?.stones.find((s) => s.id === stone);
  const est = useMemo(() => design ? estimate({ rates, karat, weightMin: weight, weightMax: weight, stonePrice: stoneOpt?.price }) : null, [design, rates, karat, weight, stoneOpt]);
  const range = useMemo(() => design ? estimate({ rates, karat, weightMin: design.weight_min, weightMax: design.weight_max, stonePrice: stoneOpt?.price }) : null, [design, rates, karat, stoneOpt]);
  const engravable = !design || design.engraving;
  const showPendant = engravable && (design ? ["name-jewellery", "pendants"].includes(design.category) : type === "name-jewellery" || text.trim().length > 0);
  const fonts = isArabicText(text || d.hero.namePlaceholder) ? ENGRAVING_FONTS.ar : ENGRAVING_FONTS.en;
  const curFont = fontFor(text || d.hero.namePlaceholder, font).id;
  const designName = design ? pick(design, "name", lang) : d.create.title;

  // ---- the steps this design needs, in order ----
  const steps = useMemo(() => ([
    !design && "type",
    "color",
    karats.length > 1 && "karat",
    (design ? design.stones.length > 0 : stones.length > 0) && "stone",
    ringStyles && ringStyles.length > 1 && "style",
    engravable && "name",
    design && (design.sizes.length > 0 || design.weight_max > design.weight_min) && "fit",
    "details",
  ].filter(Boolean) as StepId[]), [design, karats.length, stones.length, ringStyles, engravable]);
  const [si, setSi] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const step = steps[Math.min(si, steps.length - 1)];
  const go = (n: number) => {
    const k = Math.max(0, Math.min(steps.length - 1, n));
    if (k === si) return;
    setDir(k > si ? 1 : -1); setSi(k); setErr("");
    // keep the step in view on phones
    // On phones, bring the piece back into view so each choice is seen on it.
    const el = panelRef.current?.parentElement;
    if (el && window.innerWidth < 900) {
      const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--head")) || 98;
      const y = el.getBoundingClientRect().top + window.scrollY - head;
      if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: "smooth" });
    }
  };
  const stepTitle: Record<StepId, string> = { type: D.stepType, color: D.stepColor, karat: D.stepKarat, stone: D.stepStone, style: D.stepStyle, name: D.stepName, fit: D.stepFit, details: D.stepDetails };

  // ---- the line under the name in the bar ----
  const colorLabel = COLORS.find((c) => c.id === effColor)?.[lang] ?? "";
  const karatLabel = KARATS.find((k) => k.id === karat)?.[lang] ?? `${karat}K`;
  const stoneLabel = design ? (stoneOpt ? pick(stoneOpt, "name", lang) : "") : (findStoneName(stones, stone, lang));
  const summary = [`${karatLabel} ${colorLabel}`, stoneLabel, ringStyles && ringStyles.length > 1 ? RING_STYLES[ringStyle][lang] : "", text.trim() ? `“${text.trim()}”` : ""].filter(Boolean).join(lang === "ar" ? "، " : ", ");

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
    if (step !== "details") { go(si + 1); return; }
    setErr("");
    if (!who.name.trim()) { setErr(d.errors.name); return; }
    if (who.phone.replace(/\D/g, "").length < 8) { setErr(d.errors.phone); return; }
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
      const notes = [ringStyles && ringStyles.length > 1 && `${D.ringStyle}: ${RING_STYLES[ringStyle][lang]}`, who.budget && `${d.create.budget}: ${who.budget}`, who.notes].filter(Boolean).join("\n");
      const r = await submitEnquiry({
        lang, designSlug: design?.slug, customType: design ? undefined : categories.find((c) => c.slug === type)?.[lang === "ar" ? "name_ar" : "name_en"],
        name: who.name, phone: who.phone, email: who.email,
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

  // A design with only photos shows its first photo as the main view; the rest go on the rail.
  const hasLive = !design || !!ringStyles || showPendant || !design.images.length;
  const allImages = design?.images.slice(0, 6) ?? [];
  const images = hasLive ? allImages.slice(0, 5) : allImages.slice(1);
  const live = design && ringStyles ? (
    <Ring3D style={ringStyle} metal={metalColor(effColor, karat)} stone={stoneOpt ? stoneLook(stoneTypeOf(stoneOpt, stones)) : undefined} hint={D.drag}>
      <DesignVisual d={design} color={effColor} alt={designName} priority lang={lang} />
    </Ring3D>
  ) : showPendant || !design ? (
    <NamePendant text={text} placeholder={d.hero.namePlaceholder} fontId={font} color={effColor} label={D.preview} className="cz-pendant" />
  ) : (
    <DesignVisual d={design} color={effColor} alt={designName} priority lang={lang} />
  );
  const n = (v: number) => v.toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
  const isLast = step === "details";

  return (
    <form className="cf" onSubmit={submit} noValidate>
      {/* ---------- the stage ---------- */}
      <div className="cf-stage">
        <div className={`cf-view${view === 0 ? " on" : ""}`} aria-hidden={view !== 0}>{live}</div>
        {images.map((src, i) => (
          <div key={src} className={`cf-view photo${view === i + 1 ? " on" : ""}`} aria-hidden={view !== i + 1}><img src={src} alt={view === i + 1 ? designName : ""} loading="lazy" /></div>
        ))}
        {images.length > 0 && (
          <div className="cf-rail" role="tablist" aria-label={D.photos}>
            {hasLive
              ? <button type="button" role="tab" aria-selected={view === 0} aria-label={D.live} onClick={() => setView(0)} className="live"><span><RingIcon s={ringStyles ? ringStyle : "round"} /></span></button>
              : <button type="button" role="tab" aria-selected={view === 0} aria-label={`${D.photos} 1`} onClick={() => setView(0)}><img src={allImages[0]} alt="" /></button>}
            {images.map((src, i) => <button key={src} type="button" role="tab" aria-selected={view === i + 1} aria-label={`${D.photos} ${i + (hasLive ? 1 : 2)}`} onClick={() => setView(i + 1)}><img src={src} alt="" loading="lazy" /></button>)}
          </div>
        )}
        {showPendant && view === 0 && <p className="cf-note">{D.previewNote}</p>}
      </div>

      {/* ---------- one choice at a time ---------- */}
      <div className={`cf-panel${si > 0 ? " later" : ""}`} ref={panelRef}>
        {intro}
        <div className="cf-progress" aria-hidden="true">{steps.map((s, i) => <button key={s} type="button" tabIndex={-1} className={i === si ? "on" : i < si ? "past" : ""} onClick={() => go(i)} />)}</div>
        <p className="cf-count">{D.step} <bdi className="num">{n(si + 1)}</bdi> {D.of} <bdi className="num">{n(steps.length)}</bdi></p>

        <div className="cf-step" key={step} data-dir={dir}>
          <h2 className="cf-title">{stepTitle[step]}</h2>

          {step === "type" && (
            <div className="cf-chips" role="radiogroup" aria-label={d.create.type}>
              {categories.map((c) => <button key={c.slug} type="button" role="radio" aria-checked={type === c.slug} onClick={() => setType(c.slug)}>{pick(c, "name", lang)}</button>)}
            </div>
          )}

          {step === "color" && (
            <>
              <div className="cf-swatches" role="radiogroup" aria-label={D.color}>
                {colors.map((c) => { const cc = COLORS.find((x) => x.id === c)!; const ok = colorAllowed(c, karat); return (
                  <button key={c} type="button" role="radio" aria-checked={effColor === c} disabled={!ok} title={ok ? "" : D.whiteNote} onClick={() => setColor(c)}>
                    <i style={{ background: `linear-gradient(135deg,${cc.swatch[0]},${cc.swatch[1]} 55%,${cc.swatch[2]})` }} />{cc[lang]}
                  </button>
                ); })}
              </div>
              {colors.includes("white") && karat !== "18" && <p className="hint">{D.whiteNote}</p>}
            </>
          )}

          {step === "karat" && (
            <div className="cf-tabs" role="radiogroup" aria-label={D.karat}>
              {karats.map((k) => { const kk = KARATS.find((x) => x.id === k); return <button key={k} type="button" role="radio" aria-checked={karat === k} onClick={() => setKarat(k)}>{kk?.[lang] ?? `${k}K`}</button>; })}
            </div>
          )}

          {step === "stone" && (
            <div className="cf-gems" role="radiogroup" aria-label={D.stones}>
              <button type="button" role="radio" aria-checked={stone === ""} onClick={() => setStone("")}><span className="g none" aria-hidden="true" /><b>{D.noStones}</b></button>
              {design
                ? design.stones.map((s) => { const st = stoneTypeOf(s, stones); return (
                    <button key={s.id} type="button" role="radio" aria-checked={stone === s.id} onClick={() => setStone(s.id)}><span className="g">{st && <Gem t={st} />}</span><b>{pick(s, "name", lang)}</b><small className="num">+{qar(s.price, lang)}</small></button>
                  ); })
                : stones.map((st) => <button key={st.id} type="button" role="radio" aria-checked={stone === st.id} onClick={() => setStone(st.id)}><span className="g"><Gem t={st} /></span><b>{stoneName(st, lang)}</b></button>)}
            </div>
          )}

          {step === "style" && ringStyles && (
            <div className="cf-styles" role="radiogroup" aria-label={D.ringStyle}>
              {ringStyles.map((rs) => <button key={rs} type="button" role="radio" aria-checked={ringStyle === rs} onClick={() => { setRingStyle(rs); setView(0); }}><RingIcon s={rs} /><span>{RING_STYLES[rs][lang]}</span></button>)}
            </div>
          )}

          {step === "name" && (
            <div className="cf-name">
              <input className="engrave" value={text} maxLength={design?.engraving_max || 40} placeholder={D.engravingPlaceholder} onChange={(e) => { setText(e.target.value); setView(0); }} dir="auto" aria-label={D.engraving} />
              <div className="cf-chips" role="radiogroup" aria-label={D.font}>
                {fonts.map((f) => <button key={f.id} type="button" role="radio" aria-checked={curFont === f.id} style={{ fontFamily: f.family }} onClick={() => setFont(f.id)}>{f.label}</button>)}
              </div>
            </div>
          )}

          {step === "fit" && design && (
            <div className="cf-fit">
              {design.sizes.length > 0 && (
                <div>
                  <p className="cf-sub">{D.size}</p>
                  <div className="cf-chips" role="radiogroup" aria-label={D.size}>
                    <button type="button" role="radio" aria-checked={size === ""} onClick={() => setSize("")}>{D.sizeUnknown}</button>
                    {design.sizes.map((s) => <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setSize(s)}>{s}</button>)}
                  </div>
                </div>
              )}
              {design.weight_max > design.weight_min && (
                <div>
                  <p className="cf-sub">{D.weight}</p>
                  <div className="wrow"><input type="range" min={design.weight_min} max={design.weight_max} step={0.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} aria-label={D.weight} /><b className="num"><bdi>{n(weight)} {D.grams}</bdi></b></div>
                </div>
              )}
            </div>
          )}

          {step === "details" && (
            <div className="cf-details">
              <div className="field"><label htmlFor="name">{D.name}</label><input id="name" value={who.name} onChange={(e) => setWho({ ...who, name: e.target.value })} required autoComplete="name" /></div>
              <div className="field"><label htmlFor="phone">{D.phone}</label><input id="phone" value={who.phone} onChange={(e) => setWho({ ...who, phone: e.target.value })} required inputMode="tel" autoComplete="tel" dir="ltr" placeholder="5X XXX XXX" /></div>
              <div className="field"><label htmlFor="email">{D.email}</label><input id="email" type="email" value={who.email} onChange={(e) => setWho({ ...who, email: e.target.value })} autoComplete="email" dir="ltr" /></div>
              {!design && <div className="field"><label htmlFor="budget">{d.create.budget}</label><input id="budget" value={who.budget} onChange={(e) => setWho({ ...who, budget: e.target.value })} maxLength={60} /></div>}
              <div className="field"><label htmlFor="notes">{D.notes}</label><textarea id="notes" rows={3} maxLength={1000} value={who.notes} onChange={(e) => setWho({ ...who, notes: e.target.value })} placeholder={D.notesPlaceholder} /></div>
              <div className="field">
                <span className="lbl">{D.reference}</span>
                <div className="photos">
                  {photos.map((p, i) => <span key={p.url} className="ph"><img src={p.url} alt="" /><button type="button" aria-label="Remove" onClick={() => removePhoto(i)}>×</button></span>)}
                  {photos.length < MAX_PHOTOS && <label className="ph add"><input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple onChange={(e) => addPhotos(e.target.files)} /><span aria-hidden="true">+</span>{D.addPhoto}</label>}
                </div>
                <p className="hint">{D.referenceHint}</p>
              </div>
            </div>
          )}
        </div>

        {err && <p className="err" role="alert">{err}</p>}
        <div className="cf-nav">
          {si > 0 && <button type="button" className="cf-back" onClick={() => go(si - 1)} aria-label={D.back}><Chevron /></button>}
          {isLast
            ? <button className="btn gold cf-go" type="submit" disabled={pending}>{pending ? D.sending : D.submit}</button>
            : <button className="cf-next" type="submit">{D.next}<Chevron /></button>}
        </div>
      </div>

      {/* ---------- what you've chosen, always in view ---------- */}
      <div className="cf-bar" aria-live="polite">
        <div className="cf-bar-in">
          <div className="cf-bar-txt">
            <b className="cf-bar-name">{designName}</b>
            <span className="cf-bar-sum">{summary}</span>
            {est && <button type="button" className="cf-bar-price" aria-expanded={openInfo} onClick={() => setOpenInfo(!openInfo)}><bdi className="num">≈ {qar(est.lo, lang)}</bdi><span className="i" aria-hidden="true">i</span><span className="sr">{D.details}</span></button>}
          </div>
          {!isLast && <button type="button" className="cf-bar-go" onClick={() => go(steps.length - 1)} aria-label={D.submit}><span>{D.submit}</span><Chevron /></button>}
        </div>
        {openInfo && est && range && (
          <div className="cf-info">
            <p>{D.estimateNote} <bdi className="num">({qar(range.lo, lang)} – {qar(range.hi, lang)})</bdi></p>
            <p>{D.madeIn} <bdi className="num">{n(weeks[0])}–{n(weeks[1])}</bdi> {D.weeks}</p>
          </div>
        )}
      </div>
    </form>
  );
}

function findStoneName(types: StoneType[], id: string, lang: Lang) {
  const t = types.find((x) => x.id === id);
  return t ? stoneName(t, lang) : "";
}

function Chevron() {
  return <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
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
