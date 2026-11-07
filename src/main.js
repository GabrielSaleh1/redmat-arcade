// REDMAT Arcade 0.6 — lobby 3D fiel ao conceito (noite arroxeada, tijolo, neon).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MACHINES } from './machines.js';

const $ = (id) => document.getElementById(id);

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

const FONT_TITLE = '"Playfair Display", Georgia, serif';
const FONT_BODY = '"Montserrat", system-ui, sans-serif';
const FONT_PIXEL = '"Press Start 2P", "Courier New", monospace';

// Paleta REDMAT
const PAL = {
  night: 0x070d24, navy: 0x0b1f3f, navy2: 0x0e2a5e, wall: 0x14275c,
  cream: 0xfffde8, coral: 0xff4f4f, red: 0xff3b3b, cyan: 0x18e0ff,
  mint: 0x00f7bb, blue: 0x1877d6, sky: 0x5ba8c8, yellow: 0xffd54a
};
const hex = (n) => '#' + n.toString(16).padStart(6, '0');

const sceneRoot = $('scene-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140a2e);
scene.fog = new THREE.Fog(0x140a2e, 45, 95);

const camera = new THREE.OrthographicCamera(-23, 23, 13, -13, 0.1, 140);
const cameraOffset = new THREE.Vector3(13, 22, 25);
const cameraTarget = new THREE.Vector3(0, 1.2, 0);
camera.position.copy(cameraTarget).add(cameraOffset);
camera.lookAt(cameraTarget);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneRoot.appendChild(renderer.domElement);
const maxAniso = renderer.capabilities.getMaxAnisotropy();

/* ------------------------------------------------------------------ helpers */
const MAT = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .12, ...options });
const BASIC = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity === 1 });
const boxGeo = (x, y, z, r = .09) => new RoundedBoxGeometry(x, y, z, 3, r);
function box(parent, x, y, z, w, h, d, material, radius = .07) {
  const mesh = new THREE.Mesh(radius ? boxGeo(w, h, d, radius) : new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function light(x, y, z, color, intensity = 2, distance = 12) {
  const l = new THREE.PointLight(color, intensity, distance, 2);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
function cyl(parent, x, y, z, radius, height, material, segments = 18) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o;
}
function sphere(parent, x, y, z, r, material, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), material);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; parent.add(o); return o;
}
function plane(parent, x, y, z, width, height, material) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  o.position.set(x, y, z); parent.add(o); return o;
}
function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}
function fitFont(ctx, text, style, weight, family, maxW, startSize, minSize = 20) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 3;
  }
  return size;
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}


/* ------------------------------------------------------------------ luz */
// Ambiente: noite arroxeada com neon (conceito.webp). Sem pontos de luz colados nas máquinas.
scene.add(new THREE.HemisphereLight(0xd9c6ff, 0x34195e, 1.6));
const sun = new THREE.DirectionalLight(0xeadfff, 2.0);
sun.position.set(5, 24, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -24; sun.shadow.camera.right = 24;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;   // era .045: com chapas finas a luz "vazava" para dentro das máquinas
scene.add(sun);

/* ------------------------------------------------------------------ helpers extras */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const glowMat = (color, intensity = 1.2, extra = {}) => MAT(color, { emissive: color, emissiveIntensity: intensity, roughness: .35, metalness: .05, ...extra });

function tube(parent, a, b, r, material, seg = 10) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), material);
  m.position.copy(a).addScaledVector(dir, .5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  m.castShadow = true; parent.add(m);
  return m;
}
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function roundedRingGeo(w, h, r, t, depth) {
  const s = roundedRectShape(w, h, r);
  s.holes.push(roundedRectShape(w - 2 * t, h - 2 * t, Math.max(r - t, .01)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
}
function archInto(p, w, h, y0 = 0) {
  const r = w / 2;
  p.moveTo(-r, y0); p.lineTo(-r, y0 + h - r);
  p.absarc(0, y0 + h - r, r, Math.PI, 0, true);
  p.lineTo(r, y0); p.lineTo(-r, y0);
  return p;
}
function fitUV(geo, minX, minY, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - minX) / w, (p.getY(i) - minY) / h);
  uv.needsUpdate = true; return geo;
}
// deslocamento (para dentro) de um polígono de contorno, usado nos frisos neon laterais
function offsetPoly(pts, d) {
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
function polyShape(pts, holePts) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  if (holePts) {
    const h = new THREE.Path();
    holePts.forEach(([x, y], i) => i ? h.lineTo(x, y) : h.moveTo(x, y)); h.closePath();
    s.holes.push(h);
  }
  return s;
}
function outlinedText(ctx, text, x, y, fill, stroke, lw) {
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

/* ------------------------------------------------------------------ texturas */
const glowTexture = canvasTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
const glareTexture = canvasTexture(256, 144, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.35, 'rgba(255,255,255,.16)'); g.addColorStop(.5, 'rgba(255,255,255,0)');
  g.addColorStop(.62, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});
function glowSprite(color, x, y, z, size, opacity = .5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s); return s;
}

function labelTexture(lines, { width = 900, height = 230, background = '#0f1b45', accent = '#ffd54a', fontSize = 90, alt = '#ffffff' } = {}) {
  return canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = accent; ctx.lineWidth = 16; ctx.strokeRect(9, 9, width - 18, height - 18);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const arr = Array.isArray(lines) ? lines : [lines];
    const lineH = fontSize * 1.08;
    arr.forEach((s, i) => {
      const size = fitFont(ctx, s, 'italic', 900, FONT_TITLE, width - 90, fontSize);
      ctx.font = `italic 900 ${size}px ${FONT_TITLE}`;
      const y = height / 2 + (i - (arr.length - 1) / 2) * lineH;
      ctx.shadowColor = accent; ctx.shadowBlur = 16; ctx.fillStyle = i === 0 ? alt : accent; ctx.fillText(s, width / 2, y);
    });
  });
}

function splitTitle(text) {
  const words = text.split(' ');
  if (words.length < 2 || text.length <= 11) return [text];
  let best = 1, diff = 1e9;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < diff) { diff = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
function marqueeTexture(title, neon) {
  return canvasTexture(1024, 340, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a1450'); g.addColorStop(1, '#0a0824');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const rg = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * .55);
    rg.addColorStop(0, neon + '55'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = neon; ctx.lineWidth = 10; ctx.shadowColor = neon; ctx.shadowBlur = 24;
    rrect(ctx, 12, 12, w - 24, h - 24, 30); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff6b6b'; ctx.font = `400 22px ${FONT_PIXEL}`; ctx.fillText('REDMAT ARCADE', w / 2, 46);
    const lines = splitTitle(title.toUpperCase());
    const maxSize = lines.length === 1 ? 150 : 104;
    const top = 78, bottom = h - 28, lh = (bottom - top) / lines.length;
    lines.forEach((s, i) => {
      const size = fitFont(ctx, s, 'italic', 900, FONT_BODY, w - 140, maxSize, 36);
      ctx.font = `italic 900 ${size}px ${FONT_BODY}`;
      ctx.shadowColor = neon; ctx.shadowBlur = 26;
      outlinedText(ctx, s, w / 2, top + lh * (i + .5), i === 0 ? '#ffffff' : '#ffe25a', '#0a0824', 14);
    });
  });
}

function chalkTexture() {
  return canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#123a4c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = ['ESCOLHA UM', 'JOGO E APRENDA', 'JOGANDO!'];
    lines.forEach((s, i) => {
      const size = fitFont(ctx, s, 'italic', 900, FONT_TITLE, w - 90, i === 2 ? 96 : 76);
      ctx.font = `italic 900 ${size}px ${FONT_TITLE}`;
      ctx.fillStyle = i === 2 ? '#ffd54a' : '#fffde8';
      ctx.fillText(s, w / 2, 130 + i * 110);
    });
    ctx.fillStyle = '#5ba8c8'; ctx.font = `italic 900 64px ${FONT_TITLE}`; ctx.fillText('π  √x  ∑', w / 2, 450);
  });
}

function bannerTexture() {
  return canvasTexture(480, 860, (ctx, w, h) => {
    ctx.fillStyle = '#fffde8'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff4f4f'; ctx.fillRect(0, 0, w, 130);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fffde8'; ctx.font = `italic 900 70px ${FONT_TITLE}`; ctx.fillText('REDMAT', w / 2, 68);
    const items = ['Matemática', 'Estratégia', 'Lógica', 'Financeira', 'e muito mais!'];
    items.forEach((s, i) => {
      const y = 230 + i * 118;
      if (i < 4) {
        ctx.strokeStyle = '#ff4f4f'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(48, y); ctx.lineTo(74, y + 26); ctx.lineTo(118, y - 28); ctx.stroke();
      }
      ctx.fillStyle = '#0b1f3f'; ctx.textAlign = 'left';
      const size = fitFont(ctx, s, 'italic', 900, FONT_TITLE, 300, 54);
      ctx.font = `italic 900 ${size}px ${FONT_TITLE}`;
      ctx.fillText(s, i < 4 ? 142 : 60, y);
    });
  });
}

