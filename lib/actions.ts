"use server";
import { randomUUID } from "node:crypto";
import { getCatalog } from "./catalog";
import { serviceClient, supabaseConfigured } from "./supabase-server";
import { COLORS, KARATS, colorAllowed, estimate, qar, stageLabel } from "./gold";
import type { Lang } from "./i18n";
import { t } from "./i18n";
import type { QuoteDetails } from "./types";

const clean = (s: unknown, max = 200) => String(s ?? "").trim().slice(0, max);
const digits = (s: string) => s.replace(/\D/g, "");
const last8 = (s: string) => digits(s).slice(-8);
const PRIVATE = "kraft-private";
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };

/** Short-lived upload slots for a customer's reference photos (max 3), straight to private storage. */
export async function getUploadSlots(types: string[]): Promise<{ ok: true; slots: { path: string; token: string }[] } | { ok: false }> {
  if (!supabaseConfigured) return { ok: false };
  const list = types.slice(0, 3);
  if (!list.length || list.some((x) => !IMAGE_TYPES[x])) return { ok: false };
  const db = serviceClient();
  const day = new Date().toISOString().slice(0, 10);
  const slots = [];
  for (const type of list) {
    const path = `requests/${day}/${randomUUID()}.${IMAGE_TYPES[type]}`;
    const { data, error } = await db.storage.from(PRIVATE).createSignedUploadUrl(path);
    if (error || !data) return { ok: false };
    slots.push({ path, token: data.token });
  }
  return { ok: true, slots };
}

