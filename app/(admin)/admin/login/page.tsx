"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, browserConfigured } from "@/lib/supabase-browser";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message); return; }
    router.push("/admin");
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <img src="/logo.webp" alt="Kohinoor Kraft Jewellery" />
        <div style={{ textAlign: "center" }}><h1 style={{ font: "400 26px/1.2 var(--f-display)", margin: 0 }}>Kraft admin</h1><p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: 14 }}>Sign in to manage requests, designs and gold rates. Same login as the silver store.</p></div>
        {!browserConfigured && <div className="notice info">Supabase isn&apos;t connected yet. Add the Supabase keys in Vercel first (see README).</div>}
        <div className="field"><label htmlFor="em">Email</label><input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {error && <p role="alert" style={{ color: "var(--warn)", fontSize: 13.5, margin: 0 }}>{error}</p>}
        <button className="btn p block" type="submit" disabled={loading || !browserConfigured}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
