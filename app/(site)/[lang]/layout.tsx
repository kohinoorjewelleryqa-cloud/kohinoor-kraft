import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavProgress from "@/components/NavProgress";
import Motion from "@/components/Motion";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import { LANGS, dirOf, isLang, t } from "@/lib/i18n";
import { FONTS_URL } from "@/lib/fonts";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const revalidate = 600;

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const d = t(lang);
  return {
    metadataBase: new URL(site),
    title: { default: `${d.brand} | ${d.tagline}`, template: `%s | ${d.brand}` },
    description: d.hero.text,
    openGraph: { siteName: d.brand, type: "website", locale: lang === "ar" ? "ar_QA" : "en_QA" },
    alternates: { languages: { en: "/en", ar: "/ar" } },
  };
}
// No pinch or double-tap zoom on phones (the layout is built to fit every screen).
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: "cover", themeColor: "#123B2F" };

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { settings, demo } = await getCatalog();
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>
        <NavProgress />
        <Suspense fallback={null}><Motion /></Suspense>
        {demo && <div className="demo-bar">Demo mode: sample designs. Connect Supabase to use real data.</div>}
        <Header lang={lang} settings={settings} />
        <div className="page-in">{children}</div>
        <Footer lang={lang} settings={settings} />
        <a className="wa-float" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" aria-label={t(lang).whatsapp}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-3.3-.8a11.6 11.6 0 0 1-4.6-4.1c-.4-.5-1-1.6-1-2.8 0-1.3.7-2 .9-2.2.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.1.4.2.5.3.1.2.1.7-.1 1.2z"/></svg>
        </a>
      </body>
    </html>
  );
}
