import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.contact };
}
export default async function Contact({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const { settings: s } = await getCatalog();
  const addr = lang === "ar" ? s.address_ar : s.address_en;
  return (
    <main className="wrap page narrow">
      <h1 className="ph1">{d.nav.contact}</h1>
      <div className="contact-grid">
        <div className="panel"><b>{d.footer.visit}</b><p>{addr}</p><a className="btn line" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Kohinoor Jewellery, ${s.address_en}`)}`} target="_blank" rel="noopener">Google Maps</a></div>
        <div className="panel"><b>{d.whatsapp}</b><p><bdi dir="ltr">{s.phone}</bdi></p><a className="btn wa" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener">{d.whatsapp}</a></div>
        <div className="panel"><b>{d.footer.hours}</b><p>{lang === "ar" ? s.hours_ar : s.hours_en}</p><p><bdi dir="ltr">{s.email}</bdi></p></div>
      </div>
    </main>
  );
}
