"use client";
import { useEffect, useRef, useState } from "react";
import type { RingStyle } from "@/lib/ring3d";
import type { StoneLook } from "@/lib/stones";

type Scene = { setLook: (l: { style: RingStyle; metal: string; stone?: StoneLook }) => void; dispose: () => void };

/**
 * Live 3D ring: drag to turn it; the ring style, gold colour and stone update instantly.
 * The 3D code loads only when this is on screen. Until it's ready (or if the device can't show 3D),
 * the normal picture (`children`) stays visible.
 */
export default function Ring3D({ style, metal, stone, hint, children }: { style: RingStyle; metal: string; stone?: StoneLook; hint: string; children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const look = useRef({ style, metal, stone });
  look.current = { style, metal, stone };
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    let alive = true;
    const el = host.current;
    if (!el) return;
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return; // no 3D on this device: keep the picture
    } catch { return; }
    import("./scene").then(({ createRingScene }) => {
      if (!alive || !host.current) return;
      try {
        const s = createRingScene(host.current, () => setMoved(true));
        s.setLook(look.current);
        scene.current = s;
        requestAnimationFrame(() => alive && setReady(true));
      } catch (e) { console.error("3D ring unavailable", e); }
    });
    return () => { alive = false; scene.current?.dispose(); scene.current = null; };
  }, []);

  const stoneKey = stone ? JSON.stringify(stone) : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scene.current?.setLook({ style, metal, stone }); }, [style, metal, stoneKey]);

  return (
    <div className={`ring3d${ready ? " ready" : ""}`}>
      <div className="ring3d-fallback" aria-hidden={ready}>{children}</div>
      <div className="ring3d-canvas" ref={host} role="img" aria-label={hint} />
      {ready && !moved && <span className="ring3d-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h16M4 12l3-3M4 12l3 3M20 12l-3-3M20 12l-3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>{hint}</span>}
    </div>
  );
}
