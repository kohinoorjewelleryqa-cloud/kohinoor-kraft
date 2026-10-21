"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshShop } from "@/lib/admin";
import { uploadPublic } from "@/lib/upload";
import { COLORS, DEFAULT_RATES, KARATS, estimate, qar } from "@/lib/gold";
import type { Category, Design, StoneOption } from "@/lib/types";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60);
const BLANK: Omit<Design, "id"> = {
  slug: "", category: "", name_en: "", name_ar: "", description_en: "", description_ar: "", images: [], karats: ["22", "21", "18"], colors: ["yellow", "rose", "white"],
  weight_min: 3, weight_max: 6, making_per_g: 50, stones: [], engraving: false, engraving_max: 12, sizes: [], is_featured: false, is_active: true, sort_order: 0, art_variant: 0,
};

export default function DesignEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const [d, setD] = useState<Omit<Design, "id">>(BLANK);
  const [cats, setCats] = useState<Category[]>([]);
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [sizesText, setSizesText] = useState("");
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("saved")) setMsg({ t: "ok", m: "Saved. The website shows the new design now." });
    const db = supabaseBrowser();
    db.from("kraft_categories").select("*").order("sort_order").then(({ data }) => { const c = (data as Category[]) ?? []; setCats(c); if (isNew && c[0]) setD((x) => ({ ...x, category: x.category || c[0].slug })); });
    db.from("kraft_settings").select("rates").eq("id", 1).maybeSingle().then(({ data }) => data?.rates && setRates({ ...DEFAULT_RATES, ...data.rates }));
    if (!isNew) db.from("kraft_designs").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const x = data as Design;
      setD({ ...x, weight_min: Number(x.weight_min), weight_max: Number(x.weight_max), making_per_g: Number(x.making_per_g), stones: x.stones ?? [], sizes: x.sizes ?? [] });
      setSizesText((x.sizes ?? []).join(", "));
    });
  }, [id, isNew]);

  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggle = (k: "karats" | "colors", v: string) => set(k, d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v]);
  const setStone = (i: number, patch: Partial<StoneOption>) => set("stones", d.stones.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setMsg(null);
    try {
      const urls = [];
      for (const f of Array.from(files).slice(0, 8)) urls.push(await uploadPublic(f, "designs"));
      set("images", [...d.images, ...urls]);
    } catch (x) { setMsg({ t: "err", m: x instanceof Error ? x.message : "Upload failed" }); }
    setUploading(false);
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!d.name_en.trim() || !d.name_ar.trim()) { setMsg({ t: "err", m: "Enter the name in English and Arabic." }); return; }
    if (!d.karats.length || !d.colors.length) { setMsg({ t: "err", m: "Choose at least one karat and one colour." }); return; }
    if (!(d.weight_min > 0) || d.weight_max < d.weight_min) { setMsg({ t: "err", m: "Check the weight range (minimum must be more than 0 and not above the maximum)." }); return; }
    setBusy(true); setMsg(null);
    const row = {
      ...d, slug: d.slug.trim() ? slugify(d.slug) : slugify(d.name_en), sizes: sizesText.split(",").map((s) => s.trim()).filter(Boolean),
      stones: d.stones.filter((s) => s.name_en.trim()).map((s) => ({ ...s, id: s.id || slugify(s.name_en), price: Number(s.price) || 0 })),
      description_en: d.description_en || null, description_ar: d.description_ar || null,
    };
    const db = supabaseBrowser();
    const res = isNew ? await db.from("kraft_designs").insert(row).select("id").single() : await db.from("kraft_designs").update(row).eq("id", id).select("id").single();
    setBusy(false);
    if (res.error) { setMsg({ t: "err", m: res.error.code === "23505" ? "Another design already uses this web address. Change the web address below." : res.error.message }); return; }
    await refreshShop();
    if (isNew) { router.replace(`/admin/designs/${res.data.id}?saved=1`); return; }
    setD((x) => ({ ...x, slug: row.slug }));
    setMsg({ t: "ok", m: "Saved. The website shows the change now." });
  };

  const remove = async () => {
    if (!confirm("Delete this design? Requests that used it keep their details.")) return;
    await supabaseBrowser().from("kraft_designs").delete().eq("id", id);
    await refreshShop();
    router.replace("/admin/designs");
  };

  const k = d.karats[0] ?? "22";
  const est = estimate({ rates, karat: k, weightMin: d.weight_min, weightMax: d.weight_max, makingPerG: d.making_per_g });

  return (
    <form onSubmit={save}>
      <p style={{ margin: "0 0 8px" }}><Link href="/admin/designs" style={{ color: "var(--muted)" }}>← All designs</Link></p>
      <h1>{isNew ? "New design" : d.name_en || "Design"}</h1>
      <p className="sub">{!isNew && d.slug && <a href={`/en/designs/${d.slug}`} target="_blank" rel="noopener">View on website ↗</a>}</p>
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}
      <div style={{ display: "grid", gap: 16 }}>
        <section className="panel">
          <h2>Name and description</h2>
          <div className="form">
            <div className="field"><label htmlFor="ne">Name (English)</label><input id="ne" value={d.name_en} onChange={(e) => set("name_en", e.target.value)} /></div>
            <div className="field"><label htmlFor="na">Name (Arabic)</label><input id="na" dir="rtl" value={d.name_ar} onChange={(e) => set("name_ar", e.target.value)} /></div>
            <div className="field"><label htmlFor="de">Description (English)</label><textarea id="de" value={d.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} /></div>
            <div className="field"><label htmlFor="da">Description (Arabic)</label><textarea id="da" dir="rtl" value={d.description_ar ?? ""} onChange={(e) => set("description_ar", e.target.value)} /></div>
            <div className="field"><label htmlFor="ca">Category</label><select id="ca" value={d.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select></div>
            <div className="field"><label htmlFor="sl">Web address <span className="hint">made from the English name if empty</span></label><input id="sl" value={d.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(d.name_en)} /></div>
          </div>
        </section>

        <section className="panel">
          <h2>Photos</h2>
          <p className="sub" style={{ margin: "0 0 10px" }}>Square photos look best. The first photo is the main one. Until you add photos, the website shows a gold drawing.</p>
          <div className="imgs">
            {d.images.map((src, i) => (
              <span key={src} className="im"><img src={src} alt="" /><button type="button" aria-label="Remove photo" onClick={() => set("images", d.images.filter((_, k2) => k2 !== i))}>×</button>
                {i > 0 && <button type="button" aria-label="Make main photo" title="Make main photo" style={{ left: 4, right: "auto" }} onClick={() => set("images", [src, ...d.images.filter((_, k2) => k2 !== i)])}>★</button>}
              </span>
            ))}
            <label className="add">{uploading ? "Uploading…" : "+ Add photos"}<input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => addImages(e.target.files)} /></label>
          </div>
        </section>

        <section className="panel">
          <h2>Gold, weight and price</h2>
          <div className="form">
            <div className="field full"><span>Karats offered</span><div className="checks">{KARATS.map((x) => <label key={x.id}><input type="checkbox" checked={d.karats.includes(x.id)} onChange={() => toggle("karats", x.id)} />{x.en}</label>)}</div></div>
            <div className="field full"><span>Colours offered <span className="hint">white gold is only possible in 18K</span></span><div className="checks">{COLORS.map((x) => <label key={x.id}><input type="checkbox" checked={d.colors.includes(x.id)} onChange={() => toggle("colors", x.id)} />{x.en}</label>)}</div></div>
            <div className="field"><label htmlFor="w1">Lightest weight (g)</label><input id="w1" inputMode="decimal" value={d.weight_min} onChange={(e) => set("weight_min", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></div>
            <div className="field"><label htmlFor="w2">Heaviest weight (g)</label><input id="w2" inputMode="decimal" value={d.weight_max} onChange={(e) => set("weight_max", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></div>
            <div className="field"><label htmlFor="mk">Making charge (QAR per gram)</label><input id="mk" inputMode="decimal" value={d.making_per_g} onChange={(e) => set("making_per_g", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></div>
            <div className="field"><label htmlFor="sz">Sizes <span className="hint">separated by commas; leave empty if none</span></label><input id="sz" value={sizesText} onChange={(e) => setSizesText(e.target.value)} placeholder={'e.g. 16", 18", 20" or 6, 7, 8'} /></div>
          </div>
          <p className="notice info" style={{ margin: "14px 0 0" }}>At today&apos;s {k}K rate, the website shows about <b className="num">{qar(est.lo)} – {qar(est.hi)}</b> (from <b className="num">{qar(est.lo)}</b> on the design card).</p>
        </section>

        <section className="panel">
          <h2>Name engraving</h2>
          <div className="checks" style={{ marginBottom: 10 }}><label><input type="checkbox" checked={d.engraving} onChange={(e) => set("engraving", e.target.checked)} />Customers can add a name or text</label></div>
          {d.engraving && <div className="field" style={{ maxWidth: 240 }}><label htmlFor="em">Maximum letters</label><input id="em" inputMode="numeric" value={d.engraving_max} onChange={(e) => set("engraving_max", Number(e.target.value.replace(/\D/g, "")) || 0)} /></div>}
        </section>

        <section className="panel">
          <h2>Stone options <span className="hint" style={{ fontWeight: 400, color: "var(--muted)", fontSize: 13 }}>leave empty for plain gold</span></h2>
          <div style={{ display: "grid", gap: 8 }}>
            {d.stones.map((s, i) => (
              <div key={i} className="stone-row">
                <input aria-label="Stone name (English)" placeholder="Name (English)" value={s.name_en} onChange={(e) => setStone(i, { name_en: e.target.value })} />
                <input aria-label="Stone name (Arabic)" placeholder="الاسم بالعربية" dir="rtl" value={s.name_ar} onChange={(e) => setStone(i, { name_ar: e.target.value })} />
                <input aria-label="Price (QAR)" placeholder="Price QAR" inputMode="decimal" value={s.price} onChange={(e) => setStone(i, { price: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })} />
                <button type="button" aria-label="Remove stone" onClick={() => set("stones", d.stones.filter((_, k2) => k2 !== i))}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn o sm" style={{ marginTop: 10 }} onClick={() => set("stones", [...d.stones, { id: "", name_en: "", name_ar: "", price: 0 }])}>+ Add stone option</button>
        </section>

        <section className="panel">
          <h2>Visibility</h2>
          <div className="checks">
            <label><input type="checkbox" checked={d.is_active} onChange={(e) => set("is_active", e.target.checked)} />Show on the website</label>
            <label><input type="checkbox" checked={d.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />Show in “Popular designs” on the home page</label>
          </div>
          <div className="field" style={{ maxWidth: 200, marginTop: 12 }}><label htmlFor="so">Order <span className="hint">lower shows first</span></label><input id="so" inputMode="numeric" value={d.sort_order} onChange={(e) => set("sort_order", Number(e.target.value.replace(/\D/g, "")) || 0)} /></div>
        </section>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn p" type="submit" disabled={busy || uploading}>{busy ? "Saving…" : "Save design"}</button>
          {!isNew && <button className="btn o" type="button" onClick={remove}>Delete design</button>}
        </div>
      </div>
    </form>
  );
}
