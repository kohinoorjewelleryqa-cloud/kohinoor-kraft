import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).portfolio.title, alternates: { languages: { en: "/en/portfolio", ar: "/ar/portfolio" } } };
}

export default async function Portfolio({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const { portfolio } = await getCatalog();
  return (
    <main className="wrap page">
      <header className="dhead"><h1>{d.portfolio.title}</h1><p>{d.portfolio.text}</p></header>
      {portfolio.length ? (
        <div className="masonry">{portfolio.map((p) => <figure key={p.id}><img src={p.image} alt={pick(p, "title", lang)} loading="lazy" />{pick(p, "title", lang) && <figcaption>{pick(p, "title", lang)}</figcaption>}</figure>)}</div>
      ) : (
        <div className="create-strip"><p>{d.create.text}</p><Link className="btn gold" href={href(lang, "/create")}>{d.nav.create}</Link></div>
      )}
    </main>
  );
}
