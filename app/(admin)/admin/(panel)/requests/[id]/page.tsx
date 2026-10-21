"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fmtDate } from "@/lib/admin";
import { COLORS, DEFAULT_RATES, KARATS, STAGES, qar, stageLabel } from "@/lib/gold";
import { signedUrls, uploadPrivate, waNumber } from "@/lib/upload";
import type { Enquiry } from "@/lib/admin-types";
import type { QuoteDetails } from "@/lib/types";

type Ev = { id: number; status: string; note: string | null; created_at: string };
const r10 = (n: number) => Math.round(n / 10) * 10;

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [e, setE] = useState<Enquiry | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<{ rates: Record<string, number>; advance_pct: number; production_max_days: number }>({ rates: DEFAULT_RATES, advance_pct: 30, production_max_days: 28 });
  const [making, setMaking] = useState(50);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [{ data }, { data: ev }, { data: s }] = await Promise.all([
      db.from("kraft_enquiries").select("*").eq("id", id).maybeSingle(),
      db.from("kraft_events").select("*").eq("enquiry_id", id).order("created_at"),
      db.from("kraft_settings").select("rates,advance_pct,production_max_days").eq("id", 1).maybeSingle(),
    ]);
    const en = data as Enquiry | null;
    setE(en); setEvents((ev as Ev[]) ?? []);
    if (s) setSettings({ rates: { ...DEFAULT_RATES, ...(s.rates ?? {}) }, advance_pct: s.advance_pct ?? 30, production_max_days: s.production_max_days ?? 28 });
    if (en?.design_id) { const { data: d } = await db.from("kraft_designs").select("making_per_g").eq("id", en.design_id).maybeSingle(); if (d) setMaking(Number(d.making_per_g)); }
    if (en) setUrls(await signedUrls([...(en.reference_images ?? []), ...(en.approval_images ?? [])]));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const flash = (t: "ok" | "err", m: string) => { setMsg({ t, m }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /** Updates the request and adds a step to the customer's timeline. */
  const setStatus = async (status: string, note: string | null, extra: Record<string, unknown> = {}) => {
    if (!e) return false;
    setBusy(true);
    const db = supabaseBrowser();
    const { error } = await db.from("kraft_enquiries").update({ status, ...extra }).eq("id", e.id);
    if (!error && (status !== e.status || note)) await db.from("kraft_events").insert({ enquiry_id: e.id, status, note: note || null });
    setBusy(false);
    if (error) { flash("err", error.message); return false; }
    await load();
    return true;
  };

  if (!e) return <p>Loading…</p>;
  const lang = e.lang === "ar" ? "ar" : "en";
  const trackUrl = typeof window !== "undefined" ? `${window.location.origin}/${lang}/track?ref=${e.ref}` : "";
  const wa = (text: string) => `https://wa.me/${waNumber(e.phone)}?text=${encodeURIComponent(text)}`;
  const color = COLORS.find((c) => c.id === e.color)?.en ?? e.color;
  const karat = KARATS.find((k) => k.id === e.karat)?.en ?? e.karat;

  return (
    <>
      <p style={{ margin: "0 0 8px" }}><Link href="/admin/requests" style={{ color: "var(--muted)" }}>← All requests</Link></p>
      <h1 className="num">{e.ref}</h1>
      <p className="sub"><span className={`pill${e.status === "new" ? " new" : ""}`}>{stageLabel(e.status, "en")}</span> &nbsp;Received {fmtDate(e.created_at)} · Customer language: {lang === "ar" ? "Arabic" : "English"}</p>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}

      <div className="two-col">
        <div style={{ display: "grid", gap: 16 }}>
          <section className="panel">
            <h2>Customer</h2>
            <dl className="kv">
              <dt>Name</dt><dd>{e.customer_name}</dd>
              <dt>Mobile</dt><dd className="num">{e.phone}</dd>
              {e.email && <><dt>Email</dt><dd>{e.email}</dd></>}
            </dl>
            <p style={{ margin: "12px 0 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a className="btn wa sm" href={wa(lang === "ar" ? `مرحبًا ${e.customer_name}، شكرًا لطلبك ${e.ref} من كوهينور كرافت للمجوهرات.` : `Hello ${e.customer_name}, thank you for your Kohinoor Kraft request ${e.ref}.`)} target="_blank" rel="noopener">WhatsApp customer</a>
              <a className="btn o sm" href={`tel:${e.phone}`}>Call</a>
            </p>
          </section>

          <section className="panel">
            <h2>What they asked for</h2>
            <dl className="kv">
              <dt>Design</dt><dd>{e.design_name}</dd>
              <dt>Gold</dt><dd>{[karat, color].filter(Boolean).join(" · ")}</dd>
              {e.size && <><dt>Size</dt><dd>{e.size}</dd></>}
              {e.weight_est && <><dt>Weight</dt><dd>about {Number(e.weight_est)} g</dd></>}
              {e.stone && <><dt>Stones</dt><dd>{e.stone}</dd></>}
              {e.engraving_text && <><dt>Name / text</dt><dd><span dir="auto" style={{ fontSize: 18 }}>{e.engraving_text}</span>{e.engraving_font && <small style={{ color: "var(--muted)" }}> · style: {e.engraving_font}</small>}</dd></>}
              {e.estimate_lo && <><dt>Website estimate</dt><dd className="num">{qar(e.estimate_lo)}{e.estimate_hi && e.estimate_hi !== e.estimate_lo ? ` – ${qar(e.estimate_hi)}` : ""}{e.rate_at_request ? ` (rate ${e.rate_at_request}/g)` : ""}</dd></>}
            </dl>
            {e.notes && <p style={{ whiteSpace: "pre-wrap", background: "var(--bg)", borderRadius: 8, padding: "10px 12px", fontSize: 14 }} dir="auto">{e.notes}</p>}
            {e.reference_images.length > 0 && (
              <>
                <h2 style={{ marginTop: 14 }}>Reference photos</h2>
                <div className="imgs">{e.reference_images.map((p) => <a key={p} className="im" href={urls[p]} target="_blank" rel="noopener">{urls[p] && <img src={urls[p]} alt="" />}</a>)}</div>
              </>
            )}
          </section>

          <InternalNotes e={e} onSaved={load} />
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <QuoteBuilder e={e} settings={settings} making={making} busy={busy} lang={lang} trackUrl={trackUrl} wa={wa}
            onSave={async (q) => { const ok = await setStatus(e.status === "new" ? "quoted" : e.status, e.status === "new" ? null : null, { quote: q, quoted_at: new Date().toISOString() }); if (ok) flash("ok", "Quote saved. The customer can see it on the tracking page. Send it on WhatsApp too."); }} />

          <Progress e={e} busy={busy} onSet={async (s, note) => { if (await setStatus(s, note)) flash("ok", `Status changed to “${stageLabel(s, "en")}”. The customer sees it on the tracking page.`); }} wa={wa} trackUrl={trackUrl} lang={lang} />

          <Approval e={e} urls={urls} busy={busy} lang={lang} trackUrl={trackUrl} wa={wa}
            onUploaded={async (paths) => { if (await setStatus("design_approval", null, { approval_images: [...e.approval_images, ...paths], approved_at: null })) flash("ok", "Drawings uploaded. Ask the customer to approve them on the tracking page."); }}
            onRemove={async (p) => { await supabaseBrowser().from("kraft_enquiries").update({ approval_images: e.approval_images.filter((x) => x !== p) }).eq("id", e.id); await load(); }} />

          <section className="panel">
            <h2>Timeline (what the customer sees)</h2>
            <ol style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 6, fontSize: 14 }}>
              {events.map((ev) => <li key={ev.id}><b>{stageLabel(ev.status, "en")}</b> · {fmtDate(ev.created_at)}{ev.note && <><br /><span dir="auto" style={{ color: "var(--muted)" }}>{ev.note}</span></>}</li>)}
            </ol>
            {e.approved_at && <p className="ok" style={{ marginBottom: 0 }}>Customer approved the design on {fmtDate(e.approved_at)}.</p>}
          </section>
        </div>
      </div>
    </>
  );
}

