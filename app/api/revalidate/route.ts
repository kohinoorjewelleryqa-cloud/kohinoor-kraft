import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { serviceClient, supabaseConfigured } from "@/lib/supabase-server";

// Called by the admin panel after any design, rate or settings change,
// so the website shows the update immediately instead of after the cache expires.
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = serviceClient();
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: admin } = await db.from("admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  revalidateTag("kraft", { expire: 0 });
  return NextResponse.json({ ok: true });
}
