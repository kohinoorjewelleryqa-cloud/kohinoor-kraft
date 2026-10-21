"use client";
import { supabaseBrowser } from "./supabase-browser";

/** Tell the website to refresh its cached designs and rates after an admin change. */
export async function refreshShop() {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/revalidate", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
}

export const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { timeZone: "Asia/Qatar", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
