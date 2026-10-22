import Link from "next/link";
import { Fragment } from "react";
import HeroName from "@/components/HeroName";
import NamePendant from "@/components/NamePendant";
import Pic from "@/components/Pic";
import { CATEGORY_PHOTOS, PHOTOS } from "@/lib/photos";
import DesignCard from "@/components/DesignCard";
import { getCatalog } from "@/lib/catalog";
import { artSvg, parseArt } from "@/lib/art";
import { KARATS } from "@/lib/gold";
import { ABOUT, FAQ } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const { categories, designs, portfolio, settings } = await getCatalog();
  const featured = designs.filter((x) => x.is_featured).concat(designs.filter((x) => !x.is_featured)).slice(0, 10);
  const num = (n: number) => Math.round(n).toLocaleString(lang === "ar" ? "ar-QA" : "en-US");

  return (
    <main>
      <section className="hero">
        <Pic p={PHOTOS.hero} lang={lang} size="full" className="hero-bg" priority alt="" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">{d.hero.title.split(" ").map((w, i) => <Fragment key={i}>{i > 0 && " "}<span className="w" style={{ "--i": i } as React.CSSProperties}><span>{w}</span></span></Fragment>)}</h1>
            <p>{d.hero.text}</p>
            <div className="hero-btns">
              <Link className="btn gold" href={href(lang, "/create")}>{d.hero.start}</Link>
              <Link className="btn ghost-light" href={href(lang, "/designs")}>{d.hero.browse}</Link>
            </div>
          </div>
          <HeroName lang={lang} labels={{ tryName: d.hero.tryName, placeholder: d.hero.namePlaceholder, start: d.hero.start, font: d.design.font, color: d.design.color }} />
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="mq-track">
          {[0, 1, 2, 3].map((n) => (
            <div className="mq-group" key={n}>
              {[...d.trust.map(([h]) => h), KARATS.map((k) => k[lang]).join(" · "), d.nav.create, d.sections.categories].map((x) => <span key={x}>{x}<i>✦</i></span>)}
            </div>
          ))}
        </div>
      </div>

      <section className="block how">
        <div className="wrap">
          <h2 className="sh">{d.how.title}</h2>
          <ol className="steps">
            {d.how.steps.map(([title, text], i) => (
              <li key={title}><span className="step-n num">{(i + 1).toLocaleString(lang === "ar" ? "ar-QA" : "en-US")}</span><b>{title}</b><p>{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sh-row"><h2 className="sh">{d.sections.categories}</h2><Link href={href(lang, "/designs")}>{d.sections.viewAll}</Link></div>
          <div className="cats">
            {categories.map((c) => { const [type, v] = parseArt(c.art); const photo = CATEGORY_PHOTOS[c.slug]; return (
              <Link key={c.slug} href={`${href(lang, "/designs")}?cat=${c.slug}`} className="cat">
                {photo ? <span className="cat-c photo"><Pic p={photo} lang={lang} size="small" ratio={1} alt="" /></span>
                  : c.slug === "name-jewellery" ? <span className="cat-c name"><NamePendant text={lang === "ar" ? "نور" : "Noor"} /></span>
                  : <span className="cat-c" dangerouslySetInnerHTML={{ __html: artSvg(type, "yellow", "none", v) }} />}
                <span>{pick(c, "name", lang)}</span>
              </Link>
            ); })}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sh-row"><h2 className="sh">{d.sections.featured}</h2><Link href={href(lang, "/designs")}>{d.sections.viewAll}</Link></div>
          <div className="rail">{featured.map((x) => <DesignCard key={x.id} d={x} lang={lang} rates={settings.rates} />)}</div>
        </div>
      </section>

      <section className="craft">
        <div className="craft-img"><Pic p={PHOTOS.craft} lang={lang} ratio={4 / 3} /></div>
        <div className="craft-copy">
          <h2>{ABOUT[lang].title}</h2>
          <p>{ABOUT[lang].paras[0]}</p>
          <ul>{d.trust.map(([h, t2]) => <li key={h}><b>{h}</b><span>{t2}</span></li>)}</ul>
          <Link className="btn gold" href={href(lang, "/about")}>{d.nav.about}</Link>
        </div>
      </section>

      <section className="block">
        <div className="wrap split">
          <div className="rate-card">
            <h2>{d.sections.rates}</h2>
            <dl>
              {KARATS.map((k) => <div key={k.id}><dt>{k[lang]}</dt><dd className="num"><bdi>{num(settings.rates[k.id] ?? 0)}</bdi> <small>{lang === "ar" ? "ر.ق/غ" : "QAR/g"}</small></dd></div>)}
            </dl>
            <Link href={href(lang, "/gold-rate")}>{d.nav.rate}</Link>
          </div>
          <div className="create-card">
            <Pic p={PHOTOS.sketch} lang={lang} className="cc-bg" alt="" />
            <h2>{d.create.title}</h2>
            <p>{d.create.text}</p>
            <Link className="btn gold" href={href(lang, "/create")}>{d.hero.start}</Link>
          </div>
        </div>
      </section>

      {portfolio.length > 0 && (
        <section className="block">
          <div className="wrap">
            <div className="sh-row"><h2 className="sh">{d.sections.portfolio}</h2><Link href={href(lang, "/portfolio")}>{d.sections.viewAll}</Link></div>
            <div className="rail work">{portfolio.slice(0, 10).map((p) => <figure key={p.id}><img src={p.image} alt={pick(p, "title", lang)} loading="lazy" /><figcaption>{pick(p, "title", lang)}</figcaption></figure>)}</div>
          </div>
        </section>
      )}

      <section className="block">
        <div className="wrap faq-short">
          <h2 className="sh">{d.sections.faq}</h2>
          {FAQ[lang].slice(0, 4).map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          <Link href={href(lang, "/faq")}>{d.sections.viewAll}</Link>
        </div>
      </section>
    </main>
  );
}