// piso: tabuleiro lilás do conceito
function floorTextureBuild() {
  return canvasTexture(256, 256, (ctx) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      ctx.fillStyle = (i + j) % 2 ? '#5b4b8c' : '#7868a8';
      ctx.fillRect(i * 128, j * 128, 128, 128);
      const g = ctx.createLinearGradient(i * 128, j * 128, i * 128 + 128, j * 128 + 128);
      g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.10)');
      ctx.fillStyle = g; ctx.fillRect(i * 128, j * 128, 128, 128);
      ctx.strokeStyle = 'rgba(30,14,70,.55)'; ctx.lineWidth = 4; ctx.strokeRect(i * 128 + 2, j * 128 + 2, 124, 124);
    }
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  });
}
function brickTextureBuild() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#26102f'; ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, bh = h / rows, bw = w / cols;
    const palette = ['#6e3c63', '#7a4268', '#64355c', '#704070', '#5a3358', '#7d476c'];
    for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
      const x = c * bw + (r % 2) * bw / 2 + 3, y = r * bh + 3;
      ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillRect(x, y, bw - 6, bh - 6);
      ctx.fillStyle = 'rgba(255,200,230,.08)'; ctx.fillRect(x, y, bw - 6, 4);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x, y + bh - 10, bw - 6, 4);
    }
  });
}
function nightSkyTexture() {
  return canvasTexture(512, 768, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#140a44'); g.addColorStop(.55, '#4a2a86'); g.addColorStop(.85, '#c0488f'); g.addColorStop(1, '#ff9a6a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${.35 + Math.random() * .6})`; ctx.fillRect(Math.random() * w, Math.random() * h * .55, 2, 2); }
    const mg = ctx.createRadialGradient(380, 150, 10, 380, 150, 90);
    mg.addColorStop(0, 'rgba(255,243,201,1)'); mg.addColorStop(.4, 'rgba(255,243,201,.35)'); mg.addColorStop(1, 'rgba(255,243,201,0)');
    ctx.fillStyle = mg; ctx.fillRect(280, 50, 200, 200);
    ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(380, 150, 34, 0, Math.PI * 2); ctx.fill();
    let x = -10;
    while (x < w) {
      const bw = 38 + Math.random() * 52, bh = 120 + Math.random() * 260;
      ctx.fillStyle = '#1b0e3a'; ctx.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 14; wy < h - 16; wy += 22) for (let wx = x + 8; wx < x + bw - 12; wx += 16)
        if (Math.random() < .38) { ctx.fillStyle = '#ffd87a'; ctx.fillRect(wx, wy, 7, 10); }
      x += bw + 4;
    }
  });
}
function gamepadIcon(ctx, cx, cy, s, body, accent) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = body; ctx.strokeStyle = '#0a1030'; ctx.lineWidth = s * .08; ctx.lineJoin = 'round';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * .8, s * .42, s * .5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  rrect(ctx, -s * 1.15, -s * .58, s * 2.3, s * 1.16, s * .5); ctx.fill(); ctx.stroke();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * .8, s * .42, s * .42, 0, Math.PI * 2); ctx.fill(); }
  rrect(ctx, -s * 1.1, -s * .53, s * 2.2, s * 1.06, s * .46); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * .8, -s * .1, s * .52, s * .17); ctx.fillRect(-s * .63, -s * .27, s * .17, s * .52);
  const cols = ['#ff4f4f', '#ffd54a', accent, '#00f7bb'];
  [[0, -.2], [.2, 0], [0, .2], [-.2, 0]].forEach(([dx, dy], i) => { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(s * .66 + dx * s, -s * .02 + dy * s, s * .095, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}
function mainSignTexture() {
  return canvasTexture(2048, 700, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#171060'); bg.addColorStop(1, '#0a0a34');
    ctx.fillStyle = bg; rrect(ctx, 30, 30, w - 60, h - 60, 90); ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = '#3ad8ff'; ctx.shadowColor = '#3ad8ff'; ctx.shadowBlur = 38; rrect(ctx, 30, 30, w - 60, h - 60, 90); ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = '#ff5ad8'; ctx.shadowColor = '#ff5ad8'; ctx.shadowBlur = 24; rrect(ctx, 62, 62, w - 124, h - 124, 64); ctx.stroke();
    ctx.shadowBlur = 0;
    gamepadIcon(ctx, 270, 330, 120, '#2d7bff', '#18e0ff');
    gamepadIcon(ctx, w - 270, 330, 120, '#ffb02e', '#18e0ff');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `italic 900 196px ${FONT_BODY}`;
    ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 30;
    outlinedText(ctx, 'REDMAT', w / 2, 215, '#ffffff', '#ff3b3b', 26);
    const gy = ctx.createLinearGradient(0, 330, 0, 500); gy.addColorStop(0, '#fff27a'); gy.addColorStop(1, '#ff9a2e');
    ctx.shadowColor = '#ffb02e'; ctx.shadowBlur = 26;
    outlinedText(ctx, 'ARCADE', w / 2, 410, gy, '#6b1010', 24);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b1d5e'; ctx.strokeStyle = '#3ad8ff'; ctx.lineWidth = 5;
    rrect(ctx, w / 2 - 430, 538, 860, 78, 39); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9fe9ff'; ctx.font = `800 40px ${FONT_BODY}`; ctx.fillText('HUB DE JOGOS EDUCACIONAIS', w / 2, 578);
  });
}
function wallSignTexture() {
  return canvasTexture(768, 480, (ctx, w, h) => {
    ctx.fillStyle = '#0d2b4a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eaf7ff'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let x = 70; x <= w - 70; x += 6) { const y = 150 + Math.sin((x - 70) / (w - 140) * Math.PI * 4) * 70; if (x === 70) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.font = `italic 900 150px ${FONT_BODY}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const a = ctx.measureText('RED').width, b = ctx.measureText('MAT').width, x0 = w / 2 - (a + b) / 2;
    ctx.fillStyle = '#ff4f4f'; ctx.fillText('RED', x0, 330); ctx.fillStyle = '#ffffff'; ctx.fillText('MAT', x0 + a, 330);
    ctx.textAlign = 'center'; ctx.fillStyle = '#8fd8ff'; ctx.font = `700 34px ${FONT_BODY}`; ctx.fillText('UFF', w / 2, 425);
  });
}
function monitorTexture() {
  return canvasTexture(768, 440, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#10206b'); g.addColorStop(1, '#2a0f5c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80,200,255,.18)'; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `italic 900 120px ${FONT_TITLE}`; ctx.fillStyle = '#6fe9ff'; ctx.shadowColor = '#18e0ff'; ctx.shadowBlur = 24;
    ctx.fillText('π  √x', w * .34, 150); ctx.shadowBlur = 0;
    [[470, 70, '#18e0ff'], [545, 120, '#ff5ad8'], [620, 170, '#ffd54a'], [695, 230, '#00f7bb']].forEach(([x, bh, c]) => {
      ctx.fillStyle = c; ctx.fillRect(x - 24, h - 50 - bh, 48, bh);
    });
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(60, h - 90); ctx.lineTo(200, h - 150); ctx.lineTo(300, h - 120); ctx.lineTo(420, h - 230); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(396, h - 232); ctx.lineTo(424, h - 234); ctx.lineTo(414, h - 206); ctx.stroke();
  });
}
function neonGamepadTexture() {
  return canvasTexture(560, 360, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#d6a8ff'; ctx.shadowColor = '#a45bff'; ctx.shadowBlur = 36;
    rrect(ctx, 70, 80, 420, 170, 80); ctx.stroke();
    for (const cx of [150, 410]) { ctx.beginPath(); ctx.arc(cx, 240, 66, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(150, 130); ctx.lineTo(150, 190); ctx.moveTo(120, 160); ctx.lineTo(180, 160); ctx.stroke();
    for (const [x, y] of [[400, 130], [440, 160], [400, 190], [360, 160]]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke(); }
  });
}
function plazaTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#42195a'); g.addColorStop(.7, '#2b1148'); g.addColorStop(1, '#1c0c33');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 16; ctx.strokeStyle = '#ff4f6e'; ctx.shadowColor = '#ff4f6e'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 28, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#ff9ad0'; ctx.shadowColor = '#ff9ad0'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 78, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  });
}
function checkerTexture(cols, rows) {
  const tex = canvasTexture(256, 192, (ctx, w, h) => {
    const cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { ctx.fillStyle = (i + j) % 2 ? '#101018' : '#ffffff'; ctx.fillRect(i * cw, j * ch, cw, ch); }
  });
  return tex;
}
function dollarTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#a06a00'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(w / 2, h / 2, 108, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#8a5a00'; ctx.font = `900 170px ${FONT_BODY}`; ctx.fillText('$', w / 2, h / 2 + 8);
  });
}
function questionTexture() {
  return canvasTexture(384, 192, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 150px ${FONT_BODY}`;
    outlinedText(ctx, '???', w / 2, h / 2 + 6, '#ff3b3b', '#ffffff', 10);
  });
}


/* ------------------------------------------------------------------ cenário (conceito.webp) */
const ambientDecor = [];
const pulses = [];
const cabinets = [];
const PLANT_SPOTS = [[-4, 0], [4, 0], [-17.4, 2.8], [17.2, 1.5]];
const BENCH_SPOTS = [[-5.5, 0], [5.5, 0]];
const STAIRS = { x: -15.7, z: -1.4, half: 1.9 };

// piso lilás em tabuleiro + laje com friso neon (a sala "flutua" como no conceito)
const floorTexture = floorTextureBuild();
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(13, 8.67);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(39, 26), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .38, metalness: .1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -.07; scene.add(floor);
box(scene, 0, -.75, 0, 40.2, 1.3, 26.4, MAT(0x24113f, { roughness: .6 }), 0);
const neonPink = glowMat(0xff3da6, 1.6);
box(scene, 0, -.4, 13.22, 40.2, .1, .05, neonPink, 0);
box(scene, 20.12, -.4, 0, .05, .1, 26.4, neonPink, 0);
box(scene, 0, -.03, 13.0, 39, .06, .08, glowMat(0xff7ac8, 1.2), 0);
box(scene, 19.5, -.03, 0, .08, .06, 26, glowMat(0xff7ac8, 1.2), 0);

// grades de madeira com neon rosa na frente e na direita (lados abertos do diorama)
const woodRail = MAT(0xa4622f, { roughness: .55 });
const postMat = MAT(0x4a2a3f, { roughness: .6 });
const railNeon = glowMat(0xff4fb0, 1.4);
box(scene, 0, 1.0, 12.75, 38.6, .11, .17, woodRail, .04);
box(scene, 0, .6, 12.78, 38.6, .05, .05, railNeon, 0);
for (let x = -19; x <= 19.01; x += 3.8) box(scene, x, .5, 12.75, .16, 1.05, .16, postMat, .04);
box(scene, 19.3, 1.0, 0, .17, .11, 25.4, woodRail, .04);
box(scene, 19.27, .6, 0, .05, .05, 25.4, railNeon, 0);
for (let z = -12.6; z <= 12.7; z += 3.8) box(scene, 19.3, .5, z, .16, 1.05, .16, postMat, .04);

// paredes de tijolo (só a face voltada para dentro leva a textura)
const brickTex = brickTextureBuild();
brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.repeat.set(13, 3.42);
const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: .9, metalness: 0 });
const brickTexL = brickTex.clone(); brickTexL.repeat.set(8.77, 3.42); brickTexL.needsUpdate = true;
const brickMatL = new THREE.MeshStandardMaterial({ map: brickTexL, roughness: .9, metalness: 0 });
const trimMat = MAT(0x2a1740, { roughness: .7 });
const backWall = new THREE.Mesh(new THREE.BoxGeometry(39, 8.2, .6), [trimMat, trimMat, trimMat, trimMat, brickMat, trimMat]);
backWall.position.set(0, 4.1, -12.96); backWall.receiveShadow = true; scene.add(backWall);
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(.6, 8.2, 26.3), [brickMatL, trimMat, trimMat, trimMat, trimMat, trimMat]);
leftWall.position.set(-19.4, 4.1, -.11); leftWall.receiveShadow = true; scene.add(leftWall);
const WALL_Z = -12.66, WALL_X = -19.1;          // faces internas

