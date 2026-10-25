"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Things that rise into view as you scroll, in order (each group staggers its own items). */
const REVEAL = [
  ".sh", ".sh-row", ".steps li", ".cat", ".budget", ".stone-tile", ".ug-opt", ".ug-rates > div", ".ug-band", ".rail > *", ".grid > *", ".rate-card", ".create-card", ".craft-copy > *",
  ".faq-short details", ".faq-short > a", ".work figure", ".masonry figure", ".contact-grid > *", ".rates-big > div",
  ".prose > p", ".prose > section", ".prose-pic", ".create-strip", ".tabs", ".dhead", ".panel",
].join(",");

const toLatin = (s: string) => s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660)).replace(/[٬,]/g, "");

/**
 * Site animations: scroll reveals, counting gold rates, 3D tilt on design cards and the hero spotlight.
 * Does nothing for visitors who have asked their device for reduced motion.
 */
export default function Motion() {
  const path = usePathname();
  const qs = useSearchParams()?.toString();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.remove("motion"); return; }
    root.classList.add("motion");
    const cleanups: (() => void)[] = [];

    // 1) Reveal on scroll, staggered within each group of siblings.
    const els = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter((el) => !el.closest(".site-head,.drawer,.site-foot") && el.dataset.r === undefined && el.getBoundingClientRect().top > window.innerHeight * 0.9);
    els.forEach((el) => {
      const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => (c as HTMLElement).matches(REVEAL)) : [el];
      el.dataset.r = "";
      el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 10) * 70}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        // Side-scrolling rows: reveal the whole row together (cards off to the side never "enter" the screen).
        const group = e.target.parentElement?.matches(".rail") ? Array.from(e.target.parentElement.children) : [e.target];
        group.forEach((el) => { el.classList.add("in"); io.unobserve(el); });
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    // (The section is watched, not the photo: a fully clipped photo never counts as "on screen".)
    document.querySelectorAll(".craft").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    // 2) Gold rates count up when they come into view.
    const nums = Array.from(document.querySelectorAll<HTMLElement>(".rate-card dd bdi, .rates-big b bdi"));
    const ar = root.lang === "ar";
    const counter = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        counter.unobserve(e.target);
        const el = e.target as HTMLElement;
        const end = Number(toLatin(el.dataset.v ?? (el.dataset.v = el.textContent ?? "")));
        if (!Number.isFinite(end) || end <= 0) return;
        const t0 = performance.now(), dur = 1400;
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(end * eased).toLocaleString(ar ? "ar-QA" : "en-US");
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => counter.observe(n));
    cleanups.push(() => counter.disconnect());

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      // 3) Design cards tilt towards the pointer, with a moving gold glare.
      const onMove = (ev: PointerEvent) => {
        const card = (ev.target as HTMLElement).closest<HTMLElement>(".dimg,.cat-c");
        if (!card) return;
        const r = card.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        card.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
        card.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
        card.style.setProperty("--gx", `${x * 100}%`);
        card.style.setProperty("--gy", `${y * 100}%`);
        card.classList.add("tilt");
      };
      const onLeave = (ev: PointerEvent) => {
        const card = (ev.target as HTMLElement).closest?.<HTMLElement>(".dimg,.cat-c");
        if (card && !card.contains(ev.relatedTarget as Node)) { card.classList.remove("tilt"); card.style.removeProperty("--rx"); card.style.removeProperty("--ry"); }
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerout", onLeave);
      cleanups.push(() => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerout", onLeave); });

      // 4) A soft gold light follows the pointer across the hero.
      const hero = document.querySelector<HTMLElement>(".hero");
      if (hero) {
        let raf = 0;
        const move = (ev: PointerEvent) => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty("--mx", `${ev.clientX - r.left}px`);
            hero.style.setProperty("--my", `${ev.clientY - r.top}px`);
            hero.classList.add("lit");
          });
        };
        const leave = () => hero.classList.remove("lit");
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => { hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave); });
      }
    }
    return () => cleanups.forEach((f) => f());
  }, [path, qs]);

  return null;
}
