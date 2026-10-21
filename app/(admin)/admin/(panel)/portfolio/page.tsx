"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshShop } from "@/lib/admin";
import { uploadPublic } from "@/lib/upload";
import type { PortfolioItem } from "@/lib/types";

export default function PortfolioAdmin() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const load = () => supabaseBrowser().from("kraft_portfolio").select("*").order("sort_order").order("created_at", { ascending: false }).then(({ data }) => setItems((data as PortfolioItem[]) ?? []));
  useEffect(() => { load(); }, []);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setMsg(null);
    try {
      for (const f of Array.from(files).slice(0, 12)) {
        const image = await uploadPublic(f, "portfolio");
        const { error } = await supabaseBrowser().from("kraft_portfolio").insert({ image });
        if (error) throw error;
      }
      await refreshShop(); await load();
      setMsg({ t: "ok", m: "Photos added. Add a short title in English and Arabic if you like." });
    } catch (x) { setMsg({ t: "err", m: x instanceof Error ? x.message : "Upload failed" }); }
    setBusy(false);
  };
  const save = async (p: PortfolioItem) => { await supabaseBrowser().from("kraft_portfolio").update({ title_en: p.title_en, title_ar: p.title_ar, sort_order: p.sort_order }).eq("id", p.id); await refreshShop(); setMsg({ t: "ok", m: "Saved." }); };
  const del = async (p: PortfolioItem) => { if (!confirm("Remove this photo from the website?")) return; await supabaseBrowser().from("kraft_portfolio").delete().eq("id", p.id); await refreshShop(); await load(); };
  const upd = (i: number, patch: Partial<PortfolioItem>) => setItems(items.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  return (
    <>
      <h1>Our work</h1>
      <p className="sub">Photos of pieces you have made. They appear on the “Our work” page and the home page. Customers trust real work most.</p>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}
      <div className="imgs" style={{ marginBottom: 18 }}>
        <label className="add" style={{ width: 160, height: 120 }}>{busy ? "Uploading…" : "+ Add photos"}<input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => add(e.target.files)} /></label>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
        {items.map((p, i) => (
          <div key={p.id} className="panel" style={{ display: "grid", gap: 8 }}>
            <img src={p.image} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10 }} />
            <input aria-label="Title (English)" placeholder="Title (English)" value={p.title_en} onChange={(e) => upd(i, { title_en: e.target.value })} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
            <input aria-label="Title (Arabic)" placeholder="العنوان بالعربية" dir="rtl" value={p.title_ar} onChange={(e) => upd(i, { title_ar: e.target.value })} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px" }} />
            <div style={{ display: "flex", gap: 8 }}><button className="btn p sm" type="button" onClick={() => save(p)}>Save</button><button className="btn o sm" type="button" onClick={() => del(p)}>Remove</button></div>
          </div>
        ))}
      </div>
      {!items.length && <p className="sub">No photos yet.</p>}
    </>
  );
}