const wainMat = MAT(0x2c1642, { roughness: .65 });
box(scene, 0, .62, WALL_Z + .08, 38.8, 1.24, .16, wainMat, .02);
box(scene, 0, 1.27, WALL_Z + .11, 38.9, .08, .24, woodRail, .02);
box(scene, 0, 1.34, WALL_Z + .2, 38.7, .04, .04, glowMat(0xff3da6, 1.3), 0);
box(scene, WALL_X + .08, .62, -.11, .16, 1.24, 26.2, wainMat, .02);
box(scene, WALL_X + .11, 1.27, -.11, .24, .08, 26.3, woodRail, .02);
box(scene, WALL_X + .2, 1.34, -.11, .04, .04, 26.2, glowMat(0xff3da6, 1.3), 0);

// vigas do teto (de onde pendem lâmpadas e plantas)
const beamMat = MAT(0x3a2418, { roughness: .7 });
// vigas finas e rentes à parede, acima de tudo: não escondem mais o letreiro nem as janelas
box(scene, 0, 8.05, -12.4, 38.8, .3, .6, beamMat, .04);
box(scene, -18.85, 8.05, -.1, .5, .3, 26.2, beamMat, .04);

/* ----- letreiro principal (neon) */
function neonSign({ x, y, z, w, h, tex, radius = .46 }) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const housing = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRectShape(w - .3, h - .3, radius), { depth: .25, bevelEnabled: false, curveSegments: 10 }), MAT(0x0c0f3a, { roughness: .5 }));
  housing.castShadow = true; g.add(housing);
  plane(g, 0, 0, .27, w, h, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  return g;
}
neonSign({ x: 0, y: 5.6, z: WALL_Z, w: 10.4, h: 3.56, tex: mainSignTexture() });
glowSprite(0x4aa8ff, 0, 5.6, WALL_Z + .6, 16, .16);

/* ----- painéis emoldurados (placa REDMAT, monitor de matemática) */
function framedPanel({ x, y, z, rotY = 0, w, h, tex, frameColor = 0xb5763a, neon = null, depth = .22 }) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
  const fw = .16;
  box(g, 0, 0, depth / 2, w + 2 * fw, h + 2 * fw, depth, MAT(frameColor, { roughness: .55 }), .05);
  plane(g, 0, 0, depth + .02, w, h, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  if (neon) {
    const ring = new THREE.Mesh(roundedRingGeo(w + 2 * fw + .06, h + 2 * fw + .06, .12, .05, .08), glowMat(neon, 1.4));
    ring.position.z = depth - .01; g.add(ring);
  }
  return g;
}
framedPanel({ x: -14, y: 5.85, z: WALL_Z, w: 3.2, h: 2.0, tex: wallSignTexture(), frameColor: 0x2b1d4e, neon: 0x3ad8ff });
framedPanel({ x: 16.6, y: 1.95, z: WALL_Z, w: 3.3, h: 1.89, tex: monitorTexture(), frameColor: 0x1d1650, neon: 0x7a6bff });

/* ----- janelas em arco com a noite da cidade */
const nightTex = nightSkyTexture();
const archWood = MAT(0xb5763a, { roughness: .55 });
const archCream = MAT(0xf3d9a8, { roughness: .5 });
function archWindow({ x, y, z, rotY = 0, w = 3.0, h = 4.8 }) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
  const t = .24, gw = w - 2 * t + .02, gh = h - 2 * t + .02, gy = t - .01;
  const gl = new THREE.ShapeGeometry(archInto(new THREE.Shape(), gw, gh, gy));
  fitUV(gl, -gw / 2, gy, gw, gh);
  const glass = new THREE.Mesh(gl, new THREE.MeshBasicMaterial({ map: nightTex, toneMapped: false }));
  glass.position.z = .03; g.add(glass);
  const fs = archInto(new THREE.Shape(), w, h, 0);
  fs.holes.push(archInto(new THREE.Path(), w - 2 * t, h - 2 * t, t));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: .26, bevelEnabled: false, curveSegments: 24 }), archWood);
  frame.castShadow = true; g.add(frame);
  box(g, 0, h / 2, .13, .09, h - 2 * t, .1, archCream, .02);
  box(g, 0, h * .4, .13, w - 2 * t, .09, .1, archCream, .02);
  box(g, 0, -.02, .26, w + .5, .14, .5, archWood, .03);
  return g;
}
archWindow({ x: WALL_X, y: 1.6, z: -8.2, rotY: Math.PI / 2 });

/* ----- escada + porta em arco na parede esquerda */
function doorTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1d0f3d'); g.addColorStop(.7, '#4a2470'); g.addColorStop(1, '#ff9a5c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
function archDoor({ x, y, z, rotY = 0, w = 2.2, h = 3.3 }) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
  const t = .22, gw = w - 2 * t + .02, gh = h - t + .01;
  const gl = new THREE.ShapeGeometry(archInto(new THREE.Shape(), gw, gh, 0));
  fitUV(gl, -gw / 2, 0, gw, gh);
  const inner = new THREE.Mesh(gl, new THREE.MeshBasicMaterial({ map: doorTexture(), toneMapped: false }));
  inner.position.z = .03; g.add(inner);
  const fs = archInto(new THREE.Shape(), w, h + .05, -.05);
  fs.holes.push(archInto(new THREE.Path(), w - 2 * t, h - t, 0));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: .24, bevelEnabled: false, curveSegments: 24 }), archWood);
  frame.castShadow = true; g.add(frame);
}
function staircase(z) {
  const g = new THREE.Group(); g.position.set(WALL_X, 0, z); scene.add(g);
  const n = 5, rise = .34, run = .66, wd = 3.2;
  const stepMat = MAT(0x4a2f70, { roughness: .6 });
  const nose = glowMat(0xff8a3d, 1.2);
  for (let k = 1; k <= n; k++) {
    const dist = (n - k) * run + run / 2;
    box(g, dist, k * rise / 2, 0, run, k * rise, wd, stepMat, .03);
    box(g, dist + run / 2 - .02, k * rise - .015, 0, .05, .04, wd, nose, 0);
  }
  const rail = glowMat(0xff8a3d, 1.1), handrail = MAT(0xa4622f, { roughness: .5 });
  for (const sz of [-1, 1]) {
    const zz = sz * (wd / 2 + .05);
    tube(g, V3(n * run, rise + .95, zz), V3(.15, n * rise + .95, zz), .045, handrail, 8);
    tube(g, V3(n * run, rise + .5, zz), V3(.15, n * rise + .5, zz), .02, rail, 6);
    for (const k of [1, 3, 5]) { const px = (n - k) * run + run / 2; tube(g, V3(px, k * rise, zz), V3(px, k * rise + .95, zz), .035, handrail, 8); }
  }
  light(WALL_X + 1.6, 2.6, z, 0xff9a4d, 10, 9);
}
staircase(-1.4);
archDoor({ x: WALL_X, y: 5 * .34, z: -1.4, rotY: Math.PI / 2 });

/* ----- controle neon roxo na parede esquerda */
const padSign = plane(scene, WALL_X + .03, 3.4, 5.6, 2.8, 1.8, new THREE.MeshBasicMaterial({ map: neonGamepadTexture(), transparent: true, toneMapped: false, depthWrite: false }));
padSign.rotation.y = Math.PI / 2;
glowSprite(0xa45bff, WALL_X + .4, 3.4, 5.6, 5, .28);
light(WALL_X + 1.8, 3.4, 5.6, 0xa56bff, 10, 9);

