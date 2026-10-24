import type { Metadata } from "next";
import Customiser from "@/components/Customiser";
import { PageHero } from "@/components/Pic";
import { PHOTOS } from "@/lib/photos";
import { getCatalog } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).create.title, description: t(lang).create.text, alternates: { languages: { en: "/en/create", ar: "/ar/create" } } };
}

export default async function Create({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const { categories, settings, stones } = await getCatalog();
  const weeks: [number, number] = [Math.max(1, Math.round(settings.production_min_days / 7)), Math.max(1, Math.round(settings.production_max_days / 7))];
  return (
    <>
    <PageHero p={PHOTOS.sketch} lang={lang} title={d.create.title} text={d.create.text} />
    <main className="wrap page">
      <Customiser lang={lang} d={d} design={null} categories={categories} rates={settings.rates} weeks={weeks} stones={stones} />
    </main>
    </>
  );
}
