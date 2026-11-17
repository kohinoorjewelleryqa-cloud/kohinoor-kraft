"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

/** Switches to the same page in the other language. */
export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const path = usePathname() || `/${lang}`;
  const other = lang === "en" ? "ar" : "en";
  const target = path.replace(/^\/(en|ar)(?=\/|$)/, `/${other}`);
  return <Link className="lang" href={target} hrefLang={other} lang={other}>{label}</Link>;
}

export type NavGroup = { name: string; href: string; icon?: string; subs: { name: string; href: string }[] };
type MenuLabels = { menu: string; close: string; viewAll: string; shop: string; more: string; start: string; brand: string; sub: string; home: string };

const Chevron = ({ dir = "down" }: { dir?: "down" | "end" }) => (
  <svg className={`dc-chev ${dir}`} viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function MobileMenu({ lang, items, groups = [], createHref, labels }: { lang: Lang; items: [string, string][]; groups?: NavGroup[]; createHref: string; labels: MenuLabels }) {
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  const close = () => setOpen(false);
  const links = items.filter(([h]) => h !== createHref);
  return (
    <>
      <button className="burger" type="button" aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>
      </button>
      {open && (
        <div className="drawer-wrap" onClick={close}>
          <nav className="drawer" aria-label={labels.menu} onClick={(e) => e.stopPropagation()} dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="drawer-top">
              <Link className="drawer-brand" href={labels.home} onClick={close}>
                <img src="/logo-mark.webp" alt="" width={30} height={40} />
                <span><b>{labels.brand}</b><small>{labels.sub}</small></span>
              </Link>
              <button className="drawer-x" type="button" aria-label={labels.close} onClick={close}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="drawer-body">
              {groups.length > 0 && (
                <>
                  <p className="drawer-label">{labels.shop}</p>
                  <ul className="drawer-cats">
                    {groups.map((g) => {
                      const isOpen = exp === g.href;
                      const inner = (
                        <>
                          <span className="dc-ic" dangerouslySetInnerHTML={{ __html: g.icon ?? "" }} />
                          <span className="dc-name">{g.name}</span>
                          <Chevron dir={g.subs.length ? "down" : "end"} />
                        </>
                      );
                      return (
                        <li key={g.href} className={`dc-group${isOpen ? " open" : ""}`}>
                          {g.subs.length ? (
                            <button type="button" className="dc-head" aria-expanded={isOpen} onClick={() => setExp(isOpen ? null : g.href)}>{inner}</button>
                          ) : (
                            <Link className="dc-head" href={g.href} onClick={close}>{inner}</Link>
                          )}
                          {g.subs.length > 0 && (
                            <div className="dc-subs" hidden={!isOpen}>
                              {g.subs.map((s) => <Link key={s.href} href={s.href} onClick={close}>{s.name}</Link>)}
                              <Link className="dc-all" href={g.href} onClick={close}>{labels.viewAll} <span aria-hidden="true">{lang === "ar" ? "←" : "→"}</span></Link>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <p className="drawer-label">{labels.more}</p>
              <ul className="drawer-links">
                {links.map(([h, l]) => <li key={h}><Link href={h} onClick={close} aria-current={path === h ? "page" : undefined}>{l}</Link></li>)}
              </ul>
            </div>
            <div className="drawer-foot">
              <Link className="btn gold drawer-cta" href={createHref} onClick={close}>{labels.start}</Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
