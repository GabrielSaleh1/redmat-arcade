// REDMAT Arcade 0.5 — lobby 3D com identidade visual REDMAT UFF.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MACHINES } from './machines.js';

const $ = (id) => document.getElementById(id);

// Espera as fontes da identidade (para os letreiros desenhados em canvas). Não trava se estiver offline.
await Promise.race([
  Promise.all([
    document.fonts.load('italic 900 60px "Playfair Display"'),
    document.fonts.load('800 40px "Montserrat"'),
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
scene.background = new THREE.Color(PAL.night);
scene.fog = new THREE.Fog(PAL.night, 32, 80);

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
renderer.toneMappingExposure = 1.35;
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
scene.add(new THREE.HemisphereLight(0xa8dcff, 0x2a2060, 2.1));
const sun = new THREE.DirectionalLight(0xdcecff, 2.7);
sun.position.set(-8, 22, 13);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -23; sun.shadow.camera.right = 23;
sun.shadow.camera.top = 21; sun.shadow.camera.bottom = -21;
sun.shadow.normalBias = .045;
scene.add(sun);

/* ------------------------------------------------------------------ texturas */
const logoTexture = new THREE.TextureLoader().load('./assets/logo-redmat.png');
logoTexture.colorSpace = THREE.SRGBColorSpace;
logoTexture.anisotropy = maxAniso;

const glowTexture = canvasTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
});

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

function marqueeTexture(title, neon) {
  return canvasTexture(1024, 340, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#13205a'); g.addColorStop(1, '#070f2c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = neon; ctx.lineWidth = 12; ctx.shadowColor = neon; ctx.shadowBlur = 26;
    rrect(ctx, 14, 14, w - 28, h - 28, 28); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff4f4f'; ctx.font = `400 26px ${FONT_PIXEL}`; ctx.fillText('REDMAT ARCADE', w / 2, 66);
    const size = fitFont(ctx, title, 'italic', 900, FONT_TITLE, w - 130, 112, 40);
    ctx.font = `italic 900 ${size}px ${FONT_TITLE}`;
    ctx.shadowColor = neon; ctx.shadowBlur = 34; ctx.fillStyle = '#fffde8';
    ctx.fillText(title, w / 2, h / 2 + 46);
  });
}

function chalkTexture() {
  return canvasTexture(768, 512, (ctx, w, h) => {
    ctx.fillStyle = '#123a4c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 80, 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fffde8';
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

function floorTextureBuild() {
  return canvasTexture(1024, 1024, (ctx) => {
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      ctx.fillStyle = (i + j) % 2 ? '#0e1a40' : '#152662';
      ctx.fillRect(i * 64, j * 64, 64, 64);
      ctx.strokeStyle = 'rgba(24,224,255,.10)'; ctx.lineWidth = 2; ctx.strokeRect(i * 64 + 1, j * 64 + 1, 62, 62);
    }
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * 1024, Math.random() * 1024, Math.random() * 3, Math.random() * 3);
  });
}

/* ------------------------------------------------------------------ cenário */
const ambientDecor = [];
const cabinets = [];

const floorTexture = floorTextureBuild();
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(3, 2);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(39, 26), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .4, metalness: .3 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -.07; scene.add(floor);

// bordas neon do piso (coral por fora, ciano por dentro)
const edgeCoral = MAT(PAL.coral, { emissive: PAL.coral, emissiveIntensity: 1.5 });
const edgeCyan = MAT(PAL.cyan, { emissive: PAL.cyan, emissiveIntensity: 1.2 });
for (const s of [
  [0, .02, -12.25, 38.2, .10, .16], [0, .02, 12.25, 38.2, .10, .16],
  [-19.05, .02, 0, .16, .10, 24.2], [19.05, .02, 0, .16, .10, 24.2]
]) box(scene, ...s, edgeCoral, .03);
for (const s of [
  [0, .02, -11.8, 37.4, .06, .08], [0, .02, 11.8, 37.4, .06, .08],
  [-18.6, .02, 0, .08, .06, 23.6], [18.6, .02, 0, .08, .06, 23.6]
]) box(scene, ...s, edgeCyan, .02);

// paredes
const wallMat = MAT(PAL.wall, { roughness: .6 });
box(scene, 0, 2.8, -12.96, 39, 5.6, .6, wallMat, .1);
box(scene, -19.4, 2.1, -.2, .6, 4.2, 25.5, wallMat, .1);
box(scene, 19.4, 2.1, -.2, .6, 4.2, 25.5, wallMat, .1);
box(scene, 0, .55, -12.6, 38.6, 1.1, .2, MAT(PAL.navy), .05);                 // rodapé escuro
box(scene, 0, 5.5, -12.58, 38.8, .16, .24, edgeCyan, .03);                     // friso superior
for (const x of [-17, -11, -5, 5, 11, 17]) {
  const c = Math.abs(x) === 5 || Math.abs(x) === 17 ? PAL.coral : PAL.cyan;
  box(scene, x, 3.1, -12.55, .14, 4.2, .2, MAT(c, { emissive: c, emissiveIntensity: 1 }), .04);
}

// letreiro principal: caixa de luz creme com o logo REDMAT
box(scene, 0, 6.35, -12.62, 11.4, 3.7, .3, MAT(PAL.navy), .2);
box(scene, 0, 6.35, -12.45, 11.0, 3.3, .12, MAT(PAL.coral, { emissive: PAL.coral, emissiveIntensity: .9 }), .16);
const signPanel = plane(scene, 0, 6.35, -12.37, 10.5, 2.82, new THREE.MeshBasicMaterial({ color: PAL.cream, toneMapped: false }));
plane(scene, 0, 6.35, -12.36, 8.0, 2.68, new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false }));
plane(scene, 0, 4.35, -12.38, 6.2, 1.0, new THREE.MeshBasicMaterial({
  map: canvasTexture(1024, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `400 84px ${FONT_PIXEL}`; ctx.shadowColor = '#18e0ff'; ctx.shadowBlur = 30; ctx.fillStyle = '#e9fdff';
    ctx.fillText('ARCADE', w / 2, h / 2);
  }), transparent: true, toneMapped: false
}));
light(0, 5.1, -10.8, 0x6a86ff, 4.2, 17);
light(-17.7, 3, -1, PAL.cyan, 2.6, 16);
light(17.7, 3, -1, PAL.coral, 2.4, 16);
light(0, 3.2, 1.5, PAL.mint, 1.1, 9);