/* ----- estante com troféu (nicho em arco, canto direito) */
function bookshelfAlcove(x) {
  const g = new THREE.Group(); g.position.set(x, 3.1, WALL_Z); scene.add(g);
  const w = 3.8, h = 4.3, t = .2;
  const rg = new THREE.Mesh(new THREE.ShapeGeometry(archInto(new THREE.Shape(), w - 2 * t + .02, h - 2 * t + .02, t - .01)), MAT(0x1c0f33, { roughness: .9 }));
  rg.position.z = .03; rg.receiveShadow = true; g.add(rg);
  const fs = archInto(new THREE.Shape(), w, h, 0);
  fs.holes.push(archInto(new THREE.Path(), w - 2 * t, h - 2 * t, t));
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(fs, { depth: .3, bevelEnabled: false, curveSegments: 24 }), archWood);
  frame.castShadow = true; g.add(frame);
  const wood = MAT(0x7a4a2c, { roughness: .6 });
  const cols = [PAL.blue, PAL.coral, PAL.mint, PAL.yellow, PAL.sky, 0xff9bd0];
  [.2, 1.3, 2.35].forEach((sy, row) => {
    box(g, 0, sy, .42, 3.2, .1, .62, wood, .03);
    let bx = -1.4, i = 0;
    while (bx < 1.2 - (row === 2 ? 1.1 : 0)) {
      const bw = .14 + ((i * 7) % 3) * .05, bh = .5 + ((i * 5) % 4) * .08;
      box(g, bx + bw / 2, sy + .05 + bh / 2, .42, bw, bh, .36, MAT(cols[(i + row) % cols.length], { emissive: cols[(i + row) % cols.length], emissiveIntensity: .1 }), .015);
      bx += bw + .02; i++;
    }
  });
  const gold = MAT(0xffc83d, { emissive: 0xffa800, emissiveIntensity: .3, metalness: .6, roughness: .3 });
  box(g, 1.05, 2.45, .42, .5, .1, .4, wood, .02);
  cyl(g, 1.05, 2.65, .42, .07, .3, gold, 12);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.24, .12, .38, 18), gold); cup.position.set(1.05, 2.98, .42); cup.castShadow = true; g.add(cup);
  for (const sx of [-1, 1]) { const hd = new THREE.Mesh(new THREE.TorusGeometry(.12, .025, 8, 14), gold); hd.position.set(1.05 + sx * .27, 3.0, .42); g.add(hd); }
  cyl(g, -.9, 1.5, .42, .17, .22, MAT(PAL.coral, { roughness: .5 }), 14);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sphere(g, -.9 + Math.cos(a) * .12, 1.78, .42 + Math.sin(a) * .12, .12, MAT(i % 2 ? 0x2abf89 : 0x60d37d), .8, 1.5, .8); }
  light(x - .3, 4.6, WALL_Z + 1.8, 0xffc680, 12, 9);
}
bookshelfAlcove(16.6);

/* ----- lâmpadas pendentes (coral) e plantas penduradas */
function hangingLamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, 7.9, z); scene.add(g);
  tube(g, V3(0, 0, 0), V3(0, -1.55, 0), .03, MAT(0x2b2140, { metalness: .6, roughness: .4 }), 6);
  const hood = new THREE.Mesh(new THREE.ConeGeometry(.78, .62, 28, 1, true), MAT(PAL.coral, { roughness: .35, metalness: .2, side: THREE.DoubleSide }));
  hood.position.y = -1.9; hood.castShadow = true; g.add(hood);
  sphere(g, 0, -2.12, 0, .2, MAT(0xfff2c9, { emissive: 0xffe0a0, emissiveIntensity: 1.6 }));
  const halo = glowSprite(0xffc27a, x, 7.9 - 2.15, z, 3.8, .6);
  pulses.push({ mat: halo.material, base: .55, amp: .07, speed: 2.2, phase: x });
  light(x, 7.9 - 2.3, z + 1.2, 0xffb36b, 38, 16);
}
hangingLamp(-8.6, -12.0); hangingLamp(8.6, -12.0);

function hangingPlant(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const rope = MAT(0xd8c79a, { roughness: .9 });
  const top = 7.9 - y;
  for (const a of [0, 2.09, 4.19]) tube(g, V3(Math.cos(a) * .34, .05, Math.sin(a) * .34), V3(0, top, 0), .012, rope, 5);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.44, .3, .44, 18), MAT(PAL.coral, { roughness: .45 })); pot.position.y = -.1; pot.castShadow = true; g.add(pot);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; sphere(g, Math.cos(a) * .26, .2 + (i % 2) * .08, Math.sin(a) * .26, .2, MAT(i % 2 ? 0x2abf89 : 0x60d37d), .9, 1.3, .8); }
  for (let v = 0; v < 5; v++) {
    const a = v / 5 * Math.PI * 2 + .4, ox = Math.cos(a) * .42, oz = Math.sin(a) * .42, len = 3 + (v % 3);
    for (let i = 0; i < len; i++) sphere(g, ox, -.3 - i * .24, oz, .11 - i * .008, MAT(i % 2 ? 0x2abf89 : 0x4fd07f), 1, 1.4, 1);
  }
}
hangingPlant(-18.0, 6.4, -12.0); hangingPlant(-11.3, 6.9, -12.0); hangingPlant(11.8, 6.9, -12.0);

/* ----- praça central: plataforma REDMAT, bancos e vasos */
const PLAZA_Z = -1.2;          // centro do tapete (antes 0): mais para o fundo da sala
const plazaDisc = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), new THREE.MeshBasicMaterial({ map: plazaTexture(), toneMapped: false }));
plazaDisc.rotation.x = -Math.PI / 2; plazaDisc.position.set(0, .014, PLAZA_Z); scene.add(plazaDisc);
const plazaGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTexture, color: 0xff4fb0, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
plazaGlow.rotation.x = -Math.PI / 2; plazaGlow.position.set(0, .01, PLAZA_Z); scene.add(plazaGlow);
light(0, 2.4, PLAZA_Z + 1.0, 0xff5fb8, 14, 9);

// logo do projeto no centro do tapete (sobre uma placa creme, porque a logo tem letras pretas)
const logoTexture = new THREE.TextureLoader().load('./assets/logo-redmat.png');
logoTexture.colorSpace = THREE.SRGBColorSpace; logoTexture.anisotropy = maxAniso;
const plateTexture = canvasTexture(1024, 440, (ctx, w, h) => {
  ctx.fillStyle = '#fffde8'; rrect(ctx, 6, 6, w - 12, h - 12, 90); ctx.fill();
  ctx.strokeStyle = '#ff4f6e'; ctx.lineWidth = 14; rrect(ctx, 22, 22, w - 44, h - 44, 76); ctx.stroke();
});
const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.72), new THREE.MeshBasicMaterial({ map: plateTexture, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
plate.rotation.x = -Math.PI / 2; plate.position.set(0, .018, PLAZA_Z); scene.add(plate);
const plazaLogo = new THREE.Mesh(new THREE.PlaneGeometry(3.45, 1.154), new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
plazaLogo.rotation.x = -Math.PI / 2; plazaLogo.position.set(0, .022, PLAZA_Z); scene.add(plazaLogo);

function plant(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(g, 0, .43, 0, .42, .72, MAT(PAL.navy2), 12);
  cyl(g, 0, .82, 0, .32, .12, MAT(PAL.coral), 12);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 8), MAT(i % 2 ? 0x2abf89 : 0x60d37d));
    leaf.position.set(Math.cos(a) * .26, 1.05 + Math.sin(i * 3) * .07, Math.sin(a) * .26); leaf.scale.set(.9, 1.45, .75); leaf.castShadow = true; g.add(leaf);
  }
}
for (const [x, z] of PLANT_SPOTS) plant(x, z);
plant(-18.2, 12.0, 1.25); plant(18.2, 12.0, 1.25);

function bench(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  box(g, 0, .6, 0, 2.6, .36, .74, MAT(PAL.coral, { emissive: 0x4a1218, emissiveIntensity: .3 }), .15);
  box(g, 0, 1.02, -.3, 2.6, .55, .24, MAT(PAL.red), .07);
  for (const dx of [-1, 1]) box(g, dx, .24, 0, .16, .5, .6, MAT(PAL.cream, { metalness: .6 }), .03);
}
for (const [x, z] of BENCH_SPOTS) bench(x, z);

// placa de giz e banner (como no conceito)
const chalkG = new THREE.Group(); chalkG.position.set(-16.6, 0, 9.4); chalkG.rotation.y = .28; scene.add(chalkG);
box(chalkG, -.75, .8, -.25, .09, 1.7, .09, MAT(0x6b4328), .02).rotation.z = .08;
box(chalkG, .75, .8, -.25, .09, 1.7, .09, MAT(0x6b4328), .02).rotation.z = -.08;
box(chalkG, 0, 1.15, 0, 1.9, 1.4, .12, MAT(0x8a5a36), .05);
plane(chalkG, 0, 1.15, .07, 1.74, 1.24, new THREE.MeshBasicMaterial({ map: chalkTexture(), toneMapped: false }));

const bannerG = new THREE.Group(); bannerG.position.set(16.6, 0, 9.2); bannerG.rotation.y = -.28; scene.add(bannerG);
box(bannerG, 0, .08, 0, 1.3, .16, .6, MAT(PAL.navy), .05);
box(bannerG, -.62, 1.3, -.05, .07, 2.6, .07, MAT(PAL.navy), .02);
box(bannerG, .62, 1.3, -.05, .07, 2.6, .07, MAT(PAL.navy), .02);
plane(bannerG, 0, 1.4, 0, 1.15, 2.05, new THREE.MeshBasicMaterial({ map: bannerTexture(), toneMapped: false, side: THREE.DoubleSide }));

// luzes gerais (poucas e longe das máquinas)
light(0, 6.0, -9.5, 0x7aa2ff, 30, 16);
light(-16.5, 4.5, -4.5, 0x7a8dff, 10, 10);


/* ------------------------------------------------------------------ gabinetes de fliperama */
// Cada gabinete é UM sólido fechado (perfil lateral extrudado na largura toda): não há chapas finas
// nem frestas, então a luz não atravessa. Tudo que fica sobre as faces (tela, letreiro, painel) é
// decalque afastado >= .015 da superfície, para não haver z-fighting.
const CAB_PROFILE = [[-.85, 0], [.80, 0], [.80, .95], [1.20, 1.18], [.72, 1.52], [.55, 1.60], [.38, 3.0], [.62, 3.05], [.66, 3.95], [0, 4.0], [-.62, 3.98], [-.85, 3.7]];
const CAB_SIMPLE = [[-.85, 0], [.80, 0], [.80, .95], [1.20, 1.18], [.72, 1.52], [.38, 3.0], [.62, 3.05], [.66, 3.95], [0, 4.0], [-.62, 3.98], [-.85, 3.7]];
const CAB_W = 2.3, CAB_BEVEL = .02, CAB_CAP = CAB_W / 2 + CAB_BEVEL;
function extrudeAlongX(shape, depth, bevel = 0) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 });
  geo.rotateY(-Math.PI / 2);      // x do perfil -> z do mundo; extrusão vira o eixo x
  geo.translate(depth / 2, 0, 0);
  return geo;
}
const cabBodyGeo = extrudeAlongX(polyShape(CAB_PROFILE), CAB_W, CAB_BEVEL);
const sideRingGeo = extrudeAlongX(polyShape(offsetPoly(CAB_SIMPLE, .07), offsetPoly(CAB_SIMPLE, .14)), .02);
const sidePanelGeo = extrudeAlongX(polyShape(offsetPoly(CAB_SIMPLE, .15)), .006);

