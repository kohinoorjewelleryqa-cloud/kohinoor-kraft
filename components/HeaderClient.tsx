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

export function MobileMenu({ lang, items, labels }: { lang: Lang; items: [string, string][]; labels: { menu: string; close: string } }) {
  const [open, setOpen] = useState(false);
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
            {items.map(([h, l]) => <Link key={h} href={h} aria-current={path === h ? "page" : undefined}>{l}</Link>)}
          </nav>
        </div>
      )}
    </>
  );
}
