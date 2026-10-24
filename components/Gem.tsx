import { gemShades, type StoneType } from "@/lib/stones";

/** A faceted gemstone drawing in the stone's colours (a pearl is drawn round). */
export default function Gem({ t, className = "" }: { t: StoneType; className?: string }) {
  const [hi, mid, lo] = gemShades(t.color);
  const id = `gem-${t.id}`;
  if (t.kind === "pearl")
    return (
      <svg className={`gem ${className}`} viewBox="0 0 100 100" aria-hidden="true">
        <defs><radialGradient id={id} cx=".38" cy=".32" r=".75"><stop offset="0" stopColor={hi} /><stop offset=".55" stopColor={mid} /><stop offset="1" stopColor={lo} /></radialGradient></defs>
        <ellipse cx="50" cy="88" rx="26" ry="5" fill="#000" opacity=".18" />
        <circle cx="50" cy="50" r="34" fill={`url(#${id})`} />
        <ellipse cx="38" cy="36" rx="10" ry="6" fill="#fff" opacity=".85" transform="rotate(-30 38 36)" />
      </svg>
    );
  return (
    <svg className={`gem ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={hi} /><stop offset=".5" stopColor={mid} /><stop offset="1" stopColor={lo} /></linearGradient>
      </defs>
      <ellipse cx="50" cy="92" rx="24" ry="4" fill="#000" opacity=".16" />
      {/* crown (top) */}
      <polygon points="12,38 28,18 72,18 88,38" fill={`url(#${id})`} />
      <polygon points="28,18 40,38 50,18" fill={hi} opacity=".75" />
      <polygon points="50,18 60,38 72,18" fill={mid} opacity=".55" />
      <polygon points="12,38 28,18 40,38" fill={mid} opacity=".8" />
      <polygon points="60,38 72,18 88,38" fill={lo} opacity=".55" />
      <polygon points="40,38 50,18 60,38" fill={hi} opacity=".5" />
      {/* pavilion (bottom) */}
      <polygon points="12,38 88,38 50,86" fill={mid} />
      <polygon points="12,38 40,38 50,86" fill={hi} opacity=".55" />
      <polygon points="40,38 60,38 50,86" fill={mid} opacity=".9" />
      <polygon points="60,38 88,38 50,86" fill={lo} opacity=".75" />
      <polyline points="12,38 28,18 72,18 88,38 50,86 12,38 88,38" fill="none" stroke={lo} strokeWidth="1.2" strokeLinejoin="round" opacity=".6" />
      <path className="gem-spark" d="M30 10 C31 15 32 16 37 17 C32 18 31 19 30 24 C29 19 28 18 23 17 C28 16 29 15 30 10Z" fill="#fff" />
    </svg>
  );
}
