"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser, browserConfigured } from "@/lib/supabase-browser";

const NAV: [string, string][] = [
  ["/admin", "Dashboard"], ["/admin/requests", "Requests & orders"], ["/admin/designs", "Designs"], ["/admin/portfolio", "Our work (photos)"], ["/admin/settings", "Gold rates & settings"],
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!browserConfigured) { router.replace("/admin/login"); return; }
    const db = supabaseBrowser();
    db.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/admin/login"); return; }
      setEmail(data.user.email ?? "");
      const { data: a } = await db.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
      setState(a ? "ok" : "denied");
    });
  }, [router]);
  useEffect(() => setOpen(false), [path]);
  // Count of new requests, kept live.
  useEffect(() => {
    if (state !== "ok") return;
    const db = supabaseBrowser();
    const load = () => db.from("kraft_enquiries").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setNewCount(count ?? 0));
    load();
    const ch = db.channel("kraft-badge").on("postgres_changes", { event: "*", schema: "public", table: "kraft_enquiries" }, load).subscribe();
    return () => { db.removeChannel(ch); };
  }, [state]);

  const signOut = async () => { await supabaseBrowser().auth.signOut(); router.replace("/admin/login"); };

  if (state === "loading") return <div className="login-wrap"><p style={{ color: "var(--green-ink)" }}>Loading…</p></div>;
  if (state === "denied") return (
    <div className="login-wrap"><div className="login-card"><b>This account isn&apos;t an admin</b><p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>Signed in as {email}. Add this user to the <code>admins</code> table in Supabase, then sign in again.</p><button className="btn o" onClick={signOut}>Sign out</button></div></div>
  );

  return (
    <div className="adm">
      <div className="adm-top"><button type="button" aria-label="Menu" onClick={() => setOpen(true)}>☰</button><b>Kraft admin</b></div>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`adm-side${open ? " open" : ""}`}>
        <Link className="logo" href="/admin"><img src="/logo.webp" alt="" /><span><b>KOHINOOR KRAFT</b><small>ADMIN</small></span></Link>
        {NAV.map(([h, label]) => (
          <Link key={h} className="nav" href={h} aria-current={(h === "/admin" ? path === h : path.startsWith(h)) ? "page" : undefined}>
            {label}{h === "/admin/requests" && newCount > 0 && <span className="badge">{newCount}</span>}
          </Link>
        ))}
        <div className="bottom">
          <span style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</span>
          <a href="/en" target="_blank" rel="noopener">View website ↗</a>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
