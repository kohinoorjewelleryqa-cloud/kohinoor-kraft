"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fmtDate } from "@/lib/admin";
import { STAGES, qar, stageLabel } from "@/lib/gold";
import type { Enquiry } from "@/lib/admin-types";

const GROUP: Record<string, string[]> = { new: ["new"], quoted: ["quoted"], progress: ["advance_paid", "design_approval", "in_production", "finishing"], ready: ["ready"] };

function List() {
  const router = useRouter();
  const sp = useSearchParams();
  const [filter, setFilter] = useState(sp.get("group") ? `g:${sp.get("group")}` : "open");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabaseBrowser().from("kraft_enquiries").select("*").order("created_at", { ascending: false }).limit(300);
    if (filter === "open") query = query.not("status", "in", "(delivered,cancelled)");
    else if (filter.startsWith("g:")) query = query.in("status", GROUP[filter.slice(2)] ?? []);
    else if (filter !== "all") query = query.eq("status", filter);
    const s = q.trim().replace(/[,%()]/g, "");
    if (s) query = query.or(`ref.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
    const { data } = await query;
    setRows((data as Enquiry[]) ?? []); setLoading(false);
  }, [filter, q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    const db = supabaseBrowser();
    const ch = db.channel("kraft-list").on("postgres_changes", { event: "*", schema: "public", table: "kraft_enquiries" }, () => load()).subscribe();
    return () => { db.removeChannel(ch); };
  }, [load]);

  return (
    <>
      <h1>Requests &amp; orders</h1>
      <p className="sub">Every custom request from the website, from first enquiry to delivery. New requests appear live.</p>
      <div className="bar">
        <input className="grow" placeholder="Search reference, name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Show">
          <option value="open">Open (not delivered)</option>
          <option value="all">All</option>
          <option value="g:progress">In progress</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.en}</option>)}
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Reference</th><th>Customer</th><th>Design</th><th>Estimate / quote</th><th>Status</th><th>Received</th></tr></thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="click" onClick={() => router.push(`/admin/requests/${e.id}`)}>
              <td className="num"><b>{e.ref}</b>{e.lang === "ar" && <small style={{ color: "var(--muted)" }}> · AR</small>}</td>
              <td>{e.customer_name}<br /><small className="num" style={{ color: "var(--muted)" }}>{e.phone}</small></td>
              <td>{e.design_name}{e.engraving_text && <><br /><small style={{ color: "var(--muted)" }}>“{e.engraving_text}”</small></>}</td>
              <td className="num">{e.quote ? <b>{qar(e.quote.total)}</b> : e.estimate_lo ? `${qar(e.estimate_lo)}–${Math.round(e.estimate_hi ?? 0).toLocaleString("en-US")}` : "—"}</td>
              <td><span className={`pill${e.status === "new" ? " new" : e.status === "delivered" ? " ok" : e.status === "cancelled" ? " off" : ""}`}>{stageLabel(e.status, "en")}</span></td>
              <td>{fmtDate(e.created_at)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>{loading ? "Loading…" : "Nothing here."}</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}

export default function RequestsPage() { return <Suspense fallback={<p>Loading…</p>}><List /></Suspense>; }