function addWallWindow(x, y, z, side = 'left') {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  box(g, 0, 0, 0, .25, 3.2, 4.8, MAT(PAL.navy), .05);
  box(g, side === 'left' ? .22 : -.22, 0, 0, .16, 3.0, 4.4, MAT(PAL.cream, { roughness: .3 }), .03);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.4), new THREE.MeshBasicMaterial({ color: 0x2f7ae0, transparent: true, opacity: .35, side: THREE.DoubleSide }));
  pane.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  pane.position.set(side === 'left' ? .18 : -.18, .22, 0); g.add(pane);
  for (let i = -1; i <= 1; i++) {
    box(g, side === 'left' ? .2 : -.2, -.68 + i * 1.15, 0, .06, .10, 4.3, MAT(PAL.cream, { emissive: PAL.cyan, emissiveIntensity: .2 }), .01);
  }
}
addWallWindow(-18.9, 2.9, -8.2, 'left');
addWallWindow(18.9, 2.9, -8.2, 'right');


function addHangingLamp(x, z) {
  const g = new THREE.Group(); scene.add(g);
  g.position.set(x, 5.5, z);
  box(g, 0, -.75, 0, .06, 1.35, .06, MAT(0xadb6d2), .02);
  const hood = new THREE.Mesh(new THREE.ConeGeometry(.55, .5, 18, 1, true), MAT(PAL.coral, { roughness: .32, metalness: .22, side: THREE.DoubleSide }));
  hood.rotation.x = Math.PI; hood.position.y = -1.45; g.add(hood);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.18, 14, 12), MAT(0xfff2c9, { emissive: 0xffe0a0, emissiveIntensity: 1.4 }));
  bulb.position.y = -1.5; g.add(bulb);
}
for (const x of [-12, 0, 12]) addHangingLamp(x, -9.4);