const coverLoader = new THREE.TextureLoader();
const chromeMat = MAT(0xe8eef7, { metalness: .8, roughness: .25 });
const STOOL_COLORS = { adivinhe: 0x2fbf78, financeiro: 0xe8423f };

function createSoonBadge() {
  const tex = labelTexture(['EM BREVE'], { width: 700, height: 190, background: '#13205a', accent: '#ffd54a', fontSize: 92, alt: '#18e0ff' });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.5, .41), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
}

/* enfeites de cada máquina (inspirados no conceito) — ficam sobre o tampo (y = 0 local) */
const TOPPERS = {
  trigolab(t, { rim }) {
    const steel = MAT(0x9bd8ff, { metalness: .6, roughness: .3 });
    for (const sx of [-.75, .45]) box(t, sx, .14, 0, .09, .3, .09, steel, .02);
    const pts = [];
    for (let i = 0; i <= 28; i++) pts.push(V3(-.85 + i * (1.4 / 28), .6 + Math.sin(i / 28 * Math.PI * 4) * .16, 0));
    t.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .035, 8, false), rim));
    const glass = MAT(0xbfeaff, { transparent: true, opacity: .5, roughness: .1, metalness: .1 });
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(.07, .22, .36, 20), glass); flask.position.set(.95, .2, .05); t.add(flask);
    cyl(t, .95, .46, .05, .07, .16, glass, 14);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.11, .2, .16, 20), glowMat(0x2fd6ff, .9)); liquid.position.set(.95, .09, .05); t.add(liquid);
  },
  xadrez(t) {
    const gold = MAT(0xffc83d, { emissive: 0xffa800, emissiveIntensity: .35, metalness: .5, roughness: .3 });
    const c = new THREE.Group(); c.position.set(0, .02, .05); t.add(c);
    cyl(c, 0, .12, 0, .4, .24, gold, 24);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(.1, .34, 12), gold); spike.position.set(Math.cos(a) * .3, .4, Math.sin(a) * .3); spike.castShadow = true; c.add(spike);
      sphere(c, Math.cos(a) * .3, .6, Math.sin(a) * .3, .055, MAT(i % 2 ? 0xff4f4f : 0xffffff, { emissive: i % 2 ? 0xff2020 : 0xffffff, emissiveIntensity: .5 }));
      const b = a + Math.PI / 5;
      sphere(c, Math.cos(b) * .4, .12, Math.sin(b) * .4, .045, MAT(0xff4f4f, { emissive: 0xff2020, emissiveIntensity: .6 }));
    }
  },
  corrida(t) {
    const pole = MAT(0xe9eef7, { metalness: .6, roughness: .3 });
    const flagTex = checkerTexture(4, 3);
    for (const sx of [-1, 1]) {
      tube(t, V3(sx * .85, 0, 0), V3(sx * 1.0, 1.2, 0), .025, pole, 8);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(.62, .42), new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide, toneMapped: false }));
      flag.position.set(sx * 1.0 - sx * .31, 1.02, 0); flag.rotation.z = sx * .08; t.add(flag);
    }
  },
  financeiro(t, { g }) {
    const gold = MAT(0xffc83d, { emissive: 0xffa800, emissiveIntensity: .3, metalness: .6, roughness: .3 });
    [[-.8, 4], [-.42, 3], [-.05, 5]].forEach(([x, n]) => { for (let i = 0; i < n; i++) cyl(t, x, .035 + i * .066, 0, .17, .06, gold, 20); });
    const coin = new THREE.Group(); coin.position.set(.72, .5, 0); t.add(coin);
    const disc = cyl(coin, 0, 0, 0, .36, .08, gold, 32); disc.rotation.x = Math.PI / 2;
    plane(coin, 0, 0, .05, .5, .5, new THREE.MeshBasicMaterial({ map: dollarTexture(), transparent: true, toneMapped: false }));
    box(t, .72, .12, 0, .1, .25, .08, gold, .02);
    // cofrinho ao lado da máquina
    const pig = new THREE.Group(); pig.position.set(1.95, 0, .6); pig.rotation.y = .35; g.add(pig);
    const pink = MAT(0xf59ab4, { roughness: .5 }), dkPink = MAT(0xe27a9c, { roughness: .5 }), ink = MAT(0x2a1420);
    sphere(pig, 0, .5, 0, .4, pink, 1.15, 1, 1.05);
    const snout = cyl(pig, 0, .46, .46, .14, .14, dkPink, 16); snout.rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) {
      sphere(pig, sx * .05, .46, .535, .022, ink);
      sphere(pig, sx * .17, .62, .33, .045, ink);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(.1, .2, 8), dkPink); ear.position.set(sx * .22, .9, .1); ear.rotation.z = -sx * .35; ear.castShadow = true; pig.add(ear);
      for (const sz of [-1, 1]) cyl(pig, sx * .24, .1, sz * .2, .09, .22, pink, 10);
    }
    box(pig, 0, .9, -.05, .22, .03, .05, ink, 0);
  },
  triangulo(t) {
    const pts = [[0, .98], [-.62, 0], [.62, 0]];
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(polyShape(pts, offsetPoly(pts, .11)), { depth: .08, bevelEnabled: false }), glowMat(0xffd84a, 1.4));
    tri.position.set(0, .06, -.04); t.add(tri);
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(polyShape(offsetPoly(pts, .1))), new THREE.MeshBasicMaterial({ color: 0xff9bff, transparent: true, opacity: .22, depthWrite: false, toneMapped: false }));
    fill.position.set(0, .06, 0); t.add(fill);
    for (const sx of [-.3, .3]) box(t, sx, .04, 0, .1, .08, .1, MAT(0x3b2a6e), .02);
  },
  adivinhe(t) {
    const cloud = new THREE.Group(); cloud.position.set(-.35, .55, 0); t.add(cloud);
    const white = MAT(0xffffff, { emissive: 0xffffff, emissiveIntensity: .35, roughness: .6 });
    [[0, 0, .3], [.34, -.05, .24], [-.34, -.04, .24], [.16, .22, .2], [-.15, .2, .18]].forEach(([x, y, r]) => sphere(cloud, x, y, 0, r, white, 1, 1, .6));
    plane(cloud, 0, 0, .21, .72, .36, new THREE.MeshBasicMaterial({ map: questionTexture(), transparent: true, toneMapped: false }));
    sphere(cloud, .5, -.38, 0, .07, white); sphere(cloud, .66, -.52, 0, .045, white);
    const lens = new THREE.Mesh(new THREE.TorusGeometry(.24, .045, 12, 32), MAT(0xc9d4e6, { metalness: .7, roughness: .25 }));
    lens.position.set(.85, .4, .1); t.add(lens);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.215, 28), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false }));
    disc.position.set(.85, .4, .1); t.add(disc);
    tube(t, V3(.68, .23, .1), V3(.5, .05, .1), .045, MAT(0x6b3a22, { roughness: .6 }), 10);
  },
  multa(t, { g }) {
    const grey = MAT(0xb7bdc9, { metalness: .5, roughness: .35 });
    cyl(t, .55, .3, 0, .05, .6, grey, 10);
    box(t, .55, .72, 0, .62, .42, .44, grey, .08);
    const lens = cyl(t, .55, .72, .25, .13, .08, MAT(0x1b4a8a, { emissive: 0x1d6cff, emissiveIntensity: .6 }), 20); lens.rotation.x = Math.PI / 2;
    sphere(t, .55, .98, 0, .05, glowMat(0xff3b3b, 1.6));
    const cone = new THREE.Group(); cone.position.set(1.85, 0, .7); g.add(cone);
    box(cone, 0, .04, 0, .55, .08, .55, MAT(0x20263a), .02);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.2, .66, 20), MAT(0xff7a1a, { roughness: .5 })); c.position.y = .41; c.castShadow = true; cone.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.115, .14, .1, 20), MAT(0xffffff, { roughness: .5 })); band.position.y = .36; cone.add(band);
  },
  batalha(t) {
    const red = MAT(0xe83a3a, { emissive: 0xc01010, emissiveIntensity: .45, roughness: .4 });
    const brass = MAT(0xffd54a, { emissive: 0xffb000, emissiveIntensity: .5, metalness: .5, roughness: .3 });
    const wheel = new THREE.Group(); wheel.position.set(0, .72, 0); t.add(wheel);
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(.42, .05, 12, 40), red));
    for (let k = 0; k < 4; k++) { const s = cyl(wheel, 0, 0, 0, .022, .96, red, 8); s.rotation.z = k * Math.PI / 4; }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; sphere(wheel, Math.cos(a) * .5, Math.sin(a) * .5, 0, .06, brass); }
    sphere(wheel, 0, 0, 0, .11, brass);
    box(t, 0, .36, 0, .14, .72, .14, MAT(0x9aa6bd, { metalness: .6, roughness: .35 }), .03);
  },
  lancamento(t, { rim }) {
    const arc = (x) => .75 - .3 * (x - .7) ** 2;
    const pts = [];
    for (let i = 0; i <= 30; i++) { const x = -.85 + i * (1.55 / 30); pts.push(V3(x, arc(x), 0)); }
    t.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .03, 8, false), rim));
    sphere(t, .72, .78, 0, .22, MAT(0xff9a1a, { emissive: 0xff7a00, emissiveIntensity: .7, roughness: .3 }));
    for (let i = 0; i < 5; i++) { const x = -.6 + i * .3; sphere(t, x, arc(x), 0, .06, MAT(0xffffff, { emissive: 0xffffff, emissiveIntensity: .7 })); }
  },
  detetive(t, { g }) {
    const felt = MAT(0xa4713a, { roughness: .8 }), dk = MAT(0x4b2c16, { roughness: .8 });
    const hat = new THREE.Group(); hat.position.set(0, .02, .05); hat.rotation.z = .05; t.add(hat);
    cyl(hat, 0, .025, 0, .66, .05, felt, 32);
    cyl(hat, 0, .22, 0, .3, .34, felt, 24);
    cyl(hat, 0, .1, 0, .335, .1, dk, 24);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(.14, 14), new THREE.MeshBasicMaterial({ color: 0x1c0f33, transparent: true, opacity: .55, depthWrite: false }));
      m.scale.set(.6, 1, 1); m.rotation.x = -Math.PI / 2; m.position.set((i % 2 ? .28 : -.28) - i * .05, .02, 1.9 + i * .55); g.add(m);
    }
  }
};

