"use client";
import { useEffect, useState } from "react";
import RatesEditor from "@/components/admin/RatesEditor";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshShop } from "@/lib/admin";
import type { Category } from "@/lib/types";

type S = { phone: string; whatsapp: string; email: string; address_en: string; address_ar: string; hours_en: string; hours_ar: string; advance_pct: number; production_min_days: number; production_max_days: number };
const KEYS = "phone,whatsapp,email,address_en,address_ar,hours_en,hours_ar,advance_pct,production_min_days,production_max_days";

export default function SettingsPage() {
  const [s, setS] = useState<S | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  useEffect(() => {
    const db = supabaseBrowser();
    db.from("kraft_settings").select(KEYS).eq("id", 1).maybeSingle().then(({ data }) => data && setS(data as unknown as S));
    db.from("kraft_categories").select("*").order("sort_order").then(({ data }) => setCats((data as Category[]) ?? []));
  }, []);
  if (!s) return <p>Loading…</p>;
  const f = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsapp = s.whatsapp.replace(/\D/g, "");
    if (whatsapp.length < 10) { setMsg({ t: "err", m: "Enter the WhatsApp number with country code, e.g. 97450683627." }); return; }
    const row = { ...s, whatsapp, advance_pct: Math.min(100, Math.max(0, Number(s.advance_pct) || 0)), production_min_days: Number(s.production_min_days) || 14, production_max_days: Math.max(Number(s.production_min_days) || 14, Number(s.production_max_days) || 28) };
    const { error } = await supabaseBrowser().from("kraft_settings").update(row).eq("id", 1);
    if (!error) await refreshShop();
    setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: "Settings saved." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saveCat = async (c: Category) => {
    const { error } = await supabaseBrowser().from("kraft_categories").update({ name_en: c.name_en, name_ar: c.name_ar, sort_order: c.sort_order }).eq("slug", c.slug);
    if (!error) await refreshShop();
    setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: `Category “${c.name_en}” saved.` });
  };

  return (
    <>
      <h1>Gold rates &amp; settings</h1>
      <p className="sub">Update the gold rate each morning. Contact details appear in the footer, contact page and WhatsApp buttons.</p>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}
      <div style={{ display: "grid", gap: 16 }}>
        <RatesEditor />
        <form className="panel" onSubmit={save}>
          <h2>Orders</h2>
          <div className="form-3">
            <div className="field"><label htmlFor="ap">Advance (% of quote)</label><input id="ap" inputMode="numeric" value={s.advance_pct} onChange={f("advance_pct")} /></div>
            <div className="field"><label htmlFor="p1">Making time, from (days)</label><input id="p1" inputMode="numeric" value={s.production_min_days} onChange={f("production_min_days")} /></div>
            <div className="field"><label htmlFor="p2">Making time, up to (days)</label><input id="p2" inputMode="numeric" value={s.production_max_days} onChange={f("production_max_days")} /></div>
          </div>
          <h2 style={{ marginTop: 18 }}>Contact details</h2>
          <div className="form">
            <div className="field"><label htmlFor="ph">Phone (as shown)</label><input id="ph" value={s.phone} onChange={f("phone")} /></div>
            <div className="field"><label htmlFor="wa">WhatsApp <span className="hint">country code + number, digits only</span></label><input id="wa" value={s.whatsapp} onChange={f("whatsapp")} /></div>
            <div className="field full"><label htmlFor="em">Email</label><input id="em" value={s.email} onChange={f("email")} /></div>
            <div className="field"><label htmlFor="ae">Address (English)</label><input id="ae" value={s.address_en} onChange={f("address_en")} /></div>
            <div className="field"><label htmlFor="aa">Address (Arabic)</label><input id="aa" dir="rtl" value={s.address_ar} onChange={f("address_ar")} /></div>
            <div className="field"><label htmlFor="he">Opening hours (English)</label><input id="he" value={s.hours_en} onChange={f("hours_en")} /></div>
            <div className="field"><label htmlFor="ha">Opening hours (Arabic)</label><input id="ha" dir="rtl" value={s.hours_ar} onChange={f("hours_ar")} /></div>
          </div>
          <button className="btn p" style={{ marginTop: 14 }} type="submit">Save settings</button>
        </form>
        <section className="panel">
          <h2>Categories</h2>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>English</th><th>Arabic</th><th>Order</th><th></th></tr></thead>
            <tbody>{cats.map((c, i) => (
              <tr key={c.slug}>
                <td><input aria-label="English name" value={c.name_en} onChange={(e) => setCats(cats.map((x, k) => (k === i ? { ...x, name_en: e.target.value } : x)))} /></td>
                <td><input aria-label="Arabic name" dir="rtl" value={c.name_ar} onChange={(e) => setCats(cats.map((x, k) => (k === i ? { ...x, name_ar: e.target.value } : x)))} /></td>
                <td><input aria-label="Order" style={{ width: 60 }} inputMode="numeric" value={c.sort_order} onChange={(e) => setCats(cats.map((x, k) => (k === i ? { ...x, sort_order: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))} /></td>
                <td><button className="btn o sm" type="button" onClick={() => saveCat(c)}>Save</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </section>
      </div>
    </>
  );
}