function shelf(x, y, z) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const wood = MAT(0x5a3c28);
  box(g, 0, 0, 0, 2.8, .12, .48, wood, .03);
  box(g, 0, 1.1, 0, 2.8, .12, .48, wood, .03);
  for (const sx of [-1.28, 1.28]) box(g, sx, .55, 0, .12, 1.3, .42, wood, .03);
  const cols = [PAL.blue, PAL.coral, PAL.mint, PAL.yellow, PAL.sky];
  for (let i = 0; i < 7; i++) {
    const h = .7 + (i % 3) * .12;
    box(g, -1.0 + i * .32, .06 + h / 2, .02, .2, h, .26, MAT(cols[i % cols.length], { emissive: cols[i % cols.length], emissiveIntensity: .12 }), .02);
  }
  const trophy = new THREE.Mesh(new THREE.CylinderGeometry(.15, .18, .42, 12), MAT(PAL.yellow, { emissive: 0xffe57c, emissiveIntensity: .3, metalness: .7 }));
  trophy.position.set(0, 1.42, 0); g.add(trophy);
  ambientDecor.push({ mesh: trophy, baseY: trophy.position.y, speed: .7 });
}
shelf(-15.8, 1.6, -11.86); shelf(15.8, 1.6, -11.86);

// praça central com o logo REDMAT no piso
function neonRing(x, z, radius, color, opacity = .85) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(radius - .08, radius, 64), BASIC(color, opacity));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, .018, z); scene.add(mesh);
  return mesh;
}
const plazaDisc = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64), new THREE.MeshBasicMaterial({ color: PAL.cream, toneMapped: false }));
plazaDisc.rotation.x = -Math.PI / 2; plazaDisc.position.set(0, .012, 0); scene.add(plazaDisc);
neonRing(0, 0, 2.7, PAL.coral, .95);
neonRing(0, 0, 3.05, PAL.cyan, .8);
const plazaLogo = plane(scene, 0, .02, 0, 4.1, 1.37, new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false }));
plazaLogo.rotation.x = -Math.PI / 2;

function plant(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  cyl(g, 0, .43, 0, .42, .72, MAT(PAL.navy2), 12);
  cyl(g, 0, .82, 0, .32, .12, MAT(PAL.coral), 12);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 8), MAT(i % 2 ? 0x2abf89 : 0x60d37d));
    leaf.position.set(Math.cos(a) * .26, 1.05 + Math.sin(i * 3) * .07, Math.sin(a) * .26); leaf.scale.set(.9, 1.45, .75); leaf.castShadow = true; g.add(leaf);
  }
}
for (const [x, z] of [[-4, 0], [4, 0], [-17, 1.5], [17, 1.5]]) plant(x, z);

function bench(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  box(g, 0, .6, 0, 2.6, .36, .74, MAT(PAL.coral, { emissive: 0x4a1218, emissiveIntensity: .3 }), .15);
  box(g, 0, 1.02, -.3, 2.6, .55, .24, MAT(PAL.red), .07);
  for (const dx of [-1, 1]) box(g, dx, .24, 0, .16, .5, .6, MAT(PAL.cream, { metalness: .6 }), .03);
}
bench(-5.5, 0); bench(5.5, 0);

// placa de giz e banner (como na arte conceitual)
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

// símbolos matemáticos flutuando sobre a praça
function symbolSprite(text, color, x, y, z, size = 1.15) {
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = fitFont(ctx, text, 'italic', 900, FONT_TITLE, 210, 150, 60);
    ctx.font = `italic 900 ${fs}px ${FONT_TITLE}`;
    ctx.shadowColor = color; ctx.shadowBlur = 28; ctx.fillStyle = '#fffde8'; ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 0; ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.strokeText(text, w / 2, h / 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s);
  ambientDecor.push({ mesh: s, baseY: y, speed: .6 + Math.random() * .6, amp: .14, phase: Math.random() * 6 });
}
[['π', '#18e0ff', -3.6, 4.0, -1.2], ['√x', '#ff4f4f', 3.8, 4.4, -2.2], ['∑', '#00f7bb', -1.2, 4.9, 2.4],
 ['f(x)', '#ffd54a', 2.2, 3.9, 2.8, 1.5], ['θ', '#5ba8c8', -5.8, 4.5, 2.2], ['∫', '#ff9bd0', 6.0, 4.0, 1.6], ['%', '#18e0ff', 0.4, 5.4, -3.2]]
  .forEach(([t, c, x, y, z, sz]) => symbolSprite(t, c, x, y, z, sz || 1.15));

