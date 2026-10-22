"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { COLORS, ENGRAVING_FONTS, isArabicText } from "@/lib/gold";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Finds the engraving style for some text: Arabic styles for Arabic text, English styles otherwise. */
export function fontFor(text: string, fontId?: string) {
  const set = isArabicText(text) ? ENGRAVING_FONTS.ar : ENGRAVING_FONTS.en;
  return set.find((f) => f.id === fontId) ?? set[0];
}

/**
 * A name necklace drawn in gold: the name in the chosen style, joined to a fine chain at both ends.
 * Measures the rendered name so the chain always meets its edges, in English or Arabic.
 */
export default function NamePendant({ text, fontId, color = "yellow", className = "", label, placeholder = "Fatima", shine = false }: { text: string; fontId?: string; color?: string; className?: string; label?: string; placeholder?: string; shine?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const name = (text || "").trim().slice(0, 18) || placeholder;
  const font = fontFor(name, fontId);
  const ar = isArabicText(name);
  const sw = (COLORS.find((c) => c.id === color) ?? COLORS[0]).swatch;
  const ref = useRef<SVGTextElement>(null);
  const W = 640, cy = 214;
  // Size the name to fit: long names get smaller, up to a maximum height.
  const est = (n: string) => n.length * (ar ? 0.52 : font.id === "script" ? 0.42 : 0.6);
  const size = Math.min(150 * font.size, 520 / Math.max(2.6, est(name)));
  const [half, setHalf] = useState(Math.min(270, (est(name) * size) / 2));

  useIso(() => {
    let alive = true;
    const measure = () => {
      const el = ref.current;
      if (!el || !alive) return;
      try { const w = el.getBBox().width; if (w > 0) setHalf(Math.min(290, w / 2)); } catch { /* not rendered yet */ }
    };
    measure();
    document.fonts?.ready.then(measure);
    return () => { alive = false; };
  }, [name, font.family, size]);

  const lx = W / 2 - half - 4, rx = W / 2 + half + 4;
  const ty = cy - size * (ar ? 0.05 : 0.18); // where the chain meets the letters
  return (
    <svg className={`name-pendant ${className}`} viewBox={`0 0 ${W} 330`} role="img" aria-label={label ? `${label}: ${name}` : name}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sw[0]} />
          <stop offset=".42" stopColor={sw[1]} />
          <stop offset=".55" stopColor={sw[0]} />
          <stop offset="1" stopColor={sw[2]} />
        </linearGradient>
        <linearGradient id={`c${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={sw[2]} />
          <stop offset=".5" stopColor={sw[1]} />
          <stop offset="1" stopColor={sw[2]} />
        </linearGradient>
        {shine && (
          <linearGradient id={`h${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="160" y2="60">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#FFF8E1" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
            <animateTransform attributeName="gradientTransform" type="translate" values={`-200 0; -200 0; ${W + 60} 0`} keyTimes="0;0.45;1" dur="4.2s" repeatCount="indefinite" />
          </linearGradient>
        )}
        <filter id={`s${uid}`} x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity=".28" />
        </filter>
      </defs>
      {/* chain */}
      <path d={`M ${W / 2 - 300} -10 C ${W / 2 - 290} 90, ${lx - 70} ${ty - 30}, ${lx} ${ty}`} fill="none" stroke={`url(#c${uid})`} strokeWidth="3" strokeDasharray="5 2.4" strokeLinecap="round" />
      <path d={`M ${W / 2 + 300} -10 C ${W / 2 + 290} 90, ${rx + 70} ${ty - 30}, ${rx} ${ty}`} fill="none" stroke={`url(#c${uid})`} strokeWidth="3" strokeDasharray="5 2.4" strokeLinecap="round" />
      <circle cx={lx} cy={ty} r="5" fill="none" stroke={`url(#c${uid})`} strokeWidth="2.6" />
      <circle cx={rx} cy={ty} r="5" fill="none" stroke={`url(#c${uid})`} strokeWidth="2.6" />
      {/* name */}
      <text
        ref={ref}
        x={W / 2}
        y={cy + size * 0.3}
        textAnchor="middle"
        direction={ar ? "rtl" : "ltr"}
        style={{ fontFamily: font.family, fontSize: size, fontWeight: font.id === "ruqaa" || font.id === "naskh" ? 700 : 400 }}
        fill={`url(#g${uid})`}
        stroke={sw[2]}
        strokeWidth={size / 70}
        paintOrder="stroke"
        filter={`url(#s${uid})`}
      >
        {name}
      </text>
      {shine && (
        <>
          <text aria-hidden="true" x={W / 2} y={cy + size * 0.3} textAnchor="middle" direction={ar ? "rtl" : "ltr"} style={{ fontFamily: font.family, fontSize: size, fontWeight: font.id === "ruqaa" || font.id === "naskh" ? 700 : 400, mixBlendMode: "screen" }} fill={`url(#h${uid})`}>{name}</text>
          {[[lx + 6, ty - size * 0.55, 1, 0], [rx - 10, ty + size * 0.42, 0.75, 1.3], [W / 2 + half * 0.35, ty - size * 0.7, 0.6, 2.4], [W / 2 - half * 0.5, ty + size * 0.5, 0.55, 3.1]].map(([x, y, sc, delay], i) => (
            <g key={i} aria-hidden="true" transform={`translate(${x} ${y}) scale(${sc})`}><path className="spark" style={{ animationDelay: `${delay}s` }} d="M0 -16 C1.6 -3 3 -1.6 16 0 C3 1.6 1.6 3 0 16 C-1.6 3 -3 1.6 -16 0 C-3 -1.6 -1.6 -3 0 -16Z" fill="#FFF6D8" /></g>
          ))}
        </>
      )}
    </svg>
  );
}
