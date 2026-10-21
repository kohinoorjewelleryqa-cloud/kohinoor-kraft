import type { Metadata } from "next";
import Link from "next/link";
import DesignCard from "@/components/DesignCard";
import { getCatalog } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.designs, alternates: { languages: { en: "/en/designs", ar: "/ar/designs" } } };
}

export default async function Designs({ params, searchParams }: { params: Promise<{ lang: Lang }>; searchParams: Promise<{ cat?: string }> }) {
  const { lang } = await params;
  const { cat } = await searchParams;
  const d = t(lang);
  const { categories, designs, settings } = await getCatalog();
  const current = categories.find((c) => c.slug === cat);
  const list = current ? designs.filter((x) => x.category === current.slug) : designs;
  return (
    <main className="wrap page">
      <h1 className="ph1">{current ? pick(current, "name", lang) : d.nav.designs}</h1>
      <nav className="tabs" aria-label={d.nav.designs}>
        <Link href={href(lang, "/designs")} aria-current={!current ? "page" : undefined}>{d.all}</Link>
        {categories.map((c) => <Link key={c.slug} href={`${href(lang, "/designs")}?cat=${c.slug}`} aria-current={current?.slug === c.slug ? "page" : undefined}>{pick(c, "name", lang)}</Link>)}
      </nav>
      {list.length ? <div className="grid">{list.map((x) => <DesignCard key={x.id} d={x} lang={lang} rates={settings.rates} />)}</div> : <p className="muted">{d.empty}</p>}
      <div className="create-strip"><p>{d.create.text}</p><Link className="btn gold" href={href(lang, "/create")}>{d.nav.create}</Link></div>
    </main>
  );
}
