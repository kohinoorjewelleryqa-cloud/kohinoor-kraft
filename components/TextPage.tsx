import Pic, { PageHero } from "./Pic";
import type { Lang } from "@/lib/i18n";
import type { Photo } from "@/lib/photos";

type Section = { h: string; p?: string; li?: string[] };
/** Simple text page (about, terms, privacy), optionally with a photo header and a photo after the introduction. */
export default function TextPage({ title, intro, sections, note, lang, hero, photo }: { title: string; intro?: string[]; sections?: Section[]; note?: string; lang?: Lang; hero?: Photo; photo?: Photo }) {
  return (
    <>
      {hero && lang && <PageHero p={hero} lang={lang} title={title} />}
      <main className="wrap page narrow prose">
        {!(hero && lang) && <h1 className="ph1">{title}</h1>}
        {note && <p className="muted small">{note}</p>}
        {intro?.map((p) => <p key={p}>{p}</p>)}
        {photo && lang && <figure className="prose-pic"><Pic p={photo} lang={lang} ratio={16 / 9} /></figure>}
        {sections?.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p && <p>{s.p}</p>}
            {s.li && <ul>{s.li.map((x) => <li key={x}>{x}</li>)}</ul>}
          </section>
        ))}
      </main>
    </>
  );
}
