"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fmtDate, refreshShop } from "@/lib/admin";
import { DEFAULT_RATES, RATE_KEYS } from "@/lib/gold";

/** Today's gold rates (QAR per gram). Update each morning; all website prices follow them. */
export default function RatesEditor() {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [updated, setUpdated] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabaseBrowser().from("kraft_settings").select("rates,rates_updated_at").eq("id", 1).maybeSingle().then(({ data }) => {
      const r = { ...DEFAULT_RATES, ...(data?.rates ?? {}) };
      setRates(Object.fromEntries(RATE_KEYS.map((k) => [k, String(r[k] ?? "")])));
      setUpdated(data?.rates_updated_at ?? null);
    });
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, number> = {};
    for (const k of RATE_KEYS) { const v = Number(rates[k]); if (!(v > 0)) { setMsg({ t: "err", m: `Enter the ${k}K rate.` }); return; } out[k] = v; }
    if (!(out["24"] > out["22"] && out["22"] > out["21"] && out["21"] > out["18"])) { setMsg({ t: "err", m: "Check the rates: 24K should be highest, then 22K, 21K, 18K." }); return; }
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabaseBrowser().from("kraft_settings").update({ rates: out, rates_updated_at: now }).eq("id", 1);
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
      <p className="sub" style={{ margin: "10px 0" }}>{updated ? `Last updated ${fmtDate(updated)}` : "Not updated yet."} 24K is shown on the gold-rate page for reference.</p>
      <button className="btn p" type="submit" disabled={busy}>{busy ? "Saving…" : "Save rates"}</button>
    </form>
  );
}
