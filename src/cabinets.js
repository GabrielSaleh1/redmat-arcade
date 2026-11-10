// cabinets.js — gabinetes de fliperama (corpo sólido), enfeites animados e banquinhos das dez máquinas.
import * as THREE from 'three';
import { scene, MAT, PAL, hex, box, cyl, sphere, plane, tube, V3, glowMat, glowTexture, glareTexture, canvasTexture, maxAniso, BASIC, FONT_BODY,
  roundedRingGeo, polyShape, offsetPoly } from './core.js';
import { labelTexture, marqueeTexture, checkerTexture, dollarTexture, questionTexture } from './textures.js';
import { MACHINES } from './machines.js';

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
const RIM_IDLE = .85, RIM_ACTIVE = 1.35;       // neon sem estourar para branco
const NEON_FIX = { corrida: 0x3df08a };         // pista verde do conceito
const STOOL_COLORS = { adivinhe: 0x2fbf78, financeiro: 0xe8423f };

export const cabinets = [];
const sweepTexture = canvasTexture(256, 144, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(1, 0, -.35, 1, 50, 0);
  const g = ctx.createLinearGradient(88, 0, 168, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.26)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(88, 0, 80, h);
});

function createSoonBadge() {
  const tex = canvasTexture(736, 414, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(8,6,28,.72)'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(-.1);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(-w, -72, w * 2, 144);
    ctx.fillStyle = '#13205a'; ctx.fillRect(-w, -60, w * 2, 120);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `italic 900 100px ${FONT_BODY}`;
    ctx.fillStyle = '#ffd54a'; ctx.fillText('EM BREVE', 0, 6);
    ctx.restore();
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.84, 1.036), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
}

/* enfeites de cada máquina (inspirados no conceito) — ficam sobre o tampo (y = 0 local).
   Cada um pode devolver uma função (tempo) => {} com uma animação discreta. */