function arcadeCabinet(data) {
  const g = new THREE.Group(); g.position.set(data.x, 0, data.z); scene.add(g);
  const neonHex = hex(data.neon);
  const shell = MAT(new THREE.Color(0x1a1140).lerp(new THREE.Color(data.color), .55), { metalness: .2, roughness: .38 });
  const dark = MAT(0x120b30, { metalness: .3, roughness: .5 });
  const rim = glowMat(data.neon, 1.5, { metalness: .1 });
  const panelMat = MAT(new THREE.Color(0x120a32).lerp(new THREE.Color(data.color), .22), { emissive: data.neon, emissiveIntensity: .1, roughness: .5 });

  // corpo sólido + friso neon e painel nas duas laterais
  const body = new THREE.Mesh(cabBodyGeo, shell); body.castShadow = true; body.receiveShadow = true; g.add(body);
  for (const sx of [-1, 1]) {
    const ring = new THREE.Mesh(sideRingGeo, rim); ring.position.x = sx * (CAB_CAP + .011); g.add(ring);
    const panel = new THREE.Mesh(sidePanelGeo, panelMat); panel.position.x = sx * (CAB_CAP + .004); g.add(panel);
  }

  // tela (face inclinada: centro em z .465, y 2.3)
  const scr = new THREE.Group(); scr.position.set(0, 2.3, .465); scr.rotation.x = -.121; g.add(scr);
  const sFrame = new THREE.Mesh(roundedRingGeo(2.30, 1.50, .14, .13, .06), rim); sFrame.position.z = .015; scr.add(sFrame);
  box(scr, 0, 0, .04, 2.04, 1.24, .06, MAT(0x05060f, { roughness: .3, metalness: .4 }), 0);
  const tex = coverLoader.load(`./assets/capas/${data.cover}.webp`);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
  plane(scr, 0, 0, .085, 1.84, 1.036, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  plane(scr, 0, 0, .1, 1.84, 1.036, new THREE.MeshBasicMaterial({ map: glareTexture, transparent: true, depthWrite: false, toneMapped: false }));

  // letreiro (face do topo: centro em z .64, y 3.5)
  const mq = new THREE.Group(); mq.position.set(0, 3.5, .64); mq.rotation.x = .044; g.add(mq);
  const mFrame = new THREE.Mesh(roundedRingGeo(2.30, .94, .12, .06, .06), rim); mFrame.position.z = .015; mq.add(mFrame);
  plane(mq, 0, 0, .045, 2.16, .717, new THREE.MeshBasicMaterial({ map: marqueeTexture(data.title, neonHex), toneMapped: false }));

  // painel de controle (face inclinada: centro em z .96, y 1.35)
  const deck = new THREE.Group(); deck.position.set(0, 1.35, .96); deck.rotation.x = .619; g.add(deck);
  box(deck, 0, .03, 0, 2.0, .04, .5, MAT(0x16235c, { metalness: .35, roughness: .4 }), .01);
  box(deck, 0, .04, .29, 2.2, .05, .05, rim, .01);
  cyl(deck, -.62, .065, .02, .12, .03, MAT(0x05070f), 18);
  cyl(deck, -.62, .2, .02, .03, .26, chromeMat, 10);
  sphere(deck, -.62, .36, .02, .1, MAT(PAL.red, { metalness: .2, roughness: .25 }));
  const pal = [PAL.cyan, PAL.yellow, PAL.coral, PAL.mint, 0xff9bd0, PAL.blue];
  for (let i = 0; i < 6; i++) {
    const b = cyl(deck, -.1 + (i % 3) * .24, .08, (i < 3 ? -.1 : .12), .075, .05, MAT(pal[i], { emissive: pal[i], emissiveIntensity: .3 }), 16);
    b.castShadow = false;
  }
  for (const sx of [.7, .84]) cyl(deck, sx, .075, .02, .045, .04, MAT(PAL.cream), 12);

  // porta de fichas
  box(g, 0, .55, .84, 1.0, .56, .06, dark, .03);
  for (const sx of [-.26, .26]) box(g, sx, .6, .875, .12, .22, .03, MAT(PAL.yellow, { emissive: PAL.yellow, emissiveIntensity: 1.1 }), .01);
  box(g, 0, .42, .875, .5, .07, .03, MAT(PAL.red, { emissive: PAL.red, emissiveIntensity: .6 }), .01);
  box(g, 0, .12, .84, 2.1, .06, .04, rim, .01);

  // enfeite no tampo
  const top = new THREE.Group(); top.position.set(0, 4.02, 0); g.add(top);
  (TOPPERS[data.id] || (() => {}))(top, { rim, g, data });

  // banquinho
  const stool = new THREE.Group(); stool.position.set(0, 0, 2.75); g.add(stool);
  cyl(stool, 0, .07, 0, .3, .08, chromeMat, 20);
  cyl(stool, 0, .36, 0, .05, .6, chromeMat, 10);
  cyl(stool, 0, .7, 0, .31, .12, MAT(STOOL_COLORS[data.id] ?? 0xe8423f, { roughness: .35 }), 24);

  // brilho no chão: só NA FRENTE da máquina (nunca por baixo dela)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.4), new THREE.MeshBasicMaterial({ map: glowTexture, color: data.neon, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, .015, 2.55); g.add(glow);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.72, .88, 40), BASIC(data.neon, .25));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, .02, 1.65); g.add(halo);

  let badge = null, badgeY = 0;
  if (data.mode === 'pending') { badge = createSoonBadge(); badgeY = 5.8; badge.position.set(0, badgeY, .9); g.add(badge); }
  cabinets.push({ data, halo, glow, rim, badge, badgeY });
}
MACHINES.forEach(arcadeCabinet);

/* ------------------------------------------------------------------ criançada caminhando (como no conceito) */
function buildKid({ skin = 0xf1c7a0, hair = 0x3a2416, shirt = 0xd9443c, pants = 0x2a2f55, pack = null, cap = null, phones = null, curly = false }) {
  const group = new THREE.Group(); scene.add(group);
  const root = new THREE.Group(); group.add(root);
  const mSkin = MAT(skin, { roughness: .7 }), mShirt = MAT(shirt, { roughness: .7 }), mPants = MAT(pants, { roughness: .7 }), mHair = MAT(hair, { roughness: .8 });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.45, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .03; group.add(blob);
  box(root, 0, .98, 0, .56, .62, .36, mShirt, .12);
  if (pack) box(root, 0, 1.0, -.3, .44, .5, .2, MAT(pack, { roughness: .6 }), .08);
  const head = new THREE.Group(); head.position.set(0, 1.62, 0); root.add(head);
  box(head, 0, 0, 0, .64, .58, .56, mSkin, .2);
  for (const sx of [-1, 1]) sphere(head, sx * .15, .02, .28, .045, MAT(0x1a1a2a), 1, 1.3, .6);
  box(head, 0, -.12, .285, .1, .025, .02, MAT(0x1a1a2a), 0);
  if (cap) {
    const mCap = MAT(cap, { roughness: .6 });
    box(head, 0, .3, 0, .68, .18, .6, mCap, .08);
    box(head, 0, .22, .34, .5, .05, .28, mCap, .02);
  } else if (curly) {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; sphere(head, Math.cos(a) * .24, .3, Math.sin(a) * .22, .17, mHair); }
    sphere(head, 0, .42, 0, .2, mHair);
  } else {
    box(head, 0, .27, -.02, .68, .2, .6, mHair, .1);
    box(head, 0, .05, -.24, .66, .5, .14, mHair, .06);
  }
  if (phones) {
    const mPh = glowMat(phones, .7);
    head.add(new THREE.Mesh(new THREE.TorusGeometry(.38, .04, 8, 24, Math.PI), mPh));
    for (const sx of [-1, 1]) { const c = cyl(head, sx * .37, .02, 0, .12, .1, mPh, 14); c.rotation.z = Math.PI / 2; }
  }
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const lp = new THREE.Group(); lp.position.set(sx * .14, .66, 0); root.add(lp);
    box(lp, 0, -.28, 0, .2, .56, .22, mPants, .06);
    box(lp, 0, -.6, .05, .22, .12, .32, MAT(0x222235), .05);
    legs.push(lp);
    const ap = new THREE.Group(); ap.position.set(sx * .37, 1.22, 0); root.add(ap);
    box(ap, 0, -.24, 0, .14, .52, .16, mShirt, .06);
    sphere(ap, 0, -.54, 0, .08, mSkin);
    arms.push(ap);
  }
  return { group, root, legs, arms };
}
const walkers = [];
function addWalker(kid, path, speed = 1.15, pingpong = false) {
  kid.group.position.set(path[0][0], 0, path[0][1]);
  walkers.push({ kid, path, speed, target: 1, dir: 1, pingpong, phase: Math.random() * 6 });
}
addWalker(buildKid({ shirt: 0xd9443c, pack: 0xe8423f, hair: 0x3a2416 }), [[-15, -3], [-9, -3], [-9, 3.5], [-15, 3.5]]);
addWalker(buildKid({ shirt: 0xf2f2fa, pants: 0x3a2f6e, hair: 0x2a1a12, phones: 0xff5ab4, pack: 0x7a4fd0 }), [[-2.6, -3.4], [2.6, -3.4], [2.6, 3.4], [-2.6, 3.4]], 1.0);
addWalker(buildKid({ shirt: 0x2b4fa0, cap: 0x3a6fe0, skin: 0xe2b184, pack: 0xffd54a }), [[7, 3.4], [11, 3.4], [11, -3.2], [7, -3.2]], 1.2);
addWalker(buildKid({ shirt: 0x2f8f5a, curly: true, hair: 0x2a1a12, skin: 0xb9805a, pack: 0x2fbf78 }), [[13, -3.2], [15.2, -3.2], [15.2, 3.6], [13, 3.6]], 1.1);
addWalker(buildKid({ shirt: 0x2c3a78, cap: 0xe8423f, pack: 0x3a6fe0, skin: 0xf1c7a0 }), [[-10, 10.9], [10, 10.9]], 1.3, true);
function updateWalkers(dt) {
  for (const w of walkers) {
    const p = w.kid.group.position;
    const [tx, tz] = w.path[w.target];
    const dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
    if (dist < .08) {
      if (w.pingpong) { if (w.target + w.dir < 0 || w.target + w.dir >= w.path.length) w.dir *= -1; w.target += w.dir; }
      else w.target = (w.target + 1) % w.path.length;
      continue;
    }
    const step = Math.min(dist, w.speed * dt);
    p.x += dx / dist * step; p.z += dz / dist * step;
    let a = Math.atan2(dx, dz) - w.kid.group.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
    w.kid.group.rotation.y += a * Math.min(1, dt * 8);
    const sw = Math.sin(elapsed * 9 + w.phase) * .5;
    w.kid.legs[0].rotation.x = sw; w.kid.legs[1].rotation.x = -sw;
    w.kid.arms[0].rotation.x = -sw * .8; w.kid.arms[1].rotation.x = sw * .8;
    w.kid.root.position.y = Math.abs(Math.sin(elapsed * 9 + w.phase)) * .05;
  }
}


