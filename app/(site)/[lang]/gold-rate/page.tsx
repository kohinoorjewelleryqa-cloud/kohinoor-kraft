import type { Metadata } from "next";
import RateCalc from "@/components/RateCalc";
import { PageHero } from "@/components/Pic";
import { PHOTOS } from "@/lib/photos";
import { getCatalog } from "@/lib/catalog";
import { RATE_KEYS } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).rate.title, alternates: { languages: { en: "/en/gold-rate", ar: "/ar/gold-rate" } } };
}

export default async function GoldRate({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const { settings } = await getCatalog();
  const n = (v: number) => Math.round(v).toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
  const label = (k: string) => (lang === "ar" ? `عيار ${Number(k).toLocaleString("ar-QA")}` : `${k}K`);
  return (
    <>
    <PageHero p={PHOTOS.bars} lang={lang} title={d.rate.title} text={d.rate.text} />
    <main className="wrap page narrow">
      <div className="rates-big">
        {RATE_KEYS.map((k) => (
          <div key={k} className={k === "24" ? "ref" : ""}><span>{label(k)}</span><b className="num"><bdi>{n(settings.rates[k] ?? 0)}</bdi></b><small>{lang === "ar" ? "ر.ق" : "QAR"} {d.rate.perGram}</small></div>
        ))}
      </div>
      {settings.rates_updated_at && <p className="muted small">{d.rate.updated}: {new Date(settings.rates_updated_at).toLocaleString(lang === "ar" ? "ar-QA" : "en-GB", { timeZone: "Asia/Qatar", dateStyle: "medium", timeStyle: "short" })}</p>}
      <p className="muted small">{d.rate.note}</p>
      <RateCalc lang={lang} rates={settings.rates} labels={{ title: d.rate.calc, weight: d.rate.weight, value: d.rate.value, karat: d.design.karat }} />
    </main>
    </>
  );
}
