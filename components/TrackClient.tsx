"use client";
import { useState, useTransition } from "react";
import { approveDesign, trackOrder, type TrackResult } from "@/lib/actions";
import { COLORS, KARATS, STAGES, qar, stageLabel } from "@/lib/gold";
import type { Dict, Lang } from "@/lib/i18n";

const fmt = (s: string, lang: Lang) => new Date(s).toLocaleDateString(lang === "ar" ? "ar-QA" : "en-GB", { timeZone: "Asia/Qatar", day: "numeric", month: "long", year: "numeric" });

export default function TrackClient({ lang, d, initialRef, whatsapp }: { lang: Lang; d: Dict; initialRef: string; whatsapp: string }) {
  const T = d.track;
  const [res, setRes] = useState<TrackResult | null>(null);
  const [creds, setCreds] = useState({ ref: initialRef, phone: "" });
  const [pending, start] = useTransition();

  const find = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ref = String(fd.get("ref") || "").trim(), phone = String(fd.get("phone") || "");
    setCreds({ ref, phone });
    start(async () => setRes(await trackOrder(ref, phone, lang)));
  };
  const approve = () => start(async () => {
    const r = await approveDesign(creds.ref, creds.phone);
    if (r.ok) setRes(await trackOrder(creds.ref, creds.phone, lang));
  });

  const o = res && res.ok ? res : null;
  const idx = o ? STAGES.findIndex((s) => s.id === o.status) : -1;
  const when = (id: string) => o?.events.filter((e) => e.status === id).at(-1)?.at;

  return (
    <div className="track">
      <form className="panel track-form" onSubmit={find}>
        <div className="field"><label htmlFor="ref">{T.ref}</label><input id="ref" name="ref" defaultValue={initialRef} placeholder={T.refPlaceholder} required dir="ltr" autoCapitalize="characters" /></div>
        <div className="field"><label htmlFor="tphone">{T.phone}</label><input id="tphone" name="phone" inputMode="tel" required dir="ltr" placeholder="5X XXX XXX" autoComplete="tel" /></div>
        <button className="btn gold" type="submit" disabled={pending}>{pending && !o ? "…" : T.find}</button>
      </form>

      {res && !res.ok && <p className="err" role="alert">{T.notFound}</p>}

      {o && (
        <section className="panel order" aria-live="polite">
          <header>
            <span className="num" dir="ltr">{o.ref}</span>
            <h2>{o.designName}</h2>
            <p className="muted">
              {[KARATS.find((k) => k.id === o.karat)?.[lang], COLORS.find((c) => c.id === o.color)?.[lang], o.size, o.engraving && `“${o.engraving}”`].filter(Boolean).join(" · ")}
            </p>
          </header>

          {o.status === "cancelled" ? (
            <p className="err">{stageLabel("cancelled", lang)}</p>
          ) : (
            <ol className="timeline">
              {STAGES.map((s, i) => (
                <li key={s.id} className={i < idx ? "done" : i === idx ? "now" : ""}>
                  <b>{s[lang]}</b>
                  {when(s.id) && <small>{fmt(when(s.id)!, lang)}</small>}
                  {o.events.filter((e) => e.status === s.id && e.note).map((e, k) => <p key={k}>{e.note}</p>)}
                </li>
              ))}
            </ol>
          )}

          {o.quote && (
            <div className="quote">
              <h3>{T.quote}</h3>
              <dl>
                <div><dt>{T.total}</dt><dd className="num"><bdi>{qar(o.quote.total, lang)}</bdi></dd></div>
                <div><dt>{T.advance}</dt><dd className="num"><bdi>{qar(o.quote.advance, lang)}</bdi></dd></div>
                {o.quote.ready_by && <div><dt>{T.readyBy}</dt><dd>{fmt(o.quote.ready_by, lang)}</dd></div>}
              </dl>
              {o.quote.note && <p>{o.quote.note}</p>}
            </div>
          )}

          {o.approvalImages.length > 0 && (
            <div className="approval">
              <h3>{T.approveTitle}</h3>
              <div className="approval-imgs">{o.approvalImages.map((src) => <a key={src} href={src} target="_blank" rel="noopener"><img src={src} alt="" /></a>)}</div>
              {o.approvedAt ? <p className="ok">{T.approved}</p> : o.status === "design_approval" && (
                <>
                  <p>{T.approveText}</p>
                  <div className="row-btns">
                    <button className="btn gold" type="button" onClick={approve} disabled={pending}>{T.approve}</button>
                    <a className="btn line" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`${o.ref}: ${T.change}`)}`} target="_blank" rel="noopener">{T.change}</a>
                  </div>
                </>
              )}
            </div>
          )}
          <p className="muted small">{T.updated}: {fmt(o.updatedAt, lang)}</p>
        </section>
      )}
    </div>
  );
}
