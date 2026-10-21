import Link from "next/link";
import DesignVisual from "./DesignVisual";
import { estimate, qar } from "@/lib/gold";
import type { Lang } from "@/lib/i18n";
import { href, pick, t } from "@/lib/i18n";
import type { Design } from "@/lib/types";

export default function DesignCard({ d, lang, rates }: { d: Design; lang: Lang; rates: Record<string, number> }) {
  const name = pick(d, "name", lang);
  // "From" price: lightest weight in the lowest karat offered.
  const k = [...d.karats].sort()[0] ?? "18";
  const { lo } = estimate({ rates, karat: k, weightMin: d.weight_min, weightMax: d.weight_min, makingPerG: d.making_per_g });
  return (
    <Link className="dcard" href={href(lang, `/designs/${d.slug}`)}>
      <span className="dimg"><DesignVisual d={d} alt={name} lang={lang} /></span>
      <span className="dname">{name}</span>
      <span className="dprice"><small>{t(lang).design.from}</small> <bdi className="num">{qar(lo, lang)}</bdi></span>
    </Link>
  );
}
