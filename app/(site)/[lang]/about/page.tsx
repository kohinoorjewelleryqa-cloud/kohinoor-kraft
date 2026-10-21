import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { ABOUT } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.about };
}
export default async function About({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  return <TextPage title={ABOUT[lang].title} intro={ABOUT[lang].paras} sections={d.trust.map(([h, p]) => ({ h, p }))} />;
}
