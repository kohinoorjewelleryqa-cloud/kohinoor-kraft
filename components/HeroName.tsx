"use client";
import Link from "next/link";
import { useState } from "react";
import NamePendant, { fontFor } from "./NamePendant";
import { COLORS, ENGRAVING_FONTS, isArabicText } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { href } from "@/lib/i18n";

/** Home page: type a name and see it as a gold name necklace. */
export default function HeroName({ lang, labels }: { lang: Lang; labels: { tryName: string; placeholder: string; start: string; font: string; color: string } }) {
  const [name, setName] = useState("");
  const [font, setFont] = useState<string>("");
  const [color, setColor] = useState("yellow");
  const shown = name.trim() || labels.placeholder;
  const ar = isArabicText(shown);
  const fonts = ar ? ENGRAVING_FONTS.ar : ENGRAVING_FONTS.en;
  const current = fontFor(shown, font).id;
  const design = ar ? "arabic-name-necklace" : "script-name-necklace";
  const qs = new URLSearchParams({ name: name.trim(), font: current, color }).toString();
  return (
    <div className="hero-name">
      <NamePendant text={name} placeholder={labels.placeholder} fontId={font} color={color} className="hero-pendant" label={labels.tryName} />
      <div className="hn-controls">
        <label className="sr-only" htmlFor="hn">{labels.tryName}</label>
        <input id="hn" className="hn-input" value={name} maxLength={14} placeholder={labels.tryName} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <div className="hn-row">
          <div className="chips" role="radiogroup" aria-label={labels.font}>
            {fonts.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={current === f.id} className="chip" style={{ fontFamily: f.family }} onClick={() => setFont(f.id)}>{f.label}</button>
            ))}
          </div>
          <div className="swatches" role="radiogroup" aria-label={labels.color}>
            {COLORS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={color === c.id} aria-label={c[lang]} title={c[lang]} className="swatch" style={{ background: `linear-gradient(135deg,${c.swatch[0]},${c.swatch[1]} 55%,${c.swatch[2]})` }} onClick={() => setColor(c.id)} />
            ))}
          </div>
        </div>
        <Link className="btn gold" href={`${href(lang, `/designs/${design}`)}?${qs}`}>{labels.start}</Link>
      </div>
    </div>
  );
}