/* ------------------------------------------------------------------ gabinetes de fliperama */
// perfil lateral (z, y): silhueta clássica de fliperama, de frente para +z
const CAB_PROFILE = [[-.85, 0], [.80, 0], [.80, .95], [1.20, 1.18], [.72, 1.52], [.55, 1.60], [.38, 3.0], [.62, 3.05], [.66, 3.95], [0, 4.0], [-.62, 3.98], [-.85, 3.7]];
const CAB_CENTER = [.1, 1.9];
function sideGeometry(scale, depth, bevel = .015) {
  const shape = new THREE.Shape();
  CAB_PROFILE.forEach(([z, y], i) => {
    const pz = CAB_CENTER[0] + (z - CAB_CENTER[0]) * scale, py = CAB_CENTER[1] + (y - CAB_CENTER[1]) * scale;
    if (i === 0) shape.moveTo(pz, py); else shape.lineTo(pz, py);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
  geo.rotateY(-Math.PI / 2);     // x local -> z do mundo; extrusão vira o eixo x
  geo.translate(depth / 2, 0, 0);
  return geo;
}
const sideGeoBase = sideGeometry(1, .16);
const sideGeoRim = sideGeometry(.88, .19, 0);
const sideGeoInset = sideGeometry(.84, .21, 0);

const coverLoader = new THREE.TextureLoader();
const stoolMat = MAT(PAL.red, { roughness: .35 });
const chromeMat = MAT(0xe8eef7, { metalness: .8, roughness: .25 });

function createSoonBadge() {
  const tex = labelTexture(['EM BREVE'], { width: 700, height: 190, background: '#13205a', accent: '#ffd54a', fontSize: 92, alt: '#18e0ff' });
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .41), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  badge.position.set(0, 4.5, .9);
  return badge;
}

function arcadeCabinet(data) {
  const g = new THREE.Group(); g.position.set(data.x, 0, data.z); scene.add(g);
  const neonHex = hex(data.neon);
  const shellColor = new THREE.Color(0x14214d).lerp(new THREE.Color(data.color), .5);
  const shell = MAT(shellColor, { metalness: .25, roughness: .35 });
  const dark = MAT(0x0a1230, { metalness: .3, roughness: .45 });
  const rim = MAT(data.neon, { emissive: data.neon, emissiveIntensity: 1.5, metalness: .1, roughness: .3 });

  // laterais com contorno neon
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(sideGeoBase, shell); side.position.x = sx * 1.2; side.castShadow = true; side.receiveShadow = true; g.add(side);
    const r = new THREE.Mesh(sideGeoRim, rim); r.position.x = sx * 1.2; g.add(r);
    const inset = new THREE.Mesh(sideGeoInset, MAT(0x0a1230, { emissive: data.neon, emissiveIntensity: .12 })); inset.position.x = sx * 1.2; g.add(inset);
  }
  // fechamentos entre as laterais
  box(g, 0, 1.95, -.82, 2.24, 3.9, .06, dark, 0);                      // traseira
  box(g, 0, 3.98, 0, 2.3, .1, 1.4, shell, .03);                        // tampo
  box(g, 0, .475, -.025, 2.24, .95, 1.65, shell, .04);                 // base / porta de fichas
  const under = box(g, 0, 1.065, 1.0, 2.24, .461, .06, shell, .02); under.rotation.x = 1.05;
  box(g, 0, 3.5, -.115, 2.2, .86, 1.45, shell, .03);                   // corpo do letreiro

  // porta de fichas
  box(g, 0, .55, .815, 1.0, .56, .04, dark, .03);
  for (const sx of [-.26, .26]) box(g, sx, .6, .84, .12, .22, .03, MAT(PAL.yellow, { emissive: PAL.yellow, emissiveIntensity: 1.1 }), .01);
  box(g, 0, .42, .84, .5, .07, .03, MAT(PAL.red, { emissive: PAL.red, emissiveIntensity: .6 }), .01);
  box(g, 0, .12, .815, 2.1, .06, .03, rim, .01);

  // painel de controle inclinado
  const deck = new THREE.Group(); deck.position.set(0, 1.35, .96); deck.rotation.x = .619; g.add(deck);
  box(deck, 0, 0, 0, 2.24, .1, .62, MAT(0x16235c, { metalness: .35, roughness: .4 }), .03);
  box(deck, 0, .04, .3, 2.24, .03, .04, rim, .01);
  cyl(deck, -.62, .065, .02, .11, .03, MAT(0x05070f), 18);
  cyl(deck, -.62, .19, .02, .03, .26, chromeMat, 10);
  sphere(deck, -.62, .34, .02, .1, MAT(PAL.red, { metalness: .2, roughness: .25 }));
  const pal = [PAL.cyan, PAL.yellow, PAL.coral, PAL.mint, 0xff9bd0, PAL.blue];
  for (let i = 0; i < 6; i++) {
    const b = cyl(deck, -.1 + (i % 3) * .24, .075, (i < 3 ? -.1 : .12), .075, .045, MAT(pal[i], { emissive: pal[i], emissiveIntensity: .3 }), 16);
    b.castShadow = false;
  }
  for (const sx of [.7, .84]) cyl(deck, sx, .07, .02, .045, .035, MAT(PAL.cream), 12);

  // tela
  const scr = new THREE.Group(); scr.position.set(0, 2.3, .465); scr.rotation.x = -.121; g.add(scr);
  box(scr, 0, 0, -.03, 2.24, 1.44, .08, rim, .03);
  box(scr, 0, 0, .01, 2.12, 1.34, .1, MAT(0x05070f, { roughness: .3, metalness: .4 }), .06);
  const tex = coverLoader.load(`./assets/capas/${data.cover}.webp`);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
  plane(scr, 0, 0, .065, 1.8, 1.015, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));

  // letreiro iluminado
  box(g, 0, 3.5, .62, 2.28, .92, .08, rim, .03);
  const mq = plane(g, 0, 3.5, .665, 2.2, .83, new THREE.MeshBasicMaterial({ map: marqueeTexture(data.title, neonHex), toneMapped: false }));
  mq.rotation.x = .044;

  // banquinho
  const stool = new THREE.Group(); stool.position.set(0, 0, 2.75); g.add(stool);
  cyl(stool, 0, .07, 0, .3, .08, chromeMat, 20);
  cyl(stool, 0, .36, 0, .05, .6, chromeMat, 10);
  cyl(stool, 0, .7, 0, .31, .12, stoolMat, 24);

  // brilho no chão + marcação do ponto de interação
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.4), new THREE.MeshBasicMaterial({ map: glowTexture, color: data.neon, transparent: true, opacity: .32, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, .012, 1.3); g.add(glow);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.72, .88, 40), BASIC(data.neon, .25));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, .02, 1.65); g.add(halo);

  let badge = null;
  if (data.mode === 'pending') { badge = createSoonBadge(); g.add(badge); }
  cabinets.push({ data, halo, glow, rim, badge });
}
MACHINES.forEach(arcadeCabinet);
for (const x of [-14, -7, 0, 7, 14]) {
  light(x, 4.2, -5.6, 0x7a5cff, .55, 5.5);
  light(x, 4.2, 8.4, PAL.cyan, .5, 5.5);
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
player.group.position.set(0, 0, -.65);

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
  for (const p of [[-5.5, 0], [5.5, 0]]) if (Math.abs(x - p[0]) < 1.68 && Math.abs(z - p[1]) < .76) return true;
  for (const p of [[-4, 0], [4, 0], [-17, 1.5], [17, 1.5]]) if (Math.hypot(x - p[0], z - p[1]) < .75) return true;
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
      item.badge.position.y = 4.5 + Math.sin(elapsed * 2.4) * .05;
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
  if (started && !openModal) { elapsed += dt; movement(dt); updateInteraction(); updateFace(); }
  else if (!started) { elapsed += dt; player.root.position.y = Math.sin(elapsed * 2) * .025; updateFace(); }
  const t = new THREE.Vector3(player.group.position.x, 1.2, player.group.position.z);
  cameraTarget.lerp(t, Math.min(1, dt * 2.0));
  camera.position.copy(cameraTarget).add(cameraOffset); camera.lookAt(cameraTarget);

  for (const deco of ambientDecor) {
    deco.mesh.position.y = deco.baseY + Math.sin(elapsed * deco.speed + (deco.phase || 0)) * (deco.amp ?? .04);
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
