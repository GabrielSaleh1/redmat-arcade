// lobby.js — piso, paredes, janelas, letreiros, escada, estante, lâmpadas e praça (cenário aprovado).
import * as THREE from 'three';
import { scene, MAT, PAL, LITE, maxAniso, box, cyl, sphere, plane, light, tube, V3, glowMat, glowSprite, glowTexture, canvasTexture, rrect,
  roundedRectShape, roundedRingGeo, archInto, fitUV } from './core.js';
import { skyTexture, floorTextureBuild, brickTextureBuild, nightSkyTexture, mainSignTexture, wallSignTexture, monitorTexture, neonGamepadTexture,
  plazaTexture, chalkTexture, bannerTexture } from './textures.js';

scene.background = skyTexture();

/* ------------------------------------------------------------------ luz */
// Ambiente: noite arroxeada com neon (conceito.webp). Sem pontos de luz colados nas máquinas.
scene.add(new THREE.HemisphereLight(0xd9c6ff, 0x34195e, 1.6));
const sun = new THREE.DirectionalLight(0xeadfff, 2.0);
sun.position.set(5, 24, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048);
sun.shadow.camera.left = -24; sun.shadow.camera.right = 24;
sun.shadow.camera.top = 22; sun.shadow.camera.bottom = -22;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;   // era .045: com chapas finas a luz "vazava" para dentro das máquinas
scene.add(sun);


/* ------------------------------------------------------------------ cenário (conceito.webp) */
export const pulses = [];                                   // brilhos pulsantes (lâmpadas)
export const PLANT_SPOTS = [[-4, 0], [4, 0], [-17.4, 2.8], [17.2, 1.5]];
export const BENCH_SPOTS = [[-5.5, 0], [5.5, 0]];
export const STAIRS = { x: -15.7, z: -1.4, half: 1.9 };
export const SIGNS = [[-16.6, 9.4, 1.7], [16.6, 9.2, 1.5]];   // placa de giz e banner (colisão)

// piso lilás em tabuleiro + laje com friso neon (a sala "flutua" como no conceito)
const floorTexture = floorTextureBuild();
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(13, 8.67);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(39, 26), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .3, metalness: .1 }));
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
box(scene, 19.55, 4.1, -12.55, .9, 8.2, 1.4, beamMat, .04);      // coluna de canto: fecha a ponta da parede direita

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
archWindow({ x: WALL_X, y: 1.6, z: 10.6, rotY: Math.PI / 2 });
const conceptTex = new THREE.TextureLoader().load('./assets/conceito.webp');
conceptTex.colorSpace = THREE.SRGBColorSpace; conceptTex.anisotropy = maxAniso;
framedPanel({ x: WALL_X, y: 3.7, z: 2.7, rotY: Math.PI / 2, w: 2.4, h: 1.35, tex: conceptTex, frameColor: 0xb5763a });

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
  light(x, 7.9 - 2.3, z + 1.2, 0xffb36b, 38, 16, true);
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
export const PLAZA_Z = -1.2;          // centro do tapete (antes 0): mais para o fundo da sala
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
const chalkG = new THREE.Group(); chalkG.position.set(-16.6, 0, 9.4); chalkG.rotation.y = .48; chalkG.scale.setScalar(1.5); scene.add(chalkG);
box(chalkG, -.75, .8, -.25, .09, 1.7, .09, MAT(0x6b4328), .02).rotation.z = .08;
box(chalkG, .75, .8, -.25, .09, 1.7, .09, MAT(0x6b4328), .02).rotation.z = -.08;
box(chalkG, 0, 1.15, 0, 1.9, 1.4, .12, MAT(0x8a5a36), .05);
plane(chalkG, 0, 1.15, .07, 1.74, 1.24, new THREE.MeshBasicMaterial({ map: chalkTexture(), toneMapped: false }));

const bannerG = new THREE.Group(); bannerG.position.set(16.6, 0, 9.2); bannerG.rotation.y = .48; bannerG.scale.setScalar(1.35); scene.add(bannerG);
box(bannerG, 0, .08, 0, 1.3, .16, .6, MAT(PAL.navy), .05);
box(bannerG, -.62, 1.3, -.05, .07, 2.6, .07, MAT(PAL.navy), .02);
box(bannerG, .62, 1.3, -.05, .07, 2.6, .07, MAT(PAL.navy), .02);
plane(bannerG, 0, 1.4, 0, 1.15, 2.05, new THREE.MeshBasicMaterial({ map: bannerTexture(), toneMapped: false, side: THREE.DoubleSide }));

// luzes gerais (poucas e longe das máquinas)
light(0, 6.0, -9.5, 0x7aa2ff, 30, 16, true);
light(-16.5, 4.5, -4.5, 0x7a8dff, 10, 10);