export type EnquiryInput = {
  lang: Lang;
  designSlug?: string;
  customType?: string;
  name: string; phone: string; email?: string;
  karat?: string; color?: string; size?: string; weight?: number; stone?: string;
  engraving?: string; font?: string; notes?: string;
  photos?: string[];
};
export type EnquiryResult = { ok: true; ref: string; whatsappUrl: string; demo: boolean } | { ok: false; error: string };

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  const lang: Lang = input.lang === "ar" ? "ar" : "en";
  const d = t(lang);
  const name = clean(input.name, 80);
  const phone = clean(input.phone, 20).replace(/[^\d+]/g, "");
  if (!name) return { ok: false, error: d.errors.name };
  if (digits(phone).length < 8) return { ok: false, error: d.errors.phone };

  const { settings, designs } = await getCatalog();
  const design = input.designSlug ? designs.find((x) => x.slug === input.designSlug) : undefined;
  const karats = design?.karats?.length ? design.karats : KARATS.map((k) => k.id as string);
  const karat = karats.includes(clean(input.karat, 4)) ? clean(input.karat, 4) : karats[0];
  const colors = design?.colors?.length ? design.colors : COLORS.map((c) => c.id as string);
  let color = colors.includes(clean(input.color, 10)) ? clean(input.color, 10) : colors[0];
  if (!colorAllowed(color, karat)) color = colors.find((c) => colorAllowed(c, karat)) ?? "yellow";
  const stone = design?.stones.find((s) => s.id === input.stone);
  const engraving = design?.engraving || !design ? clean(input.engraving, design?.engraving_max || 40) : "";

  // Estimate on the server from today's rates (never trust numbers from the browser).
  let est: { lo: number; hi: number; rate: number } | null = null;
  let weight: number | null = null;
  if (design) {
    weight = Number.isFinite(input.weight) ? Math.min(design.weight_max, Math.max(design.weight_min, Number(input.weight))) : null;
    est = estimate({ rates: settings.rates, karat, weightMin: weight ?? design.weight_min, weightMax: weight ?? design.weight_max, makingPerG: design.making_per_g, stonePrice: stone?.price });
  }

  const now = new Date();
  const stamp = `${String(now.getUTCFullYear()).slice(2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
  const designName = design ? (lang === "ar" ? design.name_ar : design.name_en) : clean(input.customType, 80) || (lang === "ar" ? "تصميم خاص" : "Custom design");
  const kLabel = KARATS.find((k) => k.id === karat)?.[lang] ?? karat;
  const cLabel = COLORS.find((c) => c.id === color)?.[lang] ?? color;
  const photos = (input.photos ?? []).filter((p) => /^requests\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/.test(p)).slice(0, 3);

  const lines = (ref: string) => [
    lang === "ar" ? `طلب جديد ${ref}` : `New request ${ref}`,
    `${designName}`,
    `${kLabel} · ${cLabel}${input.size ? ` · ${clean(input.size, 20)}` : ""}${weight ? ` · ~${weight} g` : ""}${stone ? ` · ${lang === "ar" ? stone.name_ar : stone.name_en}` : ""}`,
    engraving ? `${d.design.engraving}: ${engraving}` : "",
    est ? `${d.design.estimate}: ${qar(est.lo, lang)} – ${qar(est.hi, lang)}` : "",
    clean(input.notes, 500),
    `${name} · ${phone}`,
  ].filter(Boolean).join("\n");

  if (!supabaseConfigured) {
    const ref = `KK-${stamp}-DEMO`;
    return { ok: true, ref, whatsappUrl: `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines(ref))}`, demo: true };
  }

  const db = serviceClient();
  for (let attempt = 0; attempt < 4; attempt++) {
    const ref = `KK-${stamp}-${Math.floor(10000 + Math.random() * 90000)}`;
    const { data, error } = await db.from("kraft_enquiries").insert({
      ref, lang, design_id: design && !design.id.startsWith("demo-") ? design.id : null, design_name: designName,
      customer_name: name, phone, email: clean(input.email, 120) || null,
      karat, color, size: clean(input.size, 20) || null, weight_est: weight, stone: stone ? stone.name_en : null,
      engraving_text: engraving || null, engraving_font: clean(input.font, 20) || null, notes: clean(input.notes, 1000) || null,
      reference_images: photos, estimate_lo: est?.lo ?? null, estimate_hi: est?.hi ?? null, rate_at_request: est?.rate ?? null,
    }).select("id").single();
    if (error?.code === "23505") continue; // reference already used: pick another
    if (error || !data) { console.error("enquiry insert failed", error); return { ok: false, error: d.errors.generic }; }
    await db.from("kraft_events").insert({ enquiry_id: data.id, status: "new" });
    notifyShop(`New Kraft request ${ref}`, lines(ref));
    return { ok: true, ref, whatsappUrl: `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines(ref))}`, demo: false };
  }
  return { ok: false, error: d.errors.generic };
}

function notifyShop(subject: string, text: string) {
  if (!process.env.RESEND_API_KEY || !process.env.ORDER_NOTIFY_EMAIL) return;
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Kohinoor Kraft <onboarding@resend.dev>", to: [process.env.ORDER_NOTIFY_EMAIL], subject, text }),
  }).catch((e) => console.error("notify email failed", e));
}

// ---------------------------------------------------------------- tracking
export type TrackResult =
  | { ok: false }
  | {
      ok: true;
      ref: string; status: string; designName: string; karat: string | null; color: string | null; size: string | null; engraving: string | null;
      estimate: [number, number] | null; quote: QuoteDetails | null; approvalImages: string[]; approvedAt: string | null;
      events: { status: string; label: string; note: string | null; at: string }[]; updatedAt: string;
    };

async function findOrder(ref: string, phone: string) {
  const r = clean(ref, 30).toUpperCase();
  if (!/^KK-\d{6}-\d{5}$/.test(r) || last8(phone).length < 8 || !supabaseConfigured) return null;
  const db = serviceClient();
  const { data } = await db.from("kraft_enquiries").select("*").eq("ref", r).maybeSingle();
  if (!data || last8(data.phone) !== last8(phone)) return null;
  return data;
}

export async function trackOrder(ref: string, phone: string, lang: Lang): Promise<TrackResult> {
  const o = await findOrder(ref, phone);
  if (!o) return { ok: false };
  const db = serviceClient();
  const { data: ev } = await db.from("kraft_events").select("status,note,created_at").eq("enquiry_id", o.id).order("created_at");
  let designName = o.design_name ?? "";
  if (o.design_id) {
    const { data: dn } = await db.from("kraft_designs").select("name_en,name_ar").eq("id", o.design_id).maybeSingle();
    if (dn) designName = lang === "ar" ? dn.name_ar : dn.name_en;
  }
  let approvalImages: string[] = [];
  if (o.approval_images?.length) {
    const { data } = await db.storage.from(PRIVATE).createSignedUrls(o.approval_images, 3600);
    approvalImages = (data ?? []).map((x) => x.signedUrl).filter(Boolean) as string[];
  }
  return {
    ok: true, ref: o.ref, status: o.status, designName, karat: o.karat, color: o.color, size: o.size, engraving: o.engraving_text,
    estimate: o.estimate_lo ? [Number(o.estimate_lo), Number(o.estimate_hi)] : null,
    quote: o.status !== "new" && o.quote ? (o.quote as QuoteDetails) : null,
    approvalImages, approvedAt: o.approved_at,
    events: (ev ?? []).map((e) => ({ status: e.status, label: stageLabel(e.status, lang), note: e.note, at: e.created_at })),
    updatedAt: o.updated_at,
  };
}

/** The customer approves the design drawing; production can start. */
export async function approveDesign(ref: string, phone: string): Promise<{ ok: boolean }> {
  const o = await findOrder(ref, phone);
  if (!o || o.status !== "design_approval" || o.approved_at) return { ok: false };
  const db = serviceClient();
  const { error } = await db.from("kraft_enquiries").update({ approved_at: new Date().toISOString(), status: "in_production" }).eq("id", o.id);
  if (error) return { ok: false };
  await db.from("kraft_events").insert({ enquiry_id: o.id, status: "in_production" });
  notifyShop(`Design approved: ${o.ref}`, `${o.customer_name} (${o.phone}) approved the design for ${o.ref}. It is now marked "in production".`);
  return { ok: true };
}

