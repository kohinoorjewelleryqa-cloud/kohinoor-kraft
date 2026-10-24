// Real-time 3D ring, built entirely in code with three.js (loaded only on pages that show a 3D ring).
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { RingStyle } from "@/lib/ring3d";
import type { StoneLook } from "@/lib/stones";

export type RingLook = { style: RingStyle; metal: string; stone?: StoneLook };
const CLEAR: StoneLook = { color: "#FBFBFF", ior: 2.15, dispersion: 6, pearl: false, clear: true };

// Ring size in millimetres (about size 16): inner radius, then the band's width and thickness.
const R_IN = 8.6;

/** A ring band whose width and thickness can taper towards the top, with a soft rounded profile. */
function shank(wBottom: number, wTop: number, tBottom: number, tTop: number, p = 3.2) {
  const SEG = 220, PROF = 28;
  const pos: number[] = [], idx: number[] = [];
  const sp = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i <= SEG; i++) {
    const th = (i / SEG) * Math.PI * 2;
    const k = Math.pow((1 + Math.cos(th)) / 2, 3); // 1 at the top, 0 at the bottom
    const w = wBottom + (wTop - wBottom) * k, t = tBottom + (tTop - tBottom) * k;
    const ux = Math.sin(th), uy = Math.cos(th);
    const rc = R_IN + t / 2;
    for (let j = 0; j <= PROF; j++) {
      const ph = (j / PROF) * Math.PI * 2;
      const ax = (w / 2) * sp(Math.cos(ph), 2 / p);
      const rd = (t / 2) * sp(Math.sin(ph), 2 / p);
      const r = rc + rd;
      pos.push(ux * r, uy * r, ax);
    }
  }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < PROF; j++) {
    const a = i * (PROF + 1) + j, b = a + PROF + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A faceted stone: a lathe profile turned with few segments gives crisp facets. */
function stoneGeo(kind: "round" | "step" | "princess", r: number) {
  const P = (x: number, y: number) => new THREE.Vector2(Math.max(x, 0.0001), y);
  let pts: THREE.Vector2[], seg: number, start: number;
  if (kind === "round") {
    const pav = r * 0.86, cr = r * 0.32;
    pts = [P(0, -pav), P(r * 0.55, -pav * 0.52), P(r, -0.03), P(r, 0.03), P(r * 0.82, cr * 0.55), P(r * 0.56, cr), P(0, cr)];
    seg = 16; start = 0;
  } else if (kind === "step") {
    const pav = r * 0.72, cr = r * 0.3;
    pts = [P(0, -pav), P(r * 0.36, -pav * 0.8), P(r * 0.7, -pav * 0.42), P(r, -0.03), P(r, 0.03), P(r * 0.88, cr * 0.45), P(r * 0.72, cr), P(0, cr)];
    seg = 8; start = Math.PI / 8;
  } else {
    const pav = r * 0.8, cr = r * 0.26;
    pts = [P(0, -pav), P(r * 0.5, -pav * 0.55), P(r, -0.03), P(r, 0.03), P(r * 0.8, cr), P(0, cr)];
    seg = 4; start = Math.PI / 4;
  }
  const g = new THREE.LatheGeometry(pts, seg, start);
  return g.toNonIndexed(); // separate faces = sharp facets
}

/** A prong: a thin tapered wire from the band up and over the stone's edge, with a rounded tip. */
function prong(from: THREE.Vector3, mid: THREE.Vector3, to: THREE.Vector3, rad: number, mat: THREE.Material) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, rad, 10, false), mat));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(rad * 1.18, 16, 12), mat);
  tip.position.copy(to);
  g.add(tip);
  return g;
}

