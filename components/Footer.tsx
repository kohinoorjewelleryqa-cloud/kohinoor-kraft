import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { href, t } from "@/lib/i18n";
import { COMPANY } from "@/lib/company";
import type { Settings } from "@/lib/types";

export default function Footer({ lang, settings }: { lang: Lang; settings: Settings }) {
  const d = t(lang);
  const links: [string, string][] = [
    ["/designs", d.nav.designs], ["/create", d.nav.create], ["/portfolio", d.nav.portfolio], ["/gold-rate", d.nav.rate], ["/used-gold", d.nav.used], ["/track", d.nav.track],
    ["/about", d.nav.about], ["/faq", d.nav.faq], ["/contact", d.nav.contact], ["/terms", d.nav.terms], ["/privacy", d.nav.privacy],
  ];
  const company = lang === "ar" ? `${COMPANY.legalName} · سجل تجاري رقم ${COMPANY.crNumber}` : `${COMPANY.legalName} · C.R. No. ${COMPANY.crNumber}`;
  return (
    <footer className="site-foot">
      <div className="wrap fgrid">
        <div>
          <img className="flogo" src="/logo-full.webp" alt={d.brand} width={220} height={207} loading="lazy" />
          <p className="fabout">{d.footer.about}</p>
        </div>
        <ul className="flinks">{links.map(([p, l]) => <li key={p}><Link href={href(lang, p)}>{l}</Link></li>)}</ul>
        <div className="fvisit">
          <b>{d.footer.visit}</b>
          <p>{lang === "ar" ? settings.address_ar : settings.address_en}</p>
          <p><bdi dir="ltr">{settings.phone}</bdi><br /><bdi dir="ltr">{settings.email}</bdi></p>
          <b>{d.footer.hours}</b>
          <p>{lang === "ar" ? settings.hours_ar : settings.hours_en}</p>
        </div>
      </div>
      <div className="wrap fbot">© {new Date().getFullYear()} {company}. {d.footer.rights}</div>
    </footer>
  );
}
