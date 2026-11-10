// core.js — renderer, cena, câmera e helpers compartilhados do REDMAT Arcade.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const $ = (id) => document.getElementById(id);

// Espera as fontes da identidade (para os letreiros desenhados em canvas). Não trava se estiver offline.
await Promise.race([
  Promise.all([
    document.fonts.load('italic 900 60px "Playfair Display"'),
    document.fonts.load('800 40px "Montserrat"'),
    document.fonts.load('italic 900 60px "Montserrat"'),
    document.fonts.load('400 24px "Press Start 2P"')
  ]).catch(() => {}),
  new Promise((resolve) => setTimeout(resolve, 2000))
]);

export const FONT_TITLE = '"Playfair Display", Georgia, serif';
export const FONT_BODY = '"Montserrat", system-ui, sans-serif';
export const FONT_PIXEL = '"Press Start 2P", "Courier New", monospace';

// Paleta REDMAT
export const PAL = {
  night: 0x070d24, navy: 0x0b1f3f, navy2: 0x0e2a5e, wall: 0x14275c,
  cream: 0xfffde8, coral: 0xff4f4f, red: 0xff3b3b, cyan: 0x18e0ff,
  mint: 0x00f7bb, blue: 0x1877d6, sky: 0x5ba8c8, yellow: 0xffd54a
};
export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

export const sceneRoot = $('scene-container');
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140a2e);
scene.fog = new THREE.Fog(0x140a2e, 45, 95);

export const camera = new THREE.OrthographicCamera(-23, 23, 13, -13, 0.1, 140);
export const cameraOffset = new THREE.Vector3(13, 22, 25);
export const cameraTarget = new THREE.Vector3(0, 1.2, 0);
camera.position.copy(cameraTarget).add(cameraOffset);
camera.lookAt(cameraTarget);

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
// Modo leve: telas de toque, telas pequenas ou poucos núcleos -> menos luzes, sombra menor e menos crianças
export const LITE = window.matchMedia('(pointer:coarse)').matches || Math.min(window.innerWidth, window.innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);
export const maxAniso = renderer.capabilities.getMaxAnisotropy();

/* ------------------------------------------------------------------ helpers */
export const MAT = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .12, ...options });
export const BASIC = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity === 1 });
export const boxGeo = (x, y, z, r = .09) => new RoundedBoxGeometry(x, y, z, 3, r);
export function box(parent, x, y, z, w, h, d, material, radius = .07) {
  const mesh = new THREE.Mesh(radius ? boxGeo(w, h, d, radius) : new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
export function light(x, y, z, color, intensity = 2, distance = 12, essential = false) {
  if (LITE && !essential) return null;
  const l = new THREE.PointLight(color, intensity, distance, 2);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
export function cyl(parent, x, y, z, radius, height, material, segments = 18) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o;
}
export function sphere(parent, x, y, z, r, material, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), material);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; parent.add(o); return o;
}
export function plane(parent, x, y, z, width, height, material) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  o.position.set(x, y, z); parent.add(o); return o;
}
export function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}
export function fitFont(ctx, text, style, weight, family, maxW, startSize, minSize = 20) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 3;
  }
  return size;
}
export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}



/* ------------------------------------------------------------------ helpers extras */
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const UP = V3(0, 1, 0);
export const glowMat = (color, intensity = 1.2, extra = {}) => MAT(color, { emissive: color, emissiveIntensity: intensity, roughness: .35, metalness: .05, ...extra });

export function tube(parent, a, b, r, material, seg = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), material);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  m.castShadow = true; parent.add(m);
  return m;
}
export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
export function roundedRingGeo(w, h, r, t, depth) {
  const s = roundedRectShape(w, h, r);
  s.holes.push(roundedRectShape(w - 2 * t, h - 2 * t, Math.max(r - t, .01)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
}
export function archInto(p, w, h, y0 = 0) {
  const r = w / 2;
  p.moveTo(-r, y0); p.lineTo(-r, y0 + h - r);
  p.absarc(0, y0 + h - r, r, Math.PI, 0, true);
  p.lineTo(r, y0); p.lineTo(-r, y0);
  return p;
}
export function fitUV(geo, minX, minY, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - minX) / w, (p.getY(i) - minY) / h);
  uv.needsUpdate = true; return geo;
}
// deslocamento (para dentro) de um polígono de contorno, usado nos frisos neon laterais
export function offsetPoly(pts, d) {
  const n = pts.length; let area = 0;
  for (let i = 0; i < n; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n]; area += x1 * y2 - x2 * y1; }
  const s = area > 0 ? 1 : -1;
  const norm = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1; return [-dy / l * s, dx / l * s]; };
  return pts.map((p, i) => {
    const p0 = pts[(i - 1 + n) % n], p2 = pts[(i + 1) % n];
    const n1 = norm(p0[0], p0[1], p[0], p[1]), n2 = norm(p[0], p[1], p2[0], p2[1]);
    const k = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    return [p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k];
  });
}
export function polyShape(pts, holePts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  if (holePts) {
    const h = new THREE.Path();
    holePts.forEach(([x, y], i) => i ? h.lineTo(x, y) : h.moveTo(x, y)); h.closePath();
    s.holes.push(h);
  }
  return s;
}
export function outlinedText(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}


export const glowTexture = canvasTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
export const glareTexture = canvasTexture(256, 144, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.35, 'rgba(255,255,255,.16)'); g.addColorStop(.5, 'rgba(255,255,255,0)');
  g.addColorStop(.62, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

export function glowSprite(color, x, y, z, size, opacity = .5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s); return s;
}


/* ------------------------------------------------------------------ vista (zoom da roda + entrada suave) */
export const view = { zoom: 1, boost: .88, boostTarget: .88 };   // boost: aproximação da câmera ao entrar no fliperama
export function applyView() {
  const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
  const orthoHeight = (aspect < .78 ? 21.5 : aspect < 1.2 ? 22.5 : 24) / (view.zoom * view.boost);
  camera.left = -orthoHeight * aspect / 2; camera.right = orthoHeight * aspect / 2;
  camera.top = orthoHeight / 2; camera.bottom = -orthoHeight / 2;
  camera.updateProjectionMatrix();
}
export function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, LITE ? 1.25 : 1.8));
  applyView();
}