const TOPPERS = {
  trigolab(t, { rim }) {
    const steel = MAT(0x9bd8ff, { metalness: .6, roughness: .3 });
    for (const sx of [-.75, .45]) box(t, sx, .14, 0, .09, .3, .09, steel, .02);
    const pts = [];
    for (let i = 0; i <= 28; i++) pts.push(V3(-.85 + i * (1.4 / 28), .6 + Math.sin(i / 28 * Math.PI * 4) * .16, 0));
    t.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .035, 8, false), rim));
    const spark = sphere(t, -.85, .6, 0, .07, glowMat(0xffffff, 1.4));
    const glass = MAT(0xbfeaff, { transparent: true, opacity: .5, roughness: .1, metalness: .1 });
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(.07, .22, .36, 20), glass); flask.position.set(.95, .2, .05); t.add(flask);
    cyl(t, .95, .46, .05, .07, .16, glass, 14);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(.11, .2, .16, 20), glowMat(0x2fd6ff, .9)); liquid.position.set(.95, .09, .05); t.add(liquid);
    return (time) => {
      const u = (time * .22) % 1;
      spark.position.set(-.85 + u * 1.4, .6 + Math.sin(u * Math.PI * 4) * .16, 0);   // pulso correndo pela onda
      liquid.material.emissiveIntensity = .9 + Math.sin(time * 3) * .25;
    };
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
    return (time) => { c.position.y = .02 + Math.sin(time * 2) * .03; c.rotation.y = Math.sin(time * .8) * .25; };
  },
  corrida(t) {
    const pole = MAT(0xe9eef7, { metalness: .6, roughness: .3 });
    const flagTex = checkerTexture(4, 3);
    const flags = [];
    for (const sx of [-1, 1]) {
      tube(t, V3(sx * .85, 0, 0), V3(sx * 1.0, 1.2, 0), .025, pole, 8);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(.62, .42), new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide, toneMapped: false }));
      flag.position.set(sx * 1.0 - sx * .31, 1.02, 0); flag.rotation.z = sx * .08; t.add(flag); flags.push([flag, sx]);
    }
    return (time) => { for (const [f, sx] of flags) f.rotation.y = Math.sin(time * 5 + sx) * .28; };   // bandeiras ao vento
  },
  financeiro(t, { g }) {
    const gold = MAT(0xffc83d, { emissive: 0xffa800, emissiveIntensity: .3, metalness: .6, roughness: .3 });
    [[-.8, 4], [-.42, 3], [-.05, 5]].forEach(([x, n]) => { for (let i = 0; i < n; i++) cyl(t, x, .035 + i * .066, 0, .17, .06, gold, 20); });
    const coin = new THREE.Group(); coin.position.set(.72, .5, 0); t.add(coin);
    const disc = cyl(coin, 0, 0, 0, .36, .08, gold, 32); disc.rotation.x = Math.PI / 2;
    const dollar = new THREE.MeshBasicMaterial({ map: dollarTexture(), transparent: true, toneMapped: false });
    plane(coin, 0, 0, .05, .5, .5, dollar);
    const back = plane(coin, 0, 0, -.05, .5, .5, dollar); back.rotation.y = Math.PI;
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
    return (time) => { coin.rotation.y = time * 1.5; pig.position.y = Math.max(0, Math.sin(time * 1.6)) * .04; };   // moeda girando, cofrinho saltitando
  },
  triangulo(t) {
    const pts = [[0, .98], [-.62, 0], [.62, 0]];
    const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(polyShape(pts, offsetPoly(pts, .11)), { depth: .08, bevelEnabled: false }), glowMat(0xffd84a, 1.4));
    tri.position.set(0, .06, -.04); t.add(tri);
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(polyShape(offsetPoly(pts, .1))), new THREE.MeshBasicMaterial({ color: 0xff9bff, transparent: true, opacity: .22, depthWrite: false, toneMapped: false }));
    fill.position.set(0, .06, 0); t.add(fill);
    for (const sx of [-.3, .3]) box(t, sx, .04, 0, .1, .08, .1, MAT(0x3b2a6e), .02);
    return (time) => { tri.material.emissiveIntensity = 1.2 + Math.sin(time * 2.2) * .35; fill.material.opacity = .2 + Math.sin(time * 2.2) * .08; };
  },
  adivinhe(t) {
    const cloud = new THREE.Group(); cloud.position.set(-.35, .55, 0); t.add(cloud);
    const white = MAT(0xffffff, { emissive: 0xffffff, emissiveIntensity: .35, roughness: .6 });
    [[0, 0, .3], [.34, -.05, .24], [-.34, -.04, .24], [.16, .22, .2], [-.15, .2, .18]].forEach(([x, y, r]) => sphere(cloud, x, y, 0, r, white, 1, 1, .6));
    plane(cloud, 0, 0, .21, .72, .36, new THREE.MeshBasicMaterial({ map: questionTexture(), transparent: true, toneMapped: false }));
    sphere(cloud, .5, -.38, 0, .07, white); sphere(cloud, .66, -.52, 0, .045, white);
    const mag = new THREE.Group(); mag.position.set(.85, .4, .1); t.add(mag);
    mag.add(new THREE.Mesh(new THREE.TorusGeometry(.24, .045, 12, 32), MAT(0xc9d4e6, { metalness: .7, roughness: .25 })));
    mag.add(new THREE.Mesh(new THREE.CircleGeometry(.215, 28), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false })));
    tube(mag, V3(-.17, -.17, 0), V3(-.35, -.35, 0), .045, MAT(0x6b3a22, { roughness: .6 }), 10);
    return (time) => { cloud.position.y = .55 + Math.sin(time * 1.8) * .04; mag.rotation.z = Math.sin(time * 1.2) * .14; mag.position.x = .85 + Math.sin(time * .9) * .05; };   // lupa "procurando"
  },
  multa(t, { g }) {
    const grey = MAT(0xb7bdc9, { metalness: .5, roughness: .35 });
    cyl(t, .55, .3, 0, .05, .6, grey, 10);
    box(t, .55, .72, 0, .62, .42, .44, grey, .08);
    const lens = cyl(t, .55, .72, .25, .13, .08, MAT(0x1b4a8a, { emissive: 0x1d6cff, emissiveIntensity: .6 }), 20); lens.rotation.x = Math.PI / 2;
    const alarm = sphere(t, .55, .98, 0, .05, glowMat(0xff3b3b, 1.6));
    const cone = new THREE.Group(); cone.position.set(1.85, 0, .7); g.add(cone);
    box(cone, 0, .04, 0, .55, .08, .55, MAT(0x20263a), .02);
    const c = new THREE.Mesh(new THREE.ConeGeometry(.2, .66, 20), MAT(0xff7a1a, { roughness: .5 })); c.position.y = .41; c.castShadow = true; cone.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.115, .14, .1, 20), MAT(0xffffff, { roughness: .5 })); band.position.y = .36; cone.add(band);
    return (time) => {
      alarm.material.emissiveIntensity = Math.sin(time * 6) > .55 ? 2.4 : .4;          // sirene piscando
      lens.material.emissiveIntensity = (time % 3.2) < .12 ? 2.2 : .6;                 // flash do radar
    };
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
    return (time) => { wheel.rotation.z = time * .45; };   // timão girando devagar
  },
  lancamento(t, { rim }) {
    const arc = (x) => .75 - .3 * (x - .7) ** 2;
    const pts = [];
    for (let i = 0; i <= 30; i++) { const x = -.85 + i * (1.55 / 30); pts.push(V3(x, arc(x), 0)); }
    t.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .03, 8, false), rim));
    const ball = sphere(t, .72, .78, 0, .22, MAT(0xff9a1a, { emissive: 0xff7a00, emissiveIntensity: .7, roughness: .3 }));
    const dots = [];
    for (let i = 0; i < 5; i++) { const x = -.6 + i * .3; dots.push(sphere(t, x, arc(x), 0, .06, MAT(0xffffff, { emissive: 0xffffff, emissiveIntensity: .7 }))); }
    return (time) => {
      ball.position.y = .78 + Math.sin(time * 2.4) * .04;
      dots.forEach((d, i) => { d.material.emissiveIntensity = .25 + Math.max(0, Math.sin(time * 4 - i * .9)) * 1.1; });   // pontos "correndo" até a bola
    };
  },
  detetive(t, { g }) {
    const felt = MAT(0xa4713a, { roughness: .8 }), dk = MAT(0x4b2c16, { roughness: .8 });
    const hat = new THREE.Group(); hat.position.set(0, .02, .05); hat.rotation.z = .05; t.add(hat);
    cyl(hat, 0, .025, 0, .66, .05, felt, 32);
    cyl(hat, 0, .22, 0, .3, .34, felt, 24);
    cyl(hat, 0, .1, 0, .335, .1, dk, 24);
    const prints = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(.14, 14), new THREE.MeshBasicMaterial({ color: 0x1c0f33, transparent: true, opacity: .4, depthWrite: false }));
      m.scale.set(.6, 1, 1); m.rotation.x = -Math.PI / 2; m.position.set((i % 2 ? .28 : -.28) - i * .05, .02, 1.9 + i * .55); g.add(m); prints.push(m);
    }
    return (time) => {
      hat.rotation.z = .05 + Math.sin(time * 1.6) * .04;
      prints.forEach((m, i) => { m.material.opacity = .12 + Math.max(0, Math.sin(time * 2 - i * .8)) * .45; });   // pegadas aparecendo em sequência
    };
  }
};

