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
export default function NamePendant({ text, fontId, color = "yellow", className = "", label, placeholder = "Fatima" }: { text: string; fontId?: string; color?: string; className?: string; label?: string; placeholder?: string }) {
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
    </svg>
  );
}
