"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/** Call before a programmatic navigation (router.push) to show the loading bar. */
export function startProgress() {
  window.dispatchEvent(new Event("kk:nav-start"));
}

function Bar() {
  const path = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Start on taps of internal links, or when startProgress() is called.
  useEffect(() => {
    const start = () => { clear(); setState("loading"); timers.current.push(setTimeout(() => setState("idle"), 10000)); };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("kk:nav-start", start);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("kk:nav-start", start); };
  }, []);

  // Finish when the new page has arrived.
  useEffect(() => {
    setState((s) => {
      if (s !== "loading") return s;
      clear();
      timers.current.push(setTimeout(() => setState("idle"), 350));
      return "done";
    });
  }, [path, search]);

  return <div className={`navbar-progress ${state}`} aria-hidden="true" />;
}

export default function NavProgress() {
  return <Suspense fallback={null}><Bar /></Suspense>;
}
