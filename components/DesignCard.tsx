import Link from "next/link";
import DesignVisual from "./DesignVisual";
import { fromPrice } from "@/lib/budget";
import { optionFor } from "@/lib/stones";
import { qar } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";
import type { Design } from "@/lib/types";

/** `stone`: a stone type chosen in "Shop by stone": the link pre-selects it and the price includes it. */
export default function DesignCard({ d, lang, rates, stone }: { d: Design; lang: Lang; rates: Record<string, number>; stone?: string }) {
  const name = pick(d, "name", lang);
  // "From" price: lightest weight in the lowest karat offered.
  const opt = optionFor(d, stone);
  const lo = fromPrice(d, rates) + (opt?.price ?? 0);
  return (
    <Link className="dcard" href={href(lang, `/designs/${d.slug}${opt ? `?stone=${stone}` : ""}`)}>
      <span className="dimg"><DesignVisual d={d} alt={name} lang={lang} /></span>
      <span className="dname">{name}</span>
      <span className="dprice"><small>{t(lang).design.from}</small> <bdi className="num">{qar(lo, lang)}</bdi></span>
    </Link>
  );
}
