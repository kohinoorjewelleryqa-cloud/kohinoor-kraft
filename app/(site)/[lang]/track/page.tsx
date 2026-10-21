import type { Metadata } from "next";
import TrackClient from "@/components/TrackClient";
import { getCatalog } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).track.title, robots: { index: false } };
}

export default async function Track({ params, searchParams }: { params: Promise<{ lang: Lang }>; searchParams: Promise<{ ref?: string }> }) {
  const { lang } = await params;
  const { ref } = await searchParams;
  const { settings } = await getCatalog();
  const d = t(lang);
  return (
    <main className="wrap page narrow">
      <header className="dhead"><h1>{d.track.title}</h1><p>{d.track.text}</p></header>
      <TrackClient lang={lang} d={d} initialRef={ref ?? ""} whatsapp={settings.whatsapp} />
    </main>
  );
}
