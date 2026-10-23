import type { Metadata } from "next";
import Link from "next/link";
import DesignCard from "@/components/DesignCard";
import { PageHero } from "@/components/Pic";
import { CATEGORY_PHOTOS, PHOTOS } from "@/lib/photos";
import { getCatalog } from "@/lib/catalog";
import { budgetCounts, budgetLabel, findBudget, fromPrice, inBudget } from "@/lib/budget";
import { findStone, optionFor, stoneCounts, stoneName } from "@/lib/stones";
import Gem from "@/components/Gem";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: t(lang).nav.designs, alternates: { languages: { en: "/en/designs", ar: "/ar/designs" } } };
}

export default async function Designs({ params, searchParams }: { params: Promise<{ lang: Lang }>; searchParams: Promise<{ cat?: string; budget?: string; stone?: string }> }) {
  const { lang } = await params;
  const { cat, budget: budgetId, stone: stoneId } = await searchParams;
  const d = t(lang);
  const { categories, designs, settings } = await getCatalog();
  const current = categories.find((c) => c.slug === cat);
  const budget = findBudget(budgetId);
  const stone = findStone(stoneId);
  const inCat = (current ? designs.filter((x) => x.category === current.slug) : designs).filter((x) => !stone || optionFor(x, stone.id));
  // With a budget chosen: only designs starting within it, cheapest first.
  const priceOf = (x: (typeof designs)[number]) => fromPrice(x, settings.rates) + (optionFor(x, stone?.id)?.price ?? 0);
  const list = budget ? inCat.filter((x) => inBudget(budget, priceOf(x))).sort((a, b) => priceOf(a) - priceOf(b)) : inCat;
  const budgets = budgetCounts(inCat, settings.rates, budget?.id);
  const stones = stoneCounts(current ? designs.filter((x) => x.category === current.slug) : designs, stone?.id);
  const link = (c?: string, b?: string, st: string | undefined = stone?.id) => { const q = new URLSearchParams(); if (c) q.set("cat", c); if (b) q.set("budget", b); if (st) q.set("stone", st); const s = q.toString(); return `${href(lang, "/designs")}${s ? `?${s}` : ""}`; };
  return (
    <>
    <PageHero p={(current && CATEGORY_PHOTOS[current.slug]) || PHOTOS.worn} lang={lang} title={current ? pick(current, "name", lang) : d.nav.designs} text={[stone && stoneName(stone, lang), budget && budgetLabel(budget, lang)].filter(Boolean).join(" · ") || undefined} />
    <main className="wrap page">
      <nav className="tabs" aria-label={d.nav.designs}>
        <Link href={link(undefined, budget?.id)} aria-current={!current ? "page" : undefined}>{d.all}</Link>
        {categories.map((c) => <Link key={c.slug} href={link(c.slug, budget?.id)} aria-current={current?.slug === c.slug ? "page" : undefined}>{pick(c, "name", lang)}</Link>)}
      </nav>
      {(stones.length > 0 || stone) && (
        <nav className="price-chips stone-chips" aria-label={d.sections.stones}>
          <span>{d.sections.stones}</span>
          <Link href={link(current?.slug, budget?.id, "")} aria-current={!stone ? "page" : undefined}>{d.sections.anyStone}</Link>
          {stones.map(({ t: st }) => <Link key={st.id} href={link(current?.slug, budget?.id, st.id)} aria-current={stone?.id === st.id ? "page" : undefined}><Gem t={st} />{stoneName(st, lang)}</Link>)}
        </nav>
      )}
      {(budgets.length > 1 || budget) && (
        <nav className="price-chips" aria-label={d.sections.budget}>
          <span>{d.sections.budget}</span>
          <Link href={link(current?.slug)} aria-current={!budget ? "page" : undefined}>{d.sections.anyPrice}</Link>
          {budgets.map(({ b }) => <Link key={b.id} href={link(current?.slug, b.id)} aria-current={budget?.id === b.id ? "page" : undefined}>{budgetLabel(b, lang)}</Link>)}
        </nav>
      )}
      {list.length ? <div className="grid">{list.map((x) => <DesignCard key={x.id} d={x} lang={lang} rates={settings.rates} stone={stone?.id} />)}</div> : <p className="muted">{d.empty}</p>}
      <div className="create-strip"><p>{d.create.text}</p><Link className="btn gold" href={href(lang, "/create")}>{d.nav.create}</Link></div>
    </main>
    </>
  );
}
