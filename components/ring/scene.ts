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
function shank(wBottom: number, wTop: number, tBottom: number, tTop: number) {
  const SEG = 220, PROF = 28, p = 3.2;
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

  function build(s: RingStyle) {
    clear(ring);
    const stoneM = pearl ? pearlMat : stoneMat;
    if (s === "band") {
      ring.add(new THREE.Mesh(shank(3.6, 3.6, 1.8, 1.8), metalMat));
      shadow.position.y = -R_IN - 1.8 - 0.05;
      return;
    }
    const tTop = 1.45, top = R_IN + tTop; // outside of the band at the top
    ring.add(new THREE.Mesh(shank(2.3, 1.75, 1.7, tTop), metalMat));
    shadow.position.y = -R_IN - 1.7 - 0.05;

    const head = new THREE.Group();
    const gy = top + 3.0; // height of the stone's girdle
    const add = (m: THREE.Object3D) => head.add(m);
    if (s === "round" || s === "oval" || s === "halo") {
      const r = s === "halo" ? 2.6 : 3.25;
      const g = pearl ? new THREE.SphereGeometry(r * 0.95, 48, 32) : stoneGeo("round", r);
      const st = new THREE.Mesh(g, stoneM);
      st.position.y = gy + (pearl ? r * 0.2 : 0);
      if (s === "oval") st.scale.set(1, 1, 1.38);
      add(st);
      const sz = s === "oval" ? 1.38 : 1;
      const n = s === "halo" ? 4 : 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (n === 4 ? Math.PI / 4 : 0);
        const ca = Math.cos(a), sa = Math.sin(a) * sz;
        add(prong(new THREE.Vector3(ca * 0.9, top - 0.3, sa * 0.9), new THREE.Vector3(ca * (r + 0.05), gy - 1.2, sa * (r + 0.05)), new THREE.Vector3(ca * r * 0.93, gy + r * 0.3, sa * r * 0.93), 0.3, metalMat));
      }
      const basket = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, 0.22, 10, 48), metalMat);
      basket.rotation.x = Math.PI / 2; basket.position.y = gy - 1.4; basket.scale.set(1, sz, 1);
      add(basket);
      if (s === "halo") {
        const hr = r + 0.95, count = 18;
        const plate = new THREE.Mesh(new THREE.TorusGeometry(hr, 0.62, 12, 64), metalMat);
        plate.rotation.x = Math.PI / 2; plate.position.y = gy - 0.25; plate.scale.set(1, 1, 0.55);
        add(plate);
        const small = pearl ? new THREE.SphereGeometry(0.5, 16, 12) : stoneGeo("round", 0.55);
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const m = new THREE.Mesh(small, s === "halo" && !pearl ? stoneMat : stoneM);
          m.position.set(Math.cos(a) * hr, gy + 0.2, Math.sin(a) * hr);
          add(m);
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), metalMat);
          const b = a + Math.PI / count;
          bead.position.set(Math.cos(b) * hr, gy + 0.32, Math.sin(b) * hr);
          add(bead);
        }
      }
    } else {
      // step-cut (emerald / east-west) or princess: a rectangle or square held by four corner prongs
      const princess = s === "princess";
      const r = princess ? 3.1 : 2.75;
      const g = pearl ? new THREE.SphereGeometry(r * 0.9, 48, 32) : stoneGeo(princess ? "princess" : "step", r);
      const st = new THREE.Mesh(g, stoneM);
      st.position.y = gy;
      const long = princess ? 1 : 1.42;
      if (s === "emerald") st.scale.set(1, 1, long); // long side along the finger
      if (s === "eastwest") st.scale.set(long, 1, 1); // long side across the finger
      add(st);
      // prongs sit on the stone's cut corners: 0.653 of the radius for the octagon (step cut), 0.707 for the square
      const k = princess ? 0.707 : 0.653;
      const hx = (s === "eastwest" ? long : 1) * r * k, hz = (s === "emerald" ? long : 1) * r * k;
      const tipY = gy + r * (princess ? 0.2 : 0.24);
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        add(prong(new THREE.Vector3(sx * 0.9, top - 0.3, sz * 0.9), new THREE.Vector3(sx * (hx + 0.25), gy - 1.1, sz * (hz + 0.25)), new THREE.Vector3(sx * hx * 0.93, tipY, sz * hz * 0.93), 0.3, metalMat));
      }
      // a square rail under the stone (a 4-sided ring, turned flat and stretched to the stone's shape)
      const rg = new THREE.TorusGeometry(1, 0.2, 8, 4).rotateZ(Math.PI / 4).rotateX(Math.PI / 2);
      const rail = new THREE.Mesh(rg, metalMat);
      rail.scale.set((hx * 0.85) / Math.SQRT1_2, 1, (hz * 0.85) / Math.SQRT1_2); rail.position.y = gy - 1.3;
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
      controls.dispose(); clear(ring); pmrem.dispose(); renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
