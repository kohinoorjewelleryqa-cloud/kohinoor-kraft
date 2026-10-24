"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fmtDate, refreshShop } from "@/lib/admin";
import { DEFAULT_RATES, RATE_KEYS, buyRates, makingTiers } from "@/lib/gold";

/** Today's gold rates (QAR per gram). Update each morning; all website prices follow them. */
export default function RatesEditor() {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [orig, setOrig] = useState<Record<string, number>>({});
  useEffect(() => {
    supabaseBrowser().from("kraft_settings").select("rates,rates_updated_at").eq("id", 1).maybeSingle().then(({ data }) => {
      const r = { ...DEFAULT_RATES, ...(data?.rates ?? {}) };
      const b = buyRates(r);
      const m = makingTiers(r);
      setOrig(r);
      setRates({ ...Object.fromEntries(RATE_KEYS.map((k) => [k, String(r[k] ?? "")])), ...Object.fromEntries(RATE_KEYS.map((k) => [`u${k}`, String(b[k])])), ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v)])) });
      setUpdated(data?.rates_updated_at ?? null);
    });
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, number> = {};
    for (const k of RATE_KEYS) { const v = Number(rates[k]); if (!(v > 0)) { setMsg({ t: "err", m: `Enter the ${k}K rate.` }); return; } out[k] = v; }
    if (!(out["24"] > out["22"] && out["22"] > out["21"] && out["21"] > out["18"])) { setMsg({ t: "err", m: "Check the rates: 24K should be highest, then 22K, 21K, 18K." }); return; }
    // Used-gold buying rates (stored with the selling rates as u24, u22, u21, u18).
    for (const k of RATE_KEYS) {
      const v = Number(rates[`u${k}`]);
      if (!(v > 0)) { setMsg({ t: "err", m: `Enter the used-gold buying rate for ${k}K.` }); return; }
      if (v > out[k]) { setMsg({ t: "err", m: `The ${k}K buying rate should not be higher than the ${k}K selling rate.` }); return; }
      out[`u${k}`] = v;
    }
    // Making charge by weight (customers never see it separately; all prices include it).
    const m = { mk1: Number(rates.mk1), mk2: Number(rates.mk2), mk3: Number(rates.mk3), mkw1: Number(rates.mkw1), mkw2: Number(rates.mkw2) };
    if (!(m.mk1 > 0 && m.mk2 > 0 && m.mk3 > 0)) { setMsg({ t: "err", m: "Enter all three making charges." }); return; }
    if (!(m.mkw1 > 0 && m.mkw2 > m.mkw1)) { setMsg({ t: "err", m: "Check the making-charge weights: the second step must be heavier than the first." }); return; }
    Object.assign(out, m);
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabaseBrowser().from("kraft_settings").update({ rates: { ...orig, ...out }, rates_updated_at: now }).eq("id", 1);
    if (!error) { await refreshShop(); setUpdated(now); }
    setBusy(false);
    setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: "Rates saved. The website shows them now." });
  };
  return (
    <form className="panel" onSubmit={save}>
      <h2>Today&apos;s gold rate (QAR per gram)</h2>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}
      <div className="rates4">
        {RATE_KEYS.map((k) => (
          <div className="field" key={k}><label htmlFor={`r${k}`}>{k}K</label><input id={`r${k}`} inputMode="decimal" value={rates[k] ?? ""} onChange={(e) => setRates({ ...rates, [k]: e.target.value.replace(/[^\d.]/g, "") })} /></div>
        ))}
      </div>
      <h2 style={{ marginTop: 18 }}>Used gold buying rates (QAR per gram)</h2>
      <p className="sub" style={{ margin: "0 0 8px" }}>What you pay customers for old gold. Shown on the Used gold page and its value calculator.</p>
      <div className="rates4">
        {RATE_KEYS.map((k) => (
          <div className="field" key={k}><label htmlFor={`u${k}`}>{k}K</label><input id={`u${k}`} inputMode="decimal" value={rates[`u${k}`] ?? ""} onChange={(e) => setRates({ ...rates, [`u${k}`]: e.target.value.replace(/[^\d.]/g, "") })} /></div>
        ))}
      </div>
      <h2 style={{ marginTop: 18 }}>Making charge by weight (QAR per gram)</h2>
      <p className="sub" style={{ margin: "0 0 8px" }}>Added automatically to every price on the website. Customers never see it separately. You can still change it in a quote for special work.</p>
      <div className="mk-tiers">
        <div className="mk-row"><span>Under</span><input aria-label="First weight step (g)" inputMode="decimal" value={rates.mkw1 ?? ""} onChange={(e) => setRates({ ...rates, mkw1: e.target.value.replace(/[^\d.]/g, "") })} /><span>g</span><b>→</b><input aria-label="Making charge for light pieces" inputMode="decimal" value={rates.mk1 ?? ""} onChange={(e) => setRates({ ...rates, mk1: e.target.value.replace(/[^\d.]/g, "") })} /><span>QAR/g</span></div>
        <div className="mk-row"><span>{rates.mkw1 || "…"} g to under</span><input aria-label="Second weight step (g)" inputMode="decimal" value={rates.mkw2 ?? ""} onChange={(e) => setRates({ ...rates, mkw2: e.target.value.replace(/[^\d.]/g, "") })} /><span>g</span><b>→</b><input aria-label="Making charge for medium pieces" inputMode="decimal" value={rates.mk2 ?? ""} onChange={(e) => setRates({ ...rates, mk2: e.target.value.replace(/[^\d.]/g, "") })} /><span>QAR/g</span></div>
        <div className="mk-row"><span>{rates.mkw2 || "…"} g and above</span><b>→</b><input aria-label="Making charge for heavier pieces" inputMode="decimal" value={rates.mk3 ?? ""} onChange={(e) => setRates({ ...rates, mk3: e.target.value.replace(/[^\d.]/g, "") })} /><span>QAR/g</span></div>
      </div>
      <p className="sub" style={{ margin: "10px 0" }}>{updated ? `Last updated ${fmtDate(updated)}` : "Not updated yet."} 24K is shown on the gold-rate page for reference.</p>
      <button className="btn p" type="submit" disabled={busy}>{busy ? "Saving…" : "Save rates"}</button>
    </form>
  );
}
