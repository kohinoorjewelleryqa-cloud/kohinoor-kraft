import type { Lang } from "@/lib/i18n";
import { photoSrcSet, photoUrl, type Photo } from "@/lib/photos";

const FULL = [640, 960, 1280, 1600, 1920, 2560, 3200, 3840];
const HALF = [480, 720, 960, 1280, 1600, 1920, 2560];
const SMALL = [160, 240, 320, 480];

/** A responsive photo: the browser downloads only the size the screen needs (up to 4K on large, sharp screens). */
export default function Pic({ p, lang, size = "half", ratio, className = "", priority = false, alt }: { p: Photo; lang: Lang; size?: "full" | "half" | "small"; ratio?: number; className?: string; priority?: boolean; alt?: string }) {
  const widths = size === "full" ? FULL : size === "small" ? SMALL : HALF;
  const sizes = size === "full" ? "100vw" : size === "small" ? "140px" : "(max-width: 860px) 100vw, 50vw";
  const fallback = widths[Math.min(widths.length - 1, 3)];
  return (
    <img
      className={`pic ${className}`}
      src={photoUrl(p.id, fallback, ratio ? Math.round(fallback / ratio) : undefined)}
      srcSet={photoSrcSet(p.id, widths, ratio)}
      sizes={sizes}
      alt={alt ?? p[lang]}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={p.pos ? { objectPosition: p.pos } : undefined}
    />
  );
}

/** Page header with a full-width photo behind the title. */
export function PageHero({ p, lang, title, text }: { p: Photo; lang: Lang; title: string; text?: string }) {
  return (
    <section className="phero">
      <Pic p={p} lang={lang} size="full" priority alt="" />
      <div className="wrap phero-in">
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  );
}
