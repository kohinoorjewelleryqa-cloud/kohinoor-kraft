"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RatesEditor from "@/components/admin/RatesEditor";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fmtDate } from "@/lib/admin";
import { stageLabel } from "@/lib/gold";
import type { Enquiry } from "@/lib/admin-types";

const GROUPS: [string, string, string[]][] = [
  ["New requests", "new", ["new"]],
  ["Quoted, waiting for advance", "quoted", ["quoted"]],
  ["In progress", "progress", ["advance_paid", "design_approval", "in_production", "finishing"]],
  ["Ready for the customer", "ready", ["ready"]],
];

export default function Dashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [latest, setLatest] = useState<Enquiry[]>([]);
  useEffect(() => {
    const db = supabaseBrowser();
    db.from("kraft_enquiries").select("status").not("status", "in", "(delivered,cancelled)").then(({ data }) => {
      const c: Record<string, number> = {};
      for (const r of data ?? []) for (const [, key, st] of GROUPS) if (st.includes(r.status)) c[key] = (c[key] ?? 0) + 1;
      setCounts(c);
    });
    db.from("kraft_enquiries").select("*").order("created_at", { ascending: false }).limit(8).then(({ data }) => setLatest((data as Enquiry[]) ?? []));
  }, []);
  return (
    <>
      <h1>Dashboard</h1>
      <p className="sub">Custom gold requests and orders for Kohinoor Kraft Jewellery.</p>
      <div className="tiles">
        {GROUPS.map(([label, key]) => (
          <Link key={key} href={`/admin/requests?group=${key}`} className={`tile${key === "new" && counts[key] ? " alert" : ""}`}><small>{label}</small><b>{counts[key] ?? 0}</b></Link>
        ))}
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <section>
          <h2>Latest requests</h2>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Reference</th><th>Customer</th><th>Design</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {latest.map((e) => (
                <tr key={e.id} className="click" onClick={() => router.push(`/admin/requests/${e.id}`)}>
                  <td className="num"><b>{e.ref}</b></td><td>{e.customer_name}</td><td>{e.design_name}</td>
                  <td><span className={`pill${e.status === "new" ? " new" : e.status === "delivered" ? " ok" : e.status === "cancelled" ? " off" : ""}`}>{stageLabel(e.status, "en")}</span></td><td>{fmtDate(e.created_at)}</td>
                </tr>
              ))}
              {!latest.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>No requests yet. They appear here as soon as a customer sends one.</td></tr>}
            </tbody>
          </table></div>
        </section>
        <RatesEditor />
      </div>
    </>
  );
}