function arcadeCabinet(data) {
  const g = new THREE.Group(); g.position.set(data.x, 0, data.z); scene.add(g);
  const neon = NEON_FIX[data.id] ?? data.neon;
  const neonHex = hex(neon);
  const shell = MAT(new THREE.Color(data.color).multiplyScalar(.62).lerp(new THREE.Color(0x120a2a), .12), { metalness: .2, roughness: .38 });
  const dark = MAT(0x120b30, { metalness: .3, roughness: .5 });
  const rim = glowMat(neon, RIM_IDLE, { metalness: .1 });
  const panelMat = MAT(new THREE.Color(0x120a32).lerp(new THREE.Color(data.color), .22), { emissive: neon, emissiveIntensity: .1, roughness: .5 });

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
  // brilho discreto que passa pela tela de tempos em tempos (textura compartilhada, deslocamento próprio)
  const sweepTex = sweepTexture.clone(); sweepTex.needsUpdate = true;
  plane(scr, 0, 0, .105, 1.84, 1.036, new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));

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
  box(g, 0, .55, .84, .62, .5, .06, dark, .03);
  box(g, 0, .6, .875, .07, .22, .03, MAT(PAL.yellow, { emissive: PAL.yellow, emissiveIntensity: .9 }), .01);
  const retBtn = cyl(g, 0, .4, .87, .05, .03, MAT(PAL.red, { emissive: PAL.red, emissiveIntensity: .5 }), 14); retBtn.rotation.x = Math.PI / 2;
  box(g, 0, .12, .84, 2.1, .06, .04, rim, .01);

  // enfeite no tampo
  const top = new THREE.Group(); top.position.set(0, 4.02, 0); g.add(top);
  const anim = (TOPPERS[data.id] || (() => null))(top, { rim, g, data }) || null;

  // banquinho
  const stool = new THREE.Group(); stool.position.set(0, 0, 2.75); g.add(stool);
  cyl(stool, 0, .07, 0, .3, .08, chromeMat, 20);
  cyl(stool, 0, .36, 0, .05, .6, chromeMat, 10);
  cyl(stool, 0, .7, 0, .31, .12, MAT(STOOL_COLORS[data.id] ?? 0xe8423f, { roughness: .35 }), 24);

  // brilho no chão: só NA FRENTE da máquina (nunca por baixo dela)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.4), new THREE.MeshBasicMaterial({ map: glowTexture, color: neon, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, .015, 2.55); g.add(glow);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.72, .88, 40), BASIC(neon, .25));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, .02, 1.65); g.add(halo);

  let badge = null;
  if (data.mode === 'pending') { badge = createSoonBadge(); badge.position.set(0, 0, .115); scr.add(badge); }
  cabinets.push({ data, halo, glow, rim, badge, anim, sweepTex, sweepPhase: Math.random() });
}
MACHINES.forEach(arcadeCabinet);


/** Atualiza halos, neon da máquina próxima, brilho que passa pelas telas e animações dos enfeites. */
export function updateCabinets(elapsed, nearbyId) {
  for (const item of cabinets) {
    const active = nearbyId === item.data.id;
    item.halo.material.opacity = active ? .85 : .25;
    item.halo.scale.setScalar(active ? 1 + .06 * Math.sin(elapsed * 4) : 1);
    item.glow.material.opacity = active ? .6 : .32;
    item.rim.emissiveIntensity = active ? RIM_ACTIVE + .25 * Math.sin(elapsed * 5) : RIM_IDLE;
    if (item.badge) item.badge.material.opacity = .88 + Math.sin(elapsed * 4) * .12;
    const ph = (elapsed * .16 + item.sweepPhase) % 1;                       // brilho: ~2 s a cada ~6 s
    item.sweepTex.offset.x = ph < .35 ? 1.1 - (ph / .35) * 2.2 : 1.3;
    if (item.anim) item.anim(elapsed);
  }
}
