type Section = { h: string; p?: string; li?: string[] };
/** Simple text page (about, terms, privacy). */
export default function TextPage({ title, intro, sections, note }: { title: string; intro?: string[]; sections?: Section[]; note?: string }) {
  return (
    <main className="wrap page narrow prose">
      <h1 className="ph1">{title}</h1>
      {note && <p className="muted small">{note}</p>}
      {intro?.map((p) => <p key={p}>{p}</p>)}
      {sections?.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p && <p>{s.p}</p>}
          {s.li && <ul>{s.li.map((x) => <li key={x}>{x}</li>)}</ul>}
        </section>
      ))}
    </main>
  );
}