/* ------------------------------------------------------------------ Matinho Doutor */
function faceTexture(kind) {
  return canvasTexture(512, 384, (ctx) => {
    ctx.clearRect(0, 0, 512, 384);
    const ink = '#06303a';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 20;
    const ex = [106, 406], ey = 168;
    if (kind === 'excited') {
      ctx.beginPath(); ctx.moveTo(70, ey - 46); ctx.lineTo(138, ey); ctx.lineTo(70, ey + 46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(442, ey - 46); ctx.lineTo(374, ey); ctx.lineTo(442, ey + 46); ctx.stroke();
      ctx.beginPath(); ctx.arc(256, 236, 54, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.arc(256, 276, 26, Math.PI, 0); ctx.fill();
      return;
    }
    // olho esquerdo (sempre ^)
    ctx.beginPath(); ctx.arc(ex[0], ey + 24, 48, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    if (kind === 'blink') { ctx.beginPath(); ctx.moveTo(ex[1] - 44, ey + 2); ctx.lineTo(ex[1] + 44, ey + 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(ex[1], ey + 24, 48, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    // sorriso
    ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(256, 240, 62, Math.PI * .16, Math.PI * .84); ctx.stroke();
  });
}
const FACES = { happy: faceTexture('happy'), blink: faceTexture('blink'), excited: faceTexture('excited') };

const logoPatchTexture = canvasTexture(256, 256, (ctx) => {
  ctx.clearRect(0, 0, 256, 256); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff3b3b'; ctx.font = `900 110px ${FONT_BODY}`; ctx.fillText('red', 128, 88);
  ctx.fillStyle = '#0b1f3f'; ctx.fillText('mat', 128, 188);
});

function buildMatinho() {
  const player = new THREE.Group(); scene.add(player);
  const m = {
    blue: MAT(PAL.blue, { metalness: .2, roughness: .3 }),
    deep: MAT(PAL.navy2, { roughness: .4 }),
    cyan: MAT(PAL.cyan, { emissive: 0x0a9ccc, emissiveIntensity: .4, roughness: .3 }),
    red: MAT(PAL.red, { roughness: .32 }),
    shoe: MAT(0xff2d55, { roughness: .3 }),
    coat: MAT(0xffffff, { roughness: .7 }),
    glove: MAT(0xffffff, { roughness: .5 }),
    black: MAT(0x1a1a1a, { roughness: .45 }),
    ink: MAT(0x0b0f1d, { roughness: .35 }),
    tie: MAT(0x0b5ed7, { roughness: .4 }),
    cuff: MAT(0x0b5ed7, { roughness: .4 }),
    screen: new THREE.MeshStandardMaterial({ color: PAL.mint, emissive: PAL.mint, emissiveIntensity: .55, roughness: .4 })
  };
  const root = new THREE.Group(); player.add(root);

  // sombra suave
  const blob = new THREE.Mesh(new THREE.CircleGeometry(.8, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .32, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .03; player.add(blob);

  // jaleco
  box(root, 0, 1.0, 0, 1.02, .5, .66, m.coat, .2);
  box(root, 0, 1.38, 0, .92, .72, .6, m.coat, .22);
  box(root, 0, 1.26, .31, .24, .84, .04, m.blue, .01);                 // camisa
  for (const sx of [-1, 1]) {
    box(root, sx * .28, 1.2, .31, .3, .86, .05, m.coat, .03);          // abas do jaleco
    const collar = box(root, sx * .13, 1.67, .31, .18, .17, .05, m.coat, .02); collar.rotation.z = -sx * .55;
  }
  const tieShape = new THREE.Shape();
  [[-.05, 0], [.05, 0], [.04, -.08], [.085, -.42], [0, -.52], [-.085, -.42], [-.04, -.08]].forEach(([x, y], i) => i ? tieShape.lineTo(x, y) : tieShape.moveTo(x, y));
  const tieMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tieShape, { depth: .03, bevelEnabled: false }), m.tie);
  tieMesh.position.set(0, 1.66, .335); root.add(tieMesh);
  plane(root, .3, 1.46, .338, .24, .24, new THREE.MeshBasicMaterial({ map: logoPatchTexture, transparent: true, depthWrite: false, toneMapped: false }));
  cyl(root, 0, 1.76, 0, .12, .2, m.deep, 12);                           // pescoço

  // pernas e sapatos
  const legs = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * .22, .8, 0); root.add(pivot);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .34, 6, 12), m.black); leg.position.y = -.28; leg.castShadow = true; pivot.add(leg);
    sphere(pivot, 0, -.6, .1, .27, m.shoe, 1, .62, 1.5);
    legs.push(pivot);
  }

  // braços: manga, punho azul e luva branca
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * .6, 1.58, 0); pivot.rotation.z = sx * .12; root.add(pivot);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .3, 6, 12), m.coat); sleeve.position.y = -.26; sleeve.castShadow = true; pivot.add(sleeve);
    cyl(pivot, 0, -.5, 0, .135, .09, m.cuff, 16);
    sphere(pivot, 0, -.64, .02, .14, m.glove);
    sphere(pivot, sx * .1, -.6, .08, .06, m.glove);
    arms.push(pivot);
  }

  // cabeça (cantos arredondados, tela verde, óculos pretos)
  const head = new THREE.Group(); head.position.set(0, 2.4, 0); root.add(head);
  box(head, 0, 0, 0, 1.5, 1.2, 1.05, m.blue, .3);
  box(head, -.46, .58, .26, .5, .2, .38, m.red, .07);                   // detalhe vermelho no canto superior
  for (let i = 0; i < 3; i++) box(head, .1, .22 - i * .17, -.53, .8, .06, .03, m.deep, .01);   // aberturas na traseira
  for (const sx of [-1, 1]) box(head, sx * .76, 0, 0, .07, .68, .66, m.deep, .03);
  box(head, .765, .12, .05, .05, .12, .12, m.cyan, .02);                // luzinha lateral
  box(head, 0, .04, .5, 1.3, .98, .12, m.ink, .2);                      // moldura da tela
  box(head, 0, .04, .56, 1.18, .86, .08, m.screen, .18);                // tela / rosto
  const faceMat = new THREE.MeshBasicMaterial({ map: FACES.happy, transparent: true, depthWrite: false, toneMapped: false });
  plane(head, 0, .06, .613, 1.16, .84, faceMat);
  for (const sx of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(.3, .048, 12, 44), m.black);
    lens.position.set(sx * .34, .12, .64); lens.castShadow = true; head.add(lens);
    cyl(head, sx * .7, .12, .45, .026, .34, m.black, 8).rotation.x = Math.PI / 2;   // haste
  }
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 20, Math.PI), m.black);
  bridge.position.set(0, .17, .64); head.add(bridge);
  box(head, 0, -.5, .35, 1.46, .26, .5, m.red, .09);                    // faixa vermelha inferior
  for (let i = 0; i < 3; i++) sphere(head, .26 + i * .13, -.5, .61, .035, m.ink, .55, 1.15, .3).rotation.z = -.35;
  cyl(head, .66, -.5, .61, .05, .03, m.ink, 14).rotation.x = Math.PI / 2;
  root.scale.setScalar(.95);

  return {
    group: player, root, head, arms, legs,
    setFace(kind) { if (faceMat.map !== FACES[kind]) faceMat.map = FACES[kind]; }
  };
}
const player = buildMatinho();
player.group.position.set(0, 0, PLAZA_Z - .45);

/* ------------------------------------------------------------------ jogo */
const keys = new Set();
const mobileKeys = new Set();
let started = false;
let openModal = false;
let nearby = null;
let elapsed = 0;
let previous = performance.now();
let visited = new Set();
try { visited = new Set(JSON.parse(localStorage.getItem('redmat-arcade-visited') || '[]')); } catch { }
function updateVisitCount() {
  $('visited-text').textContent = `${visited.size} / ${MACHINES.length} exploradas`;
  $('visited-bar').firstElementChild.style.width = `${Math.round(visited.size / MACHINES.length * 100)}%`;
}
updateVisitCount();

