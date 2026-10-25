import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { optionFor } from "@/lib/stones";
import Customiser from "@/components/Customiser";
import { getCatalog, getDesign } from "@/lib/catalog";
import { KARATS, qar } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";

export async function generateStaticParams() {
  const { designs } = await getCatalog();
  return designs.flatMap((d) => [{ lang: "en", slug: d.slug }, { lang: "ar", slug: d.slug }]);
}
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const d = await getDesign(slug);
  if (!d) return {};
  return {
    title: pick(d, "name", lang),
    description: pick(d, "description", lang) || undefined,
    alternates: { languages: { en: `/en/designs/${slug}`, ar: `/ar/designs/${slug}` } },
    openGraph: d.images[0] ? { images: [d.images[0]] } : undefined,
  };
}

export default async function DesignPage({ params, searchParams }: { params: Promise<{ lang: Lang; slug: string }>; searchParams: Promise<{ name?: string; font?: string; color?: string; stone?: string }> }) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  const design = await getDesign(slug);
  if (!design) notFound();
  const d = t(lang);
  const { categories, settings, stones } = await getCatalog();
  const cat = categories.find((c) => c.slug === design.category);
  const weeks: [number, number] = [Math.max(1, Math.round(settings.production_min_days / 7)), Math.max(1, Math.round(settings.production_max_days / 7))];
  const n = (v: number) => v.toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
  const karatList = design.karats.map((k) => KARATS.find((x) => x.id === k)?.[lang] ?? k).join(lang === "ar" ? "، " : ", ");
  return (
    <main className="wrap page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href={href(lang, "/designs")}>{d.nav.designs}</Link><span aria-hidden="true">/</span>
        {cat && <><Link href={`${href(lang, "/designs")}?cat=${cat.slug}`}>{pick(cat, "name", lang)}</Link><span aria-hidden="true">/</span></>}
        <span>{pick(design, "name", lang)}</span>
      </nav>
      <header className="dhead">
        <h1>{pick(design, "name", lang)}</h1>
        {pick(design, "description", lang) && <p>{pick(design, "description", lang)}</p>}
        <ul className="facts">
          <li>{d.design.karatsAvailable} {karatList}</li>
          <li>{d.design.weight}: <bdi className="num">{n(design.weight_min)}–{n(design.weight_max)} {d.design.grams}</bdi></li>
        </ul>
      </header>
      <Customiser lang={lang} d={d} design={design} categories={categories} rates={settings.rates} weeks={weeks} initial={{ name: sp.name?.slice(0, 20), font: sp.font, color: sp.color, stone: optionFor(design, sp.stone, stones)?.id }} stones={stones} />
    </main>
  );
}
