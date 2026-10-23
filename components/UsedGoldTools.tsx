"use client";
import { useRef, useState, useTransition } from "react";
import { submitUsedGold, getUploadSlots, type EnquiryResult } from "@/lib/actions";
import { qar } from "@/lib/gold";
import type { Dict, Lang } from "@/lib/i18n";
import { supabaseBrowser, browserConfigured } from "@/lib/supabase-browser";
import { shrink } from "@/lib/upload";

const KS = ["24", "22", "21", "18"];
const MAX_PHOTOS = 3;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Used gold: value calculator, then a form to exchange or sell (prefilled from the calculator). */
export default function UsedGoldTools({ lang, d, buy }: { lang: Lang; d: Dict; buy: Record<string, number> }) {
  const U = d.used;
  const [karat, setKarat] = useState("21");
  const [weight, setWeight] = useState("");
  const [mode, setMode] = useState<"exchange" | "sell">("exchange");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Extract<EnquiryResult, { ok: true }> | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const kLabel = (k: string) => (lang === "ar" ? `عيار ${Number(k).toLocaleString("ar-QA")}` : `${k}K`);
  const w = Number(weight.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)).replace(",", "."));
  const rate = buy[karat] ?? buy["18"];
  const value = w > 0 ? Math.round(w * rate) : 0;

  const addPhotos = (list: FileList | null) => {
    if (!list) return;
    const next = [...photos];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      if (!OK_TYPES.includes(f.type) && !/\.(heic|heif)$/i.test(f.name)) { setErr(d.errors.photoType); continue; }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPhotos(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) || "");
    setErr("");
    if (!v("items").trim()) { setErr(U.errItems); return; }
    if (!v("name").trim()) { setErr(d.errors.name); return; }
    if (v("phone").replace(/\D/g, "").length < 8) { setErr(d.errors.phone); return; }
    start(async () => {
      const paths: string[] = [];
      if (photos.length && browserConfigured) {
        const blobs = await Promise.all(photos.map((p) => shrink(p.file, 2000, 0.85)));
        const types = blobs.map((b, i) => (b.type || photos[i].file.type || "image/heic").replace("image/heif", "image/heic"));
        const slots = await getUploadSlots(types);
        if (!slots.ok) { setErr(d.errors.upload); return; }
        for (let i = 0; i < slots.slots.length; i++) {
          const { error } = await supabaseBrowser().storage.from("kraft-private").uploadToSignedUrl(slots.slots[i].path, slots.slots[i].token, blobs[i], { contentType: types[i] });
          if (error) { setErr(d.errors.upload); return; }
          paths.push(slots.slots[i].path);
        }
      }
      const r = await submitUsedGold({ lang, mode, name: v("name"), phone: v("phone"), karat: karat === "x" ? undefined : karat, weight: w > 0 ? w : undefined, items: v("items"), photos: paths });
      if (!r.ok) { setErr(r.error); return; }
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setDone(r);
      document.getElementById("ug-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <section className="ug-calc panel" aria-labelledby="ugc">
        <h2 id="ugc">{U.calcT}</h2>
        <div className="field">
          <span className="lbl">{U.karat}</span>
          <div className="chips" role="radiogroup" aria-label={U.karat}>
            {[...KS, "x"].map((k) => (
              <button key={k} type="button" role="radio" aria-checked={karat === k} className="chip" onClick={() => setKarat(k)}>{k === "x" ? U.notSure : kLabel(k)}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="ugw">{U.weight}</label>
          <input id="ugw" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.,٠-٩]/g, ""))} placeholder="10" dir="ltr" />
        </div>
        <div className="ug-value" aria-live="polite">
          <span>{U.value}</span>
          <b className="num"><bdi>{value ? qar(value, lang) : "—"}</bdi></b>
          <small>{kLabel(karat === "x" ? "18" : karat)} · <bdi>{qar(rate, lang)}</bdi> / {lang === "ar" ? "غ" : "g"}</small>
        </div>
        {karat === "x" && <p className="muted small">{U.notSureNote}</p>}
        <p className="muted small">{U.calcNote}</p>
        <a className="btn gold" href="#ug-form">{U.formT}</a>
      </section>

      <section id="ug-form" className="ug-form panel" aria-labelledby="ugf">
        {done ? (
          <div className="done">
            <span className="done-mark" aria-hidden="true">✓</span>
            <h2>{U.doneT}</h2>
            <p className="ref">{d.done.ref}: <b className="num" dir="ltr">{done.ref}</b></p>
            <p>{U.doneP}</p>
            <div className="done-actions"><a className="btn wa" href={done.whatsappUrl} target="_blank" rel="noopener">{d.done.whatsapp}</a></div>
            {done.demo && <p className="demo-flag">Demo mode: the request was not saved.</p>}
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="ugf">{U.formT}</h2>
            <fieldset className="opt">
              <legend>{U.choice}</legend>
              <div className="ug-modes" role="radiogroup" aria-label={U.choice}>
                {(["exchange", "sell"] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} className="ug-mode" onClick={() => setMode(m)}>
                    <b>{m === "sell" ? U.sellT : U.exchangeT}</b>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="field"><label htmlFor="items">{U.items}</label><textarea id="items" name="items" rows={3} placeholder={U.itemsPh} maxLength={600} /></div>
            <div className="ug-row">
              <div className="field"><label htmlFor="ugk">{U.karat}</label>
                <select id="ugk" value={karat} onChange={(e) => setKarat(e.target.value)}>
                  {[...KS, "x"].map((k) => <option key={k} value={k}>{k === "x" ? U.notSure : kLabel(k)}</option>)}
                </select>
              </div>
              <div className="field"><label htmlFor="ugw2">{U.approxWeight}</label><input id="ugw2" inputMode="decimal" dir="ltr" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^\d.,٠-٩]/g, ""))} /></div>
            </div>
            <fieldset className="opt">
              <legend>{U.photos}</legend>
              <div className="photos">
                {photos.map((p, i) => (
                  <span key={p.url} className="ph"><img src={p.url} alt="" /><button type="button" aria-label="Remove" onClick={() => { URL.revokeObjectURL(p.url); setPhotos(photos.filter((_, k) => k !== i)); }}>×</button></span>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="ph add"><input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple onChange={(e) => addPhotos(e.target.files)} /><span aria-hidden="true">+</span>{d.design.addPhoto}</label>
                )}
              </div>
            </fieldset>
            <div className="ug-row">
              <div className="field"><label htmlFor="ugn">{d.design.name}</label><input id="ugn" name="name" autoComplete="name" /></div>
              <div className="field"><label htmlFor="ugp">{d.design.phone}</label><input id="ugp" name="phone" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="5X XXX XXX" /></div>
            </div>
            {mode === "sell" && <p className="muted small">{U.bringId}</p>}
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn gold big" type="submit" disabled={pending}>{pending ? U.sending : U.send}</button>
          </form>
        )}
      </section>
    </>
  );
}