function QuoteBuilder({ e, settings, making, busy, lang, trackUrl, wa, onSave }: {
  e: Enquiry; settings: { rates: Record<string, number>; advance_pct: number; production_max_days: number }; making: number; busy: boolean; lang: "en" | "ar"; trackUrl: string;
  wa: (t: string) => string; onSave: (q: QuoteDetails) => void;
}) {
  const q0 = e.quote;
  const defDate = new Date(Date.now() + settings.production_max_days * 864e5).toISOString().slice(0, 10);
  const [karat, setKarat] = useState(q0?.karat ?? e.karat ?? "22");
  const [weight, setWeight] = useState(String(q0?.weight ?? e.weight_est ?? ""));
  const [rate, setRate] = useState(String(q0?.rate ?? settings.rates[karat] ?? ""));
  const [mk, setMk] = useState(String(q0?.making_per_g ?? making));
  const [stones, setStones] = useState(String(q0?.stones ?? 0));
  const [discount, setDiscount] = useState(String(q0?.discount ?? 0));
  const [advPct, setAdvPct] = useState(String(q0?.advance_pct ?? settings.advance_pct));
  const [readyBy, setReadyBy] = useState(q0?.ready_by ?? defDate);
  const [note, setNote] = useState(q0?.note ?? "");
  useEffect(() => { if (!q0) setRate(String(settings.rates[karat] ?? "")); }, [karat, settings.rates, q0]);
  useEffect(() => { if (!q0) setMk(String(making)); }, [making, q0]);
  const n = (s: string) => Number(s) || 0;
  const total = useMemo(() => Math.max(0, r10(n(weight) * (n(rate) + n(mk)) + n(stones) - n(discount))), [weight, rate, mk, stones, discount]);
  const advance = r10((total * n(advPct)) / 100);
  const quote: QuoteDetails = { karat, weight: n(weight), rate: n(rate), making_per_g: n(mk), stones: n(stones), discount: n(discount), total, advance_pct: n(advPct), advance, ready_by: readyBy || null, note: note.trim() };
  const k = KARATS.find((x) => x.id === karat);
  const msg = lang === "ar"
    ? `مرحبًا ${e.customer_name}، عرض السعر لطلبك ${e.ref}:\n${e.design_name} – ${k?.ar} – ${n(weight)} غ\nالإجمالي: ${qar(total, "ar")}\nالدفعة المقدمة للتأكيد: ${qar(advance, "ar")}\n${readyBy ? `جاهز بتاريخ: ${new Date(readyBy).toLocaleDateString("ar-QA", { day: "numeric", month: "long" })}\n` : ""}${note ? note + "\n" : ""}تابع طلبك: ${trackUrl}`
    : `Hello ${e.customer_name}, here is the quote for your request ${e.ref}:\n${e.design_name} – ${k?.en} – ${n(weight)} g\nTotal: ${qar(total)}\nAdvance to confirm: ${qar(advance)}\n${readyBy ? `Ready by: ${new Date(readyBy).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}\n` : ""}${note ? note + "\n" : ""}Track your order: ${trackUrl}`;
  return (
    <section className="panel">
      <h2>Quote</h2>
      <div className="form">
        <div className="field"><label htmlFor="qk">Karat</label><select id="qk" value={karat} onChange={(ev) => setKarat(ev.target.value)}>{KARATS.map((x) => <option key={x.id} value={x.id}>{x.en}</option>)}</select></div>
        <div className="field"><label htmlFor="qw">Weight (g)</label><input id="qw" inputMode="decimal" value={weight} onChange={(ev) => setWeight(ev.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="field"><label htmlFor="qr">Gold rate (QAR/g) <span className="hint">today&apos;s, editable</span></label><input id="qr" inputMode="decimal" value={rate} onChange={(ev) => setRate(ev.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="field"><label htmlFor="qm">Making charge (QAR/g)</label><input id="qm" inputMode="decimal" value={mk} onChange={(ev) => setMk(ev.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="field"><label htmlFor="qs">Stones (QAR)</label><input id="qs" inputMode="decimal" value={stones} onChange={(ev) => setStones(ev.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="field"><label htmlFor="qd">Discount (QAR)</label><input id="qd" inputMode="decimal" value={discount} onChange={(ev) => setDiscount(ev.target.value.replace(/[^\d.]/g, ""))} /></div>
        <div className="field"><label htmlFor="qa">Advance (%)</label><input id="qa" inputMode="numeric" value={advPct} onChange={(ev) => setAdvPct(ev.target.value.replace(/\D/g, ""))} /></div>
        <div className="field"><label htmlFor="qy">Ready by</label><input id="qy" type="date" value={readyBy} onChange={(ev) => setReadyBy(ev.target.value)} /></div>
        <div className="field full"><label htmlFor="qn">Note for the customer <span className="hint">optional, in {lang === "ar" ? "Arabic" : "English"}</span></label><textarea id="qn" value={note} onChange={(ev) => setNote(ev.target.value)} dir="auto" /></div>
      </div>
      <p style={{ margin: "14px 0 4px" }}>Total <span className="qtotal num">{qar(total)}</span> &nbsp;·&nbsp; Advance <b className="num">{qar(advance)}</b></p>
      <p className="sub" style={{ margin: "0 0 12px" }}>Weight × (gold rate + making) + stones − discount, rounded to 10.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn p" type="button" disabled={busy || !(quote.weight > 0) || !(quote.rate > 0)} onClick={() => onSave(quote)}>{e.quote ? "Update quote" : "Save quote"}</button>
        {e.quote && <a className="btn wa" href={wa(msg)} target="_blank" rel="noopener">Send quote on WhatsApp</a>}
      </div>
    </section>
  );
}

function Progress({ e, busy, onSet, wa, trackUrl, lang }: { e: Enquiry; busy: boolean; onSet: (s: string, note: string) => void; wa: (t: string) => string; trackUrl: string; lang: "en" | "ar" }) {
  const [status, setStatus] = useState(e.status);
  const [note, setNote] = useState("");
  useEffect(() => setStatus(e.status), [e.status]);
  const nextIdx = STAGES.findIndex((s) => s.id === e.status) + 1;
  const next = STAGES[nextIdx];
  const readyMsg = lang === "ar" ? `مرحبًا ${e.customer_name}، قطعتك (${e.ref}) جاهزة! يسعدنا استقبالك في المعرض. ${trackUrl}` : `Hello ${e.customer_name}, your piece (${e.ref}) is ready! We look forward to seeing you at the showroom. ${trackUrl}`;
  return (
    <section className="panel">
      <h2>Progress</h2>
      {next && e.status !== "cancelled" && (
        <p style={{ margin: "0 0 12px" }}><button className="btn p sm" type="button" disabled={busy} onClick={() => onSet(next.id, "")}>Move to: {next.en}</button></p>
      )}
      <div className="form">
        <div className="field"><label htmlFor="st">Status</label><select id="st" value={status} onChange={(ev) => setStatus(ev.target.value)}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.en}</option>)}<option value="cancelled">Cancelled</option></select></div>
        <div className="field"><label htmlFor="sn">Note for the customer <span className="hint">optional</span></label><input id="sn" value={note} onChange={(ev) => setNote(ev.target.value)} dir="auto" /></div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn o sm" type="button" disabled={busy || (status === e.status && !note.trim())} onClick={() => { onSet(status, note.trim()); setNote(""); }}>Save status</button>
        {e.status === "ready" && <a className="btn wa sm" href={wa(readyMsg)} target="_blank" rel="noopener">Tell customer it&apos;s ready</a>}
      </div>
    </section>
  );
}

function Approval({ e, urls, busy, lang, trackUrl, wa, onUploaded, onRemove }: { e: Enquiry; urls: Record<string, string>; busy: boolean; lang: "en" | "ar"; trackUrl: string; wa: (t: string) => string; onUploaded: (p: string[]) => void; onRemove: (p: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setErr("");
    try {
      const paths = [];
      for (const f of Array.from(files).slice(0, 6)) paths.push(await uploadPrivate(f, `approvals/${e.id}`));
      onUploaded(paths);
    } catch (x) { setErr(x instanceof Error ? x.message : "Upload failed"); }
    setUploading(false);
  };
  const msg = lang === "ar" ? `مرحبًا ${e.customer_name}، تصميم طلبك ${e.ref} جاهز لموافقتك. يرجى مراجعته والموافقة عليه هنا: ${trackUrl}` : `Hello ${e.customer_name}, the design for your order ${e.ref} is ready. Please check and approve it here: ${trackUrl}`;
  return (
    <section className="panel">
      <h2>Design for approval</h2>
      <p className="sub" style={{ margin: "0 0 10px" }}>Upload the drawing or render. The customer sees it on the tracking page and taps “Approve”. Approving moves the order to “Being handcrafted”.</p>
      <div className="imgs">
        {e.approval_images.map((p) => <span key={p} className="im">{urls[p] && <img src={urls[p]} alt="" />}<button type="button" aria-label="Remove" onClick={() => onRemove(p)}>×</button></span>)}
        <label className="add">{uploading ? "Uploading…" : "+ Add drawing"}<input type="file" accept="image/*" multiple disabled={busy || uploading} onChange={(ev) => add(ev.target.files)} /></label>
      </div>
      {err && <p className="err" style={{ fontSize: 14 }}>{err}</p>}
      {e.approval_images.length > 0 && !e.approved_at && <p style={{ margin: "12px 0 0" }}><a className="btn wa sm" href={wa(msg)} target="_blank" rel="noopener">Ask customer to approve</a></p>}
    </section>
  );
}

function InternalNotes({ e, onSaved }: { e: Enquiry; onSaved: () => void }) {
  const [v, setV] = useState(e.admin_notes ?? "");
  const [saved, setSaved] = useState(false);
  return (
    <section className="panel">
      <h2>Internal notes <span className="hint" style={{ fontWeight: 400, color: "var(--muted)", fontSize: 13 }}>only staff see these</span></h2>
      <div className="field"><textarea aria-label="Internal notes" value={v} onChange={(ev) => { setV(ev.target.value); setSaved(false); }} placeholder="Workshop, gold used, payments received…" /></div>
      <button className="btn o sm" type="button" style={{ marginTop: 10 }} onClick={async () => { await supabaseBrowser().from("kraft_enquiries").update({ admin_notes: v }).eq("id", e.id); setSaved(true); onSaved(); }}>{saved ? "Saved" : "Save notes"}</button>
    </section>
  );
}
