import type { Metadata } from "next";
import { FAQ } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.faq };
}
export default async function Faq({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  return (
    <main className="wrap page narrow faq-short">
      <h1 className="ph1">{t(lang).nav.faq}</h1>
      {FAQ[lang].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </main>
  );
}
