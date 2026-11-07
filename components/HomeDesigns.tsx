"use client";
import Link from "next/link";
import { useState } from "react";

type Item = { id: string; cat: string; node: React.ReactNode };
type Props = {
  title: string;
  tabs: { slug: string; name: string }[];
  items: Item[];
  labels: { all: string; more: string; viewAll: string };
  viewAllHref: string;
};

const STEP = 12;

/** All designs on the home page, with category tabs and "Show more". */
export default function HomeDesigns({ title, tabs, items, labels, viewAllHref }: Props) {
  const [cat, setCat] = useState("");
  const [shown, setShown] = useState(STEP);
  const list = cat ? items.filter((x) => x.cat === cat) : items;
  const used = tabs.filter((t) => items.some((x) => x.cat === t.slug));
  const pickCat = (c: string) => { setCat(c); setShown(STEP); };
  return (
    <section className="block home-designs" id="designs">
      <div className="wrap">
        <div className="sh-row"><h2 className="sh">{title}</h2><Link href={viewAllHref}>{labels.viewAll}</Link></div>
        {used.length > 1 && (
          <div className="tabs" role="tablist" aria-label={title}>
            <button type="button" role="tab" aria-selected={!cat} onClick={() => pickCat("")}>{labels.all}</button>
            {used.map((t) => <button key={t.slug} type="button" role="tab" aria-selected={cat === t.slug} onClick={() => pickCat(t.slug)}>{t.name}</button>)}
          </div>
        )}
        <div className="grid">{list.slice(0, shown).map((x) => <div key={x.id} className="hd-item">{x.node}</div>)}</div>
        {list.length > shown && (
          <div className="hd-more"><button type="button" className="btn line" onClick={() => setShown(shown + STEP)}>{labels.more}</button></div>
        )}
      </div>
    </section>
  );
}
