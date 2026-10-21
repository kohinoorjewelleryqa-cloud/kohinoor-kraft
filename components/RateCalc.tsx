"use client";
import { useState } from "react";
import { KARATS, qar, rateFor } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";

export default function RateCalc({ lang, rates, labels }: { lang: Lang; rates: Record<string, number>; labels: { title: string; weight: string; value: string; karat: string } }) {
  const [k, setK] = useState("22");
  const [w, setW] = useState("10");
  const val = rateFor(rates, k) * (Number(w) || 0);
  return (
    <section className="panel calc">
      <h2>{labels.title}</h2>
      <div className="calc-row">
        <div className="field"><label htmlFor="ck">{labels.karat}</label><select id="ck" value={k} onChange={(e) => setK(e.target.value)}>{KARATS.map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}</select></div>
        <div className="field"><label htmlFor="cw">{labels.weight}</label><input id="cw" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value.replace(/[^\d.]/g, ""))} dir="ltr" /></div>
      </div>
      <p className="calc-out">{labels.value}: <b className="num"><bdi>{qar(val, lang)}</bdi></b></p>
    </section>
  );
}
