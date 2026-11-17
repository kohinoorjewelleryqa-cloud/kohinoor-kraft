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

export type NavGroup = { name: string; href: string; subs: { name: string; href: string }[] };

export function MobileMenu({ lang, items, groups = [], labels }: { lang: Lang; items: [string, string][]; groups?: NavGroup[]; labels: { menu: string; close: string; viewAll: string } }) {
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
  return (
    <>
      <button className="burger" type="button" aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>
      </button>
      {open && (
        <div className="drawer-wrap" onClick={() => setOpen(false)}>
          <nav className="drawer" aria-label={labels.menu} onClick={(e) => e.stopPropagation()} dir={lang === "ar" ? "rtl" : "ltr"}>
            <button className="drawer-x" type="button" onClick={() => setOpen(false)}>{labels.close}</button>
            {groups.length > 0 && (
              <div className="drawer-cats">
                {groups.map((g) => g.subs.length ? (
                  <div key={g.href} className="dc-group">
                    <button type="button" className="dc-head" aria-expanded={exp === g.href} onClick={() => setExp(exp === g.href ? null : g.href)}>
                      <span>{g.name}</span>
                      <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
                    </button>
                    {exp === g.href && (
                      <div className="dc-subs">
                        {g.subs.map((s) => <Link key={s.href} href={s.href} onClick={() => setOpen(false)}>{s.name}</Link>)}
                        <Link className="dc-all" href={g.href} onClick={() => setOpen(false)}>{labels.viewAll}</Link>
                      </div>
                    )}
                  </div>
                ) : <Link key={g.href} className="dc-head" href={g.href} onClick={() => setOpen(false)}>{g.name}</Link>)}
              </div>
            )}
            {items.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? "page" : undefined}>{l}</Link>)}
          </nav>
        </div>
      )}
    </>
  );
}
