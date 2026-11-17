import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";
import { KARATS } from "@/lib/gold";
import type { Category, Settings } from "@/lib/types";
import { mainCats, subCats } from "@/lib/cats";
import { LangSwitch, MobileMenu, type NavGroup } from "./HeaderClient";

export default function Header({ lang, settings, categories = [] }: { lang: Lang; settings: Settings; categories?: Category[] }) {
  const d = t(lang);
  const catHref = (slug: string) => `${href(lang, "/designs")}?cat=${slug}`;
  const groups: NavGroup[] = mainCats(categories).map((m) => ({
    name: pick(m, "name", lang), href: catHref(m.slug),
    subs: subCats(categories, m.slug).map((c) => ({ name: pick(c, "name", lang), href: catHref(c.slug) })),
  }));
  const nav: [string, string][] = [
    [href(lang, "/designs"), d.nav.designs],
    [href(lang, "/create"), d.nav.create],
    [href(lang, "/portfolio"), d.nav.portfolio],
    [href(lang, "/gold-rate"), d.nav.rate],
    [href(lang, "/used-gold"), d.nav.used],
    [href(lang, "/track"), d.nav.track],
  ];
  const num = (n: number) => Math.round(n).toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
  return (
    <header className="site-head">
      <div className="ratebar">
        <div className="wrap">
          <Link href={href(lang, "/gold-rate")} className="rates">
            <span className="lbl">{d.rateBar}</span>
            {KARATS.map((k) => <span key={k.id} className="num"><b>{k[lang]}</b> {num(settings.rates[k.id] ?? 0)}</span>)}
          </Link>
          <LangSwitch lang={lang} label={d.langSwitch} />
        </div>
      </div>
      <div className="wrap hdr">
        <MobileMenu lang={lang} items={nav} groups={groups} labels={{ menu: d.menu, close: d.close, viewAll: d.sections.viewAll }} />
        <Link className="brand" href={href(lang)} aria-label={d.brand}>
          <img src="/logo-mark.webp" alt="" width={41} height={54} />
          <span className="wm"><b>{d.brandShort}</b><span>{d.brandSub}</span></span>
        </Link>
        <nav className="mainnav" aria-label={d.menu}>
          {nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        </nav>
        <div className="hdr-cta">
          <Link className="btn gold sm" href={href(lang, "/create")}>{d.hero.start}</Link>
        </div>
      </div>
      {groups.length > 0 && (
        <nav className="catbar" aria-label={d.nav.designs}>
          <ul className="wrap">
            {groups.map((g) => (
              <li key={g.href} className={g.subs.length ? "has-sub" : undefined}>
                <Link href={g.href}>{g.name}{g.subs.length > 0 && <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>}</Link>
                {g.subs.length > 0 && (
                  <div className="catdrop">
                    <ul>
                      {g.subs.map((s) => <li key={s.href}><Link href={s.href}>{s.name}</Link></li>)}
                      <li className="all"><Link href={g.href}>{d.sections.viewAll}</Link></li>
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