const SIGNS = [[-16.6, 9.4, 1.3], [16.6, 9.2, 1.1]];
function isBlocked(x, z) {
  if (Math.abs(x) > 18.3 || z < -11.0 || z > 11.6) return true;
  for (const { data } of cabinets) {
    if (Math.abs(x - data.x) < 1.63 && Math.abs(z - data.z) < 1.27) return true;
    if (Math.hypot(x - data.x, z - (data.z + 2.75)) < .5) return true;
  }
  for (const p of BENCH_SPOTS) if (Math.abs(x - p[0]) < 1.68 && Math.abs(z - p[1]) < .76) return true;
  for (const p of PLANT_SPOTS) if (Math.hypot(x - p[0], z - p[1]) < .75) return true;
  if (x < STAIRS.x && Math.abs(z - STAIRS.z) < STAIRS.half) return true;
  for (const [sx, sz, r] of SIGNS) if (Math.hypot(x - sx, z - sz) < r) return true;
  return false;
}
const camDir = cameraOffset.clone().setY(0).normalize().negate();
const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);
const moveV = new THREE.Vector3();
function isDown(...names) { return names.some(name => keys.has(name) || mobileKeys.has(name)); }
function movement(dt) {
  const up = Number(isDown('KeyW', 'ArrowUp', 'up')) - Number(isDown('KeyS', 'ArrowDown', 'down'));
  const right = Number(isDown('KeyD', 'ArrowRight', 'right')) - Number(isDown('KeyA', 'ArrowLeft', 'left'));
  moveV.set(0, 0, 0).addScaledVector(camDir, up).addScaledVector(camRight, right);
  const walking = moveV.lengthSq() > .01;
  if (walking) {
    moveV.normalize(); const speed = isDown('ShiftLeft', 'ShiftRight') ? 7.6 : 4.6;
    const nx = player.group.position.x + moveV.x * speed * dt;
    const nz = player.group.position.z + moveV.z * speed * dt;
    if (!isBlocked(nx, player.group.position.z)) player.group.position.x = nx;
    if (!isBlocked(player.group.position.x, nz)) player.group.position.z = nz;
    const angle = Math.atan2(moveV.x, moveV.z);
    let a = angle - player.group.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
    player.group.rotation.y += a * Math.min(1, dt * 12);
  }
  const swing = walking ? Math.sin(elapsed * 11) * .45 : Math.sin(elapsed * 2.2) * .035;
  player.legs[0].rotation.x = swing; player.legs[1].rotation.x = -swing;
  player.arms[0].rotation.x = -swing * .85; player.arms[1].rotation.x = swing * .85;
  player.root.position.y = walking ? Math.abs(Math.sin(elapsed * 11)) * .075 : Math.sin(elapsed * 2) * .025;
  player.head.rotation.z = Math.sin(elapsed * 2.2) * .03;
}
function updateFace() {
  const blinking = (elapsed % 3.8) > 3.62;
  player.setFace(nearby ? 'excited' : blinking ? 'blink' : 'happy');
}
function findNearby() {
  if (!started || openModal) return null;
  let min = 2.45, result = null;
  for (const { data } of cabinets) {
    const d = Math.hypot(player.group.position.x - data.x, player.group.position.z - (data.z + 1.65));
    if (d < min) { min = d; result = data; }
  }
  return result;
}
function updateInteraction() {
  nearby = findNearby();
  $('interaction').classList.toggle('hidden', !nearby);
  if (nearby) $('interaction-name').textContent = nearby.title;
  for (const item of cabinets) {
    const active = nearby?.id === item.data.id;
    item.halo.material.opacity = active ? .85 : .25;
    item.halo.scale.setScalar(active ? 1 + .06 * Math.sin(elapsed * 4) : 1);
    item.glow.material.opacity = active ? .6 : .32;
    item.rim.emissiveIntensity = active ? 2.1 + .5 * Math.sin(elapsed * 5) : 1.5;
    if (item.badge) {
      item.badge.position.y = item.badgeY + Math.sin(elapsed * 2.4) * .05;
      item.badge.material.opacity = .78 + Math.sin(elapsed * 5) * .22;
    }
  }
}

/* ------------------------------------------------------------------ janela do fliperama */
function makeExternalLink(game, label = 'Abrir em outra aba') {
  const anchor = document.createElement('a');
  anchor.href = game.url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = 'external-game-link';
  anchor.textContent = label;
  return anchor;
}
function createPlaceholderBase(game) {
  const div = document.createElement('div'); div.className = 'placeholder';
  const img = document.createElement('img');
  img.src = `./assets/capas/${game.cover}.webp`; img.alt = `Capa de ${game.title}`;
  div.append(img);
  return { div, img };
}
function showProtectedGame(content, game) {
  const { div } = createPlaceholderBase(game);
  const heading = document.createElement('h3'); heading.textContent = 'Jogo protegido por senha';
  const p = document.createElement('p');
  p.textContent = 'O Detetive Matemático está hospedado em uma página externa. Abra o jogo em outra aba e use a senha abaixo para acessar.';
  const row = document.createElement('div'); row.className = 'password-row';
  const badge = document.createElement('span'); badge.className = 'password-badge'; badge.textContent = `Senha: ${game.password}`;
  const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-password-btn'; copy.textContent = 'Copiar senha';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(game.password); copy.textContent = 'Copiado!'; setTimeout(() => copy.textContent = 'Copiar senha', 1400); }
    catch { copy.textContent = 'Não foi possível'; setTimeout(() => copy.textContent = 'Copiar senha', 1400); }
  });
  row.append(badge, copy);
  div.append(heading, p, row, makeExternalLink(game, 'Abrir Detetive Matemático'));
  content.append(div);
}
function showSoonScreen(content, game) {
  const { div } = createPlaceholderBase(game);
  const screen = document.createElement('div'); screen.className = 'soon-screen';
  const dots = document.createElement('div'); dots.className = 'soon-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  const heading = document.createElement('h3'); heading.textContent = 'Em breve';
  const p = document.createElement('p'); p.textContent = game.comingSoonText || 'Estamos preparando esta máquina para o arcade. Volte em breve!';
  screen.append(dots, heading, p);
  div.append(screen);
  content.append(div);
}

const fullscreenBtn = $('fullscreen-game');
if (!document.fullscreenEnabled) fullscreenBtn.classList.add('hidden');
fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else $('screen-glass').requestFullscreen?.().catch(() => {});
});

function openGame(game) {
  if (!game || openModal) return;
  openModal = true;
  keys.clear(); mobileKeys.clear();
  visited.add(game.id); updateVisitCount();
  try { localStorage.setItem('redmat-arcade-visited', JSON.stringify([...visited])); } catch { }
  const modal = $('game-modal');
  modal.style.setProperty('--neon', hex(game.neon));
  $('modal-title').textContent = game.title;
  const content = $('game-content'); content.replaceChildren();
  const outside = $('open-external'); outside.replaceChildren();
  const loading = $('screen-loading'); loading.classList.remove('done');

  if (game.mode === 'embedded' && game.url) {
    const iframe = document.createElement('iframe');
    iframe.src = game.url;
    iframe.title = `Jogo original: ${game.title}`;
    iframe.allow = 'fullscreen; autoplay';
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.addEventListener('load', () => loading.classList.add('done'));
    setTimeout(() => loading.classList.add('done'), 9000);
    content.append(iframe);
    outside.append(makeExternalLink(game));
  } else if (game.mode === 'external' && game.url) {
    showProtectedGame(content, game); loading.classList.add('done');
    outside.append(makeExternalLink(game));
  } else {
    showSoonScreen(content, game); loading.classList.add('done');
  }
  modal.classList.remove('hidden'); $('interaction').classList.add('hidden');
  $('close-game').focus();
}
function closeGame() {
  if (!openModal) return;
  openModal = false;
  if (document.fullscreenElement) document.exitFullscreen?.();
  $('game-modal').classList.add('hidden'); $('game-content').replaceChildren(); $('open-external').replaceChildren(); updateInteraction();
}
$('close-game').addEventListener('click', closeGame);
$('back-game').addEventListener('click', closeGame);
$('interact-button').addEventListener('click', () => openGame(nearby));
$('mobile-interact').addEventListener('click', () => openGame(nearby));
$('start-btn').addEventListener('click', () => {
  started = true; $('intro').classList.add('hidden'); $('hud').classList.remove('hidden');
  if (window.matchMedia('(pointer:coarse)').matches) $('mobile-controls').classList.remove('hidden');
  updateInteraction();
});
$('help-btn').addEventListener('click', () => { $('help').classList.toggle('hidden'); keys.clear(); });
$('help-close').addEventListener('click', () => $('help').classList.add('hidden'));
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') {
    if (openModal) closeGame(); else $('help').classList.add('hidden'); return;
  }
  if (!started || openModal || !$('help').classList.contains('hidden')) return;
  if (e.code === 'KeyE' && !e.repeat && nearby) openGame(nearby);
  else keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
for (const button of document.querySelectorAll('[data-dir]')) {
  const dir = button.dataset.dir;
  button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); mobileKeys.add(dir); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => mobileKeys.delete(dir));
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
  const orthoHeight = aspect < .78 ? 21.5 : aspect < 1.2 ? 22.5 : 24;
  camera.left = -orthoHeight * aspect / 2; camera.right = orthoHeight * aspect / 2;
  camera.top = orthoHeight / 2; camera.bottom = -orthoHeight / 2;
  camera.updateProjectionMatrix(); renderer.setSize(w, h); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
}
window.addEventListener('resize', resize); resize();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  if (started && !openModal) { elapsed += dt; movement(dt); updateInteraction(); updateFace(); updateWalkers(dt); }
  else if (!started) { elapsed += dt; player.root.position.y = Math.sin(elapsed * 2) * .025; updateFace(); updateWalkers(dt); }
  const t = new THREE.Vector3(player.group.position.x, 1.2, player.group.position.z);
  cameraTarget.lerp(t, Math.min(1, dt * 2.0));
  camera.position.copy(cameraTarget).add(cameraOffset); camera.lookAt(cameraTarget);

  for (const deco of ambientDecor) {
    deco.mesh.position.y = deco.baseY + Math.sin(elapsed * deco.speed + (deco.phase || 0)) * (deco.amp ?? .04);
  }
  for (const p of pulses) p.mat.opacity = p.base + Math.sin(elapsed * p.speed + p.phase) * p.amp;
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
