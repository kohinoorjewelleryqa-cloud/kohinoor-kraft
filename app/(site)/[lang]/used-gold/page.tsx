import type { Metadata } from "next";
import { PageHero } from "@/components/Pic";
import UsedGoldTools from "@/components/UsedGoldTools";
import { getCatalog } from "@/lib/catalog";
import { RATE_KEYS, buyRates } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { PHOTOS } from "@/lib/photos";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const d = t(lang);
  return { title: d.nav.used, description: d.used.text, alternates: { languages: { en: "/en/used-gold", ar: "/ar/used-gold" } } };
}

export default async function UsedGold({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const d = t(lang);
  const U = d.used;
  const { settings } = await getCatalog();
  const buy = buyRates(settings.rates);
  const n = (v: number) => Math.round(v).toLocaleString(lang === "ar" ? "ar-QA" : "en-US");
  const label = (k: string) => (lang === "ar" ? `عيار ${Number(k).toLocaleString("ar-QA")}` : `${k}K`);
  return (
    <>
      <PageHero p={PHOTOS.used} lang={lang} title={U.title} text={U.text} />
      <main className="wrap page">
        <div className="ug-opts">
          <div className="ug-opt">
            <span className="ug-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <h2>{U.exchangeT}</h2>
            <p>{U.exchangeP}</p>
          </div>
          <div className="ug-opt">
            <span className="ug-ic" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            </span>
            <h2>{U.sellT}</h2>
            <p>{U.sellP}</p>
          </div>
        </div>

        <section className="ug-rates-wrap" aria-labelledby="ugr">
          <h2 id="ugr" className="sh">{U.ratesT}</h2>
          <div className="ug-rates">
            {RATE_KEYS.map((k) => (
              <div key={k}><span>{label(k)}</span><b className="num"><bdi>{n(buy[k])}</bdi></b><small>{lang === "ar" ? "ر.ق / غ" : "QAR / g"}</small></div>
            ))}
          </div>
          <p className="muted small">{U.ratesNote}</p>
        </section>

        <div className="ug-grid">
          <UsedGoldTools lang={lang} d={d} buy={buy} />
          <aside className="ug-steps">
            <h2>{U.stepsT}</h2>
            <ol className="steps">
              {U.steps.map(([h, p], i) => (
                <li key={h}><span className="step-n num">{(i + 1).toLocaleString(lang === "ar" ? "ar-QA" : "en-US")}</span><b>{h}</b><p>{p}</p></li>
              ))}
            </ol>
          </aside>
        </div>
      </main>
    </>
  );
}
