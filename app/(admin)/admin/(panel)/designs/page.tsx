"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { artSvg, CATEGORY_ART } from "@/lib/art";
import type { Category, Design } from "@/lib/types";

export default function DesignsAdmin() {
  const router = useRouter();
  const [rows, setRows] = useState<Design[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const db = supabaseBrowser();
    db.from("kraft_designs").select("*").order("sort_order").order("created_at", { ascending: false }).then(({ data }) => setRows((data as Design[]) ?? []));
    db.from("kraft_categories").select("*").order("sort_order").then(({ data }) => setCats((data as Category[]) ?? []));
  }, []);
  const list = rows.filter((d) => (!cat || d.category === cat) && (!q || `${d.name_en} ${d.name_ar}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <>
      <h1>Designs</h1>
      <p className="sub">The designs customers can customise. Prices on the website come from today&apos;s gold rate, the weight range and the making charge.</p>
      <div className="bar">
        <input className="grow" placeholder="Search designs" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search designs" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name_en}</option>)}</select>
        <Link className="btn p" href="/admin/designs/new">+ Add design</Link>
      </div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th></th><th>Design</th><th>Category</th><th>Weight</th><th>Making /g</th><th>Shown</th></tr></thead>
        <tbody>
          {list.map((d) => (
            <tr key={d.id} className="click" onClick={() => router.push(`/admin/designs/${d.id}`)}>
              <td><span className="th-img">{d.images?.[0] ? <img src={d.images[0]} alt="" /> : <span style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: artSvg(CATEGORY_ART[d.category] ?? "pendants", "yellow", "none", d.art_variant ?? 0) }} />}</span></td>
              <td><b>{d.name_en}</b><br /><small dir="rtl" style={{ color: "var(--muted)" }}>{d.name_ar}</small></td>
              <td>{cats.find((c) => c.slug === d.category)?.name_en ?? d.category}</td>
              <td className="num">{d.weight_min}–{d.weight_max} g</td>
              <td className="num">{d.making_per_g}</td>
              <td>{d.is_active ? <span className="pill ok">Live</span> : <span className="pill off">Hidden</span>}{d.is_featured && <> <span className="pill">Popular</span></>}</td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>No designs yet.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