export function createRingScene(host: HTMLElement, onFirstMove: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#EEEBE5");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(10, 30, 20); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(-20, 10, -15); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);
  camera.position.set(50, 30, 42); // three-quarter view from above, like a studio shot
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0); // a little low, so the ring sits above the pickers
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 45; controls.maxDistance = 120;
  controls.autoRotate = true; controls.autoRotateSpeed = 1.4;
  let idleTimer = 0 as unknown as ReturnType<typeof setTimeout>;
  let touched = false;
  controls.addEventListener("start", () => {
    controls.autoRotate = false; clearTimeout(idleTimer);
    if (!touched) { touched = true; onFirstMove(); }
  });
  controls.addEventListener("end", () => { idleTimer = setTimeout(() => (controls.autoRotate = true), 4000); });

  // soft contact shadow under the ring
  const sc = document.createElement("canvas"); sc.width = sc.height = 128;
  const cx = sc.getContext("2d")!;
  const grd = cx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, "rgba(20,25,35,.38)"); grd.addColorStop(1, "rgba(20,25,35,0)");
  cx.fillStyle = grd; cx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -R_IN - 2.2;
  scene.add(shadow);

  const metalMat = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.16, color: "#F0C25C", envMapIntensity: 1.25, clearcoat: 0.4, clearcoatRoughness: 0.08 });
  const stoneMat = new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0, transmission: 1, thickness: 3, ior: 2.42, specularIntensity: 1, envMapIntensity: 2.6, flatShading: true, color: "#FFFFFF" });
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: "#F4EEE3", roughness: 0.22, sheen: 1, sheenColor: new THREE.Color("#FFE8F2"), iridescence: 0.5, clearcoat: 1, envMapIntensity: 1.2 });
  const targetMetal = new THREE.Color("#F0C25C");
  const targetStone = new THREE.Color("#FFFFFF");

  const ring = new THREE.Group();
  scene.add(ring);
  let style: RingStyle | null = null;
  let pearl = false;
  let pop = 1; // grows from 0.9 to 1 when the style changes

  function clear(g: THREE.Object3D) {
    g.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    g.clear();
  }

  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  let geoCache = new Map<string, THREE.BufferGeometry>();
  /** One shared geometry per stone shape and size, so rings with many stones stay light. */
  const stoneGeom = (shape: "round" | "step" | "princess", r: number) => {
    const k = `${pearl ? "pearl" : shape}:${r}`;
    if (!geoCache.has(k)) geoCache.set(k, pearl ? new THREE.SphereGeometry(r * 0.92, 40, 28) : stoneGeo(shape, r));
    return geoCache.get(k)!;
  };
  const stone = (shape: "round" | "step" | "princess", r: number) => new THREE.Mesh(stoneGeom(shape, r), pearl ? pearlMat : stoneMat);

  /** A round stone held by claws. Local coordinates: y = 0 is the top of the band, the stone's widest point is at `rise`. */
  function clawHead(r: number, n: number, rise: number, opts: { long?: number; turn?: number; base?: number } = {}) {
    const { long = 1, turn = 0, base = 0.9 } = opts;
    const h = new THREE.Group();
    const k = Math.min(1, Math.max(0.62, r / 3.25));
    const st = stone("round", r);
    st.position.y = rise + (pearl ? r * 0.2 : 0);
    if (long !== 1) st.scale.set(1, 1, long);
    h.add(st);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + turn;
      const ca = Math.cos(a), sa = Math.sin(a) * long;
      h.add(prong(V(ca * base, -0.3, sa * base), V(ca * (r + 0.05), rise - 1.2 * k, sa * (r + 0.05)), V(ca * r * 0.93, rise + r * 0.3, sa * r * 0.93), 0.3 * k, metalMat));
    }
    const basket = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, 0.22 * k, 10, 48), metalMat);
    basket.rotation.x = Math.PI / 2; basket.position.y = rise - 1.4 * k; basket.scale.set(1, long, 1);
    h.add(basket);
    return h;
  }

  /** Stones set side by side into the outside of a band, from angle a0 to a1 (0 = top). */
  function channel(rOut: number, r: number, a0: number, a1: number, full: boolean) {
    const g = new THREE.Group();
    const step = (2 * r + 0.32) / rOut;
    const n = full ? Math.floor((Math.PI * 2) / step) : Math.floor((a1 - a0) / step) + 1;
    const da = full ? (Math.PI * 2) / n : step;
    const start = full ? 0 : -((n - 1) * da) / 2;
    const bead = new THREE.SphereGeometry(0.24, 10, 8);
    for (let i = 0; i < n; i++) {
      const th = start + i * da;
      const st = stone("round", r);
      st.position.set(Math.sin(th) * (rOut + 0.22), Math.cos(th) * (rOut + 0.22), 0);
      st.rotation.z = -th;
      g.add(st);
      if (!full && i === n - 1) continue;
      const tb = th + da / 2;
      for (const z of [-1, 1]) {
        const b = new THREE.Mesh(bead, metalMat);
        b.position.set(Math.sin(tb) * (rOut + 0.42), Math.cos(tb) * (rOut + 0.42), z * r * 0.72);
        g.add(b);
      }
    }
    return g;
  }

  /** Two gold strands twisted round each other. */
  function twistBand() {
    const g = new THREE.Group();
    const rm = R_IN + 0.95, amp = 0.55, turns = 14, N = 480;
    for (const ph of [0, Math.PI]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < N; i++) {
        const th = (i / N) * Math.PI * 2, w = turns * th + ph;
        const r = rm + amp * Math.cos(w);
        pts.push(V(Math.sin(th) * r, Math.cos(th) * r, amp * 1.25 * Math.sin(w)));
      }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 900, 0.74, 14, true), metalMat));
    }
    return g;
  }

  function build(s: RingStyle) {
    clear(ring);
    geoCache.forEach((g) => g.dispose());
    geoCache = new Map();
    const floor = (t: number) => { shadow.position.y = -R_IN - t - 0.05; };

    // ---- bands ----
    if (s === "band") { ring.add(new THREE.Mesh(shank(3.6, 3.6, 1.8, 1.8, 2.4), metalMat)); floor(1.8); return; }
    if (s === "flatband") { ring.add(new THREE.Mesh(shank(4.2, 4.2, 1.6, 1.6, 9), metalMat)); floor(1.6); return; }
    if (s === "twist") { ring.add(twistBand()); floor(1.9); return; }
    if (s === "signet") {
      ring.add(new THREE.Mesh(shank(2.6, 5.4, 1.6, 2.6, 2.6), metalMat));
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.93, 1, 1, 72), metalMat);
      face.scale.set(3.1, 1.3, 3.8); face.position.y = R_IN + 2.15;
      ring.add(face);
      floor(1.6); return;
    }
    if (s === "eternity" || s === "halfeternity") {
      const full = s === "eternity";
      const t = full ? 1.9 : 1.75, w = full ? 3.0 : 2.7;
      ring.add(new THREE.Mesh(shank(w, w, t, t, 3.6), metalMat));
      ring.add(channel(R_IN + t, full ? 1.0 : 1.05, -1.0, 1.0, full));
      floor(t); return;
    }

    // ---- rings with a centre stone ----
    const tTop = 1.45, top = R_IN + tTop; // outside of the band at the top
    ring.add(new THREE.Mesh(s === "threestone" ? shank(2.3, 2.2, 1.7, tTop) : shank(2.3, 1.75, 1.7, tTop), metalMat));
    floor(1.7);
    const head = new THREE.Group();
    head.position.y = top; // inside the head, y = 0 is the top of the band
    const add = (m: THREE.Object3D) => head.add(m);
    const rise = 3.0; // height of the stone's widest point above the band

    if (s === "round" || s === "oval") {
      add(clawHead(3.25, 6, rise, { long: s === "oval" ? 1.38 : 1 }));
    } else if (s === "halo") {
      const r = 2.6;
      add(clawHead(r, 4, rise, { turn: Math.PI / 4 }));
      const hr = r + 0.95, count = 18;
      const plate = new THREE.Mesh(new THREE.TorusGeometry(hr, 0.62, 12, 64), metalMat);
      plate.rotation.x = Math.PI / 2; plate.position.y = rise - 0.25; plate.scale.set(1, 1, 0.55);
      add(plate);
      const beadG = new THREE.SphereGeometry(0.16, 8, 6);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const m = stone("round", 0.55);
        m.position.set(Math.cos(a) * hr, rise + 0.2, Math.sin(a) * hr);
        add(m);
        const bead = new THREE.Mesh(beadG, metalMat);
        const b = a + Math.PI / count;
        bead.position.set(Math.cos(b) * hr, rise + 0.32, Math.sin(b) * hr);
        add(bead);
      }
    } else if (s === "threestone") {
      add(clawHead(2.6, 4, 2.8, { turn: Math.PI / 4 }));
      const r = 1.75, ang = 4.75 / top;
      for (const side of [-1, 1]) {
        const h = clawHead(r, 4, 2.0, { turn: Math.PI / 4, base: 0.55 });
        const a = side * ang;
        h.position.set(Math.sin(a) * top, Math.cos(a) * top - top, 0);
        h.rotation.z = -a;
        add(h);
      }
    } else if (s === "bezel") {
      const r = 3.0, rb = 2.4;
      const st = stone("round", r); st.position.y = rb + (pearl ? r * 0.25 : 0); add(st);
      const P = (x: number, y: number) => new THREE.Vector2(x, y);
      const cup = new THREE.LatheGeometry([P(r * 0.5, -0.3), P(r * 0.62, -0.32), P(r + 0.42, rb - 1.1), P(r + 0.5, rb + 0.28), P(r + 0.14, rb + 0.42), P(r - 0.1, rb + 0.14), P(r - 0.1, rb - 0.55), P(r * 0.5, rb - 0.95), P(r * 0.5, -0.3)], 80);
      add(new THREE.Mesh(cup, metalMat));
    } else if (s === "cluster") {
      const rc = 1.55, rp = 1.15, rr = 2.9, rise2 = 1.35, n = 8;
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 1.6, 1.5, 64), metalMat);
      plate.position.y = rise2 - 0.95; add(plate);
      const c = stone("round", rc); c.position.y = rise2 + 0.15 + (pearl ? 0.4 : 0); add(c);
      const beadG = new THREE.SphereGeometry(0.27, 10, 8);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = stone("round", rp); p.position.set(Math.cos(a) * rr, rise2 + (pearl ? 0.3 : 0), Math.sin(a) * rr); add(p);
        const b = a + Math.PI / n;
        for (const rad of [2.05, 4.0]) {
          const bead = new THREE.Mesh(beadG, metalMat);
          bead.position.set(Math.cos(b) * rad, rise2 + 0.3, Math.sin(b) * rad); add(bead);
        }
      }
    } else {
      // step-cut (emerald / east-west) or princess: a rectangle or square held by four corner prongs
      const princess = s === "princess";
      const r = princess ? 3.1 : 2.75;
      const st = stone(princess ? "princess" : "step", r);
      st.position.y = rise;
      const long = princess ? 1 : 1.42;
      if (s === "emerald") st.scale.set(1, 1, long); // long side along the finger
      if (s === "eastwest") st.scale.set(long, 1, 1); // long side across the finger
      add(st);
      // prongs sit on the stone's cut corners: 0.653 of the radius for the octagon (step cut), 0.707 for the square
      const k = princess ? 0.707 : 0.653;
      const hx = (s === "eastwest" ? long : 1) * r * k, hz = (s === "emerald" ? long : 1) * r * k;
      const tipY = rise + r * (princess ? 0.2 : 0.24);
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        add(prong(V(sx * 0.9, -0.3, sz * 0.9), V(sx * (hx + 0.25), rise - 1.1, sz * (hz + 0.25)), V(sx * hx * 0.93, tipY, sz * hz * 0.93), 0.3, metalMat));
      }
      // a square rail under the stone (a 4-sided ring, turned flat and stretched to the stone's shape)
      const rg = new THREE.TorusGeometry(1, 0.2, 8, 4).rotateZ(Math.PI / 4).rotateX(Math.PI / 2);
      const rail = new THREE.Mesh(rg, metalMat);
      rail.scale.set((hx * 0.85) / Math.SQRT1_2, 1, (hz * 0.85) / Math.SQRT1_2); rail.position.y = rise - 1.3;
      add(rail);
    }
    ring.add(head);
  }

  function setLook(l: RingLook) {
    const look = l.stone ?? CLEAR; // no stone chosen: show a clear stone
    const wasPearl = pearl;
    pearl = !!look.pearl;
    targetMetal.set(l.metal);
    if (!pearl) {
      targetStone.set(look.color);
      stoneMat.ior = look.ior;
      stoneMat.dispersion = look.dispersion;
      // coloured stones: tint the light passing through them
      stoneMat.attenuationColor.set(look.color);
      stoneMat.attenuationDistance = look.clear ? Infinity : 2.2;
    }
    if (l.style !== style || wasPearl !== pearl) { style = l.style; build(l.style); pop = 0.9; }
  }

  let w = 0, h = 0;
  const resize = () => {
    const nw = host.clientWidth, nh = host.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    // keep the whole ring in view on narrow screens
    const d = w / h < 1.05 ? 68 / Math.max(0.6, w / h / 1.05) : 68;
    camera.position.sub(controls.target).setLength(d).add(controls.target);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  let visible = true, raf = 0, last = performance.now();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }, { threshold: 0.01 });
  io.observe(host);
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    metalMat.color.lerp(targetMetal, Math.min(1, dt * 6));
    stoneMat.color.lerp(targetStone, Math.min(1, dt * 6));
    if (pop < 1) { pop = Math.min(1, pop + dt * 0.5); const e = 1 - Math.pow(1 - (pop - 0.9) / 0.1, 3); ring.scale.setScalar(0.9 + 0.1 * e); }
    controls.update();
    renderer.render(scene, camera);
  }
  loop();

  return {
    setLook,
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clearTimeout(idleTimer);
      controls.dispose(); clear(ring); geoCache.forEach((g) => g.dispose()); pmrem.dispose(); renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
