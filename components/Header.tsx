import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { href, t } from "@/lib/i18n";
import { KARATS } from "@/lib/gold";
import type { Settings } from "@/lib/types";
import { LangSwitch, MobileMenu } from "./HeaderClient";

export default function Header({ lang, settings }: { lang: Lang; settings: Settings }) {
  const d = t(lang);
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
        <MobileMenu lang={lang} items={nav} labels={{ menu: d.menu, close: d.close }} />
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
    </header>
  );
}
