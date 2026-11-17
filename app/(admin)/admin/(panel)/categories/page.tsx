"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { refreshShop } from "@/lib/admin";
import { mainCats, subCats } from "@/lib/cats";
import type { Category } from "@/lib/types";

/** Drawings used for a category or design that has no photo. */
const ART_TYPES: [string, string][] = [["rings", "Ring"], ["necklaces", "Necklace"], ["pendants", "Pendant"], ["chains", "Chain"], ["bangles", "Bangle"], ["bracelets", "Bracelet"], ["earrings", "Earrings"], ["sets", "Set"], ["anklets", "Anklet"], ["nosepins", "Nose pin"], ["coins", "Coin"], ["cufflinks", "Cufflinks"]];
const artType = (a: string) => (a || "pendants").split(":")[0];
const slugify = (x: string) => x.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const MAIN = "";

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [nc, setNc] = useState({ name_en: "", name_ar: "", art: "pendants", parent: MAIN });
  const [busy, setBusy] = useState(false);
  const addRef = useRef<HTMLFormElement>(null);

  const load = async () => {
    const db = supabaseBrowser();
    const [c, d] = await Promise.all([db.from("kraft_categories").select("*").order("sort_order"), db.from("kraft_designs").select("category")]);
    setCats((c.data as Category[]) ?? []);
    const n: Record<string, number> = {};
    for (const r of (d.data as { category: string }[]) ?? []) n[r.category] = (n[r.category] ?? 0) + 1;
    setCounts(n);
  };
  useEffect(() => { load(); }, []);
  if (!cats) return <p>Loading…</p>;

  // Before supabase/kraft-category-groups.sql is run there is no "parent" column.
  const ready = cats.length === 0 || "parent" in cats[0];
  const mains = mainCats(cats);
  const say = (t: "ok" | "err", m: string) => { setMsg({ t, m }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const upd = (slug: string, patch: Partial<Category>) => setCats(cats.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));
  const fail = (m: string) => (/parent/i.test(m) ? "The database needs a one-time update for subcategories. Run supabase/kraft-category-groups.sql in Supabase → SQL Editor, then try again." : m);

  const save = async (c: Category) => {
    if (!c.name_en.trim() || !c.name_ar.trim()) return say("err", "Enter the category name in English and Arabic.");
    const row: Record<string, unknown> = { name_en: c.name_en.trim(), name_ar: c.name_ar.trim(), sort_order: c.sort_order, art: c.art };
    if (ready) row.parent = c.parent || null;
    const { error } = await supabaseBrowser().from("kraft_categories").update(row).eq("slug", c.slug);
    if (!error) { await refreshShop(); await load(); }
    say(error ? "err" : "ok", error ? fail(error.message) : `“${c.name_en}” saved.`);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name_en = nc.name_en.trim(), name_ar = nc.name_ar.trim();
    if (!name_en || !name_ar) return say("err", "Enter the new category name in English and Arabic.");
    const siblings = nc.parent ? subCats(cats, nc.parent) : mains;
    if (siblings.some((c) => c.name_en.toLowerCase() === name_en.toLowerCase())) return say("err", `There is already a “${name_en}” here.`);
    const base = slugify(nc.parent ? `${nc.parent}-${name_en}` : name_en) || `category-${cats.length + 1}`;
    let slug = base;
    for (let n = 2; cats.some((c) => c.slug === slug); n++) slug = `${base}-${n}`;
    setBusy(true);
    const sort_order = Math.max(0, ...siblings.map((c) => c.sort_order)) + 1;
    const row: Record<string, unknown> = { slug, name_en, name_ar, art: `${nc.art}:0`, sort_order };
    if (nc.parent) row.parent = nc.parent;
    const { error } = await supabaseBrowser().from("kraft_categories").insert(row);
    if (!error) { await refreshShop(); await load(); setNc({ ...nc, name_en: "", name_ar: "" }); }
    setBusy(false);
    const under = nc.parent ? cats.find((c) => c.slug === nc.parent)?.name_en : "";
    say(error ? "err" : "ok", error ? fail(error.message) : `“${name_en}” added${under ? ` under ${under}` : " as a main category"}. You can now choose it when adding a design.`);
  };

  const remove = async (c: Category) => {
    const subs = subCats(cats, c.slug);
    if (subs.length) return say("err", `“${c.name_en}” has ${subs.length} subcategor${subs.length === 1 ? "y" : "ies"}. Delete or move them first.`);
    const db = supabaseBrowser();
    const { count } = await db.from("kraft_designs").select("id", { count: "exact", head: true }).eq("category", c.slug);
    if (count) return say("err", `“${c.name_en}” has ${count} design${count === 1 ? "" : "s"}. Move them to another category (Designs → open the design → Category), then delete it.`);
    if (!window.confirm(`Delete “${c.name_en}”?`)) return;
    const { error } = await db.from("kraft_categories").delete().eq("slug", c.slug);
    if (!error) { await refreshShop(); await load(); }
    say(error ? "err" : "ok", error ? fail(error.message) : `“${c.name_en}” deleted.`);
  };

  const addUnder = (parent: string) => {
    setNc({ ...nc, parent, name_en: "", name_ar: "" });
    addRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (document.getElementById("nce") as HTMLInputElement | null)?.focus({ preventScroll: true }), 350);
  };

  // A plain function (not a component) so inputs keep focus while typing.
  const row = (c: Category, sub: boolean) => {
    const hasSubs = subCats(cats, c.slug).length > 0;
    return (
      <tr key={c.slug} className={sub ? "cat-sub" : "cat-main"}>
        <td><input aria-label="English name" value={c.name_en} onChange={(e) => upd(c.slug, { name_en: e.target.value })} /></td>
        <td><input aria-label="Arabic name" dir="rtl" value={c.name_ar} onChange={(e) => upd(c.slug, { name_ar: e.target.value })} /></td>
        {ready && (
          <td>
            <select aria-label="Shown under" value={c.parent ?? MAIN} disabled={hasSubs} title={hasSubs ? "Has subcategories, so it stays a main category" : undefined} onChange={(e) => upd(c.slug, { parent: e.target.value || null })}>
              <option value={MAIN}>Main category</option>
              {mains.filter((m) => m.slug !== c.slug).map((m) => <option key={m.slug} value={m.slug}>Under {m.name_en}</option>)}
            </select>
          </td>
        )}
        <td><select aria-label="Drawing" value={artType(c.art)} onChange={(e) => upd(c.slug, { art: `${e.target.value}:${(c.art || "").split(":")[1] ?? 0}` })}>{ART_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
        <td><input aria-label="Order" style={{ width: 56 }} inputMode="numeric" value={c.sort_order} onChange={(e) => upd(c.slug, { sort_order: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></td>
        <td className="num-cell">{counts[c.slug] ?? 0}</td>
        <td style={{ whiteSpace: "nowrap" }}><button className="btn o sm" type="button" onClick={() => save(c)}>Save</button> <button className="btn o sm" type="button" onClick={() => remove(c)}>Delete</button></td>
      </tr>
    );
  };

  return (
    <>
      <h1>Categories</h1>
      <p className="sub">Main categories (Women, Men, Kids…) appear in the website menu. Subcategories appear under them. Lower “Order” numbers show first. The drawing is shown when a design has no photo yet.</p>
      {!ready && <div className="notice err">Subcategories need a one-time database update: run <b>supabase/kraft-category-groups.sql</b> in Supabase → SQL Editor, then reload this page.</div>}
      {msg && <div className={`notice ${msg.t}`}>{msg.m}</div>}
      <div style={{ display: "grid", gap: 16 }}>
        {mains.map((m) => {
          const subs = subCats(cats, m.slug);
          return (
            <section className="panel" key={m.slug}>
              <div className="cat-head">
                <h2>{m.name_en} <span className="hint">{m.name_ar}</span></h2>
                {ready && <button className="btn o sm" type="button" onClick={() => addUnder(m.slug)}>+ Add subcategory</button>}
              </div>
              <div className="tbl-wrap"><table className="tbl cat-tbl">
                <thead><tr><th>English</th><th>Arabic</th>{ready && <th>Shown</th>}<th>Drawing</th><th>Order</th><th>Designs</th><th></th></tr></thead>
                <tbody>
                  {row(m, false)}
                  {subs.map((c) => row(c, true))}
                </tbody>
              </table></div>
              {subs.length === 0 && <p className="hint" style={{ margin: "10px 2px 0" }}>No subcategories: designs go straight into {m.name_en}.</p>}
            </section>
          );
        })}
        <form className="panel" ref={addRef} onSubmit={add}>
          <h2>Add a category</h2>
          <div className="form-3">
            {ready && (
              <div className="field"><label htmlFor="ncp">Where</label>
                <select id="ncp" value={nc.parent} onChange={(e) => setNc({ ...nc, parent: e.target.value })}>
                  <option value={MAIN}>New main category (in the menu)</option>
                  {mains.map((m) => <option key={m.slug} value={m.slug}>Subcategory under {m.name_en}</option>)}
                </select>
              </div>
            )}
            <div className="field"><label htmlFor="nce">Name (English)</label><input id="nce" placeholder="e.g. Anklets" value={nc.name_en} onChange={(e) => setNc({ ...nc, name_en: e.target.value })} /></div>
            <div className="field"><label htmlFor="nca">Name (Arabic)</label><input id="nca" dir="rtl" placeholder="مثال: خلاخيل" value={nc.name_ar} onChange={(e) => setNc({ ...nc, name_ar: e.target.value })} /></div>
            <div className="field"><label htmlFor="ncd">Drawing</label><select id="ncd" value={nc.art} onChange={(e) => setNc({ ...nc, art: e.target.value })}>{ART_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <button className="btn p" style={{ marginTop: 14 }} type="submit" disabled={busy}>{busy ? "Adding…" : "Add category"}</button>
        </form>
      </div>
    </>
  );
}
