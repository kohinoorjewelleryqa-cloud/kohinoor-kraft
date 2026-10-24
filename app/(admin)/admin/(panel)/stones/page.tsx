"use client";
import { useEffect, useState } from "react";
import Gem from "@/components/Gem";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshShop } from "@/lib/admin";
import type { StoneKind, StoneType } from "@/lib/stones";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40);
const KINDS: [StoneKind, string][] = [["gem", "Coloured gem (ruby, emerald…)"], ["brilliant", "Sparkling clear (diamond, zircon)"], ["pearl", "Pearl (round, soft shine)"]];
const BLANK = { name_en: "", name_ar: "", color: "#C21E56", kind: "gem" as StoneKind };

export default function StonesAdmin() {
  const [rows, setRows] = useState<StoneType[]>([]);
  const [missing, setMissing] = useState(false);
  const [add, setAdd] = useState(BLANK);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => supabaseBrowser().from("kraft_stones").select("*").order("sort_order").order("name_en").then(({ data, error }) => {
    if (error) { setMissing(true); return; }
    setRows((data as StoneType[]) ?? []);
  });
  useEffect(() => { load(); }, []);
  const upd = (i: number, patch: Partial<StoneType>) => setRows(rows.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const save = async (s: StoneType) => {
    if (!s.name_en.trim()) { setMsg({ t: "err", m: "Enter the stone's English name." }); return; }
    const { error } = await supabaseBrowser().from("kraft_stones").update({ name_en: s.name_en.trim(), name_ar: s.name_ar.trim(), color: s.color, kind: s.kind, about_en: s.about_en, about_ar: s.about_ar, sort_order: s.sort_order, is_active: s.is_active }).eq("id", s.id);
    if (!error) await refreshShop();
    setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: `“${s.name_en}” saved. The website shows it now.` });
  };
  const del = async (s: StoneType) => {
    if (!confirm(`Delete “${s.name_en}”? Designs keep their own stone options; it just disappears from “Shop by stone”, the filters and “Create your own”. To hide it for now, untick “Shown” instead.`)) return;
    const { error } = await supabaseBrowser().from("kraft_stones").delete().eq("id", s.id);
    if (!error) { await refreshShop(); await load(); }
    setMsg(error ? { t: "err", m: error.message } : { t: "ok", m: `“${s.name_en}” deleted.` });
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = add.name_en.trim();
    if (!name) { setMsg({ t: "err", m: "Enter the stone's English name." }); return; }
    let id = slugify(name) || `stone-${Date.now()}`;
    if (rows.some((r) => r.id === id)) id = `${id}-${rows.length + 1}`;
    setBusy(true);
    const { error } = await supabaseBrowser().from("kraft_stones").insert({ id, name_en: name, name_ar: add.name_ar.trim(), color: add.color, kind: add.kind, sort_order: (rows.at(-1)?.sort_order ?? 0) + 1 });
    setBusy(false);
    if (error) { setMsg({ t: "err", m: error.message }); return; }
    await refreshShop(); await load(); setAdd(BLANK);
    setMsg({ t: "ok", m: `“${name}” added. Now choose it in a design's stone options (Designs → a design → Stone options).` });
  };

  if (missing) return (
    <>
      <h1>Stones</h1>
      <div className="notice err">The stones list isn&apos;t set up yet. In Supabase, open <b>SQL Editor</b>, paste the file <code>supabase/kraft-stones.sql</code> and press <b>Run</b>, then reload this page. Until then the website uses the standard stones.</div>
    </>
  );

  return (
    <>
      <h1>Stones</h1>
      <p className="sub">The stone types customers can choose. They appear in “Shop by stone”, the stone filters, “Create your own” and the 3D ring. To offer a stone on a design and set its price, open the design and add it under <b>Stone options</b>.</p>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}

      <form className="panel" onSubmit={create} style={{ marginBottom: 16 }}>
        <h2>Add a stone</h2>
        <div className="stone-new">
          <span className="sw-prev"><Gem t={{ id: "new", name_en: add.name_en, name_ar: add.name_ar, color: add.color, kind: add.kind, about_en: "", about_ar: "", sort_order: 0, is_active: true }} /></span>
          <div className="field"><label htmlFor="nn">Name (English)</label><input id="nn" value={add.name_en} onChange={(e) => setAdd({ ...add, name_en: e.target.value })} placeholder="e.g. Pink sapphire" /></div>
          <div className="field"><label htmlFor="na">Name (Arabic)</label><input id="na" dir="rtl" value={add.name_ar} onChange={(e) => setAdd({ ...add, name_ar: e.target.value })} placeholder="مثال: ياقوت وردي" /></div>
          <div className="field"><label htmlFor="nc">Colour</label><input id="nc" type="color" value={add.color} onChange={(e) => setAdd({ ...add, color: e.target.value })} /></div>
          <div className="field"><label htmlFor="nk">Looks like</label><select id="nk" value={add.kind} onChange={(e) => setAdd({ ...add, kind: e.target.value as StoneKind })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <button className="btn p" type="submit" disabled={busy}>{busy ? "Adding…" : "Add stone"}</button>
        </div>
      </form>

      <div className="stone-list">
        {rows.map((s, i) => (
          <section key={s.id} className="panel stone-card">
            <div className="sc-top">
              <span className="sw-prev"><Gem t={s} /></span>
              <div className="field"><label>Name (English)</label><input value={s.name_en} onChange={(e) => upd(i, { name_en: e.target.value })} /></div>
              <div className="field"><label>Name (Arabic)</label><input dir="rtl" value={s.name_ar} onChange={(e) => upd(i, { name_ar: e.target.value })} /></div>
              <div className="field"><label>Colour</label><input type="color" value={s.color} onChange={(e) => upd(i, { color: e.target.value })} /></div>
              <div className="field"><label>Looks like</label><select value={s.kind} onChange={(e) => upd(i, { kind: e.target.value as StoneKind })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            </div>
            <div className="sc-about">
              <div className="field"><label>Short description (English) <span className="hint">shown on the “Shop by stone” tile</span></label><input value={s.about_en} onChange={(e) => upd(i, { about_en: e.target.value })} /></div>
              <div className="field"><label>Short description (Arabic)</label><input dir="rtl" value={s.about_ar} onChange={(e) => upd(i, { about_ar: e.target.value })} /></div>
            </div>
            <div className="sc-bot">
              <div className="field" style={{ maxWidth: 90 }}><label>Order</label><input inputMode="numeric" value={s.sort_order} onChange={(e) => upd(i, { sort_order: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></div>
              <label className="sc-check"><input type="checkbox" checked={s.is_active} onChange={(e) => upd(i, { is_active: e.target.checked })} /> Shown on the website</label>
              <span className="sc-id">ID: <code>{s.id}</code></span>
              <button className="btn o sm" type="button" onClick={() => del(s)}>Delete</button>
              <button className="btn p sm" type="button" onClick={() => save(s)}>Save</button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
