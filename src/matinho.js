// matinho.js — Matinho Doutor: modelo 3D cartoon, rig simples e animação procedural suave.
// Estados: parado (respiração, olhares, piscadas), caminhando, correndo, "interagindo" (perto de uma máquina),
// aceno (ao entrar) e aperto de botão (ao abrir um jogo). Todas as transições usam suavização exponencial.
import * as THREE from 'three';
import { scene, MAT, PAL, box, cyl, sphere, plane, glareTexture } from './core.js';
import { faceTexture, logoPatchTexture, uffBadgeTexture } from './textures.js';

const FACE_KINDS = ['happy', 'blink', 'excited', 'wink', 'joy', 'surprised'];
const FACES = Object.fromEntries(FACE_KINDS.map((k) => [k, faceTexture(k)]));

const HIP_Y = .9;
const approach = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createMatinho({ remote = false } = {}) {
  const group = new THREE.Group(); scene.add(group);
  const m = {
    blue: MAT(PAL.blue, { metalness: .2, roughness: .3 }),
    deep: MAT(PAL.navy2, { roughness: .4 }),
    cyan: MAT(PAL.cyan, { emissive: 0x0a9ccc, emissiveIntensity: .4, roughness: .3 }),
    red: MAT(PAL.red, { roughness: .32 }),
    shoe: MAT(0xff2d55, { roughness: .3 }),
    sole: MAT(0xfff4f4, { roughness: .6 }),
    coat: MAT(0xffffff, { roughness: .7 }),
    glove: MAT(0xffffff, { roughness: .5 }),
    black: MAT(0x1a1a1a, { roughness: .45 }),
    ink: MAT(0x0b0f1d, { roughness: .35 }),
    tie: MAT(0x0b5ed7, { roughness: .4 }),
    shirt: MAT(0x1877d6, { roughness: .6 }),
    screen: new THREE.MeshStandardMaterial({ color: PAL.mint, emissive: PAL.mint, emissiveIntensity: .55, roughness: .4 })
  };
  const root = new THREE.Group(); group.add(root);

  const blob = new THREE.Mesh(new THREE.CircleGeometry(.8, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .32, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .03; group.add(blob);

  /* ---- pernas + sapatos (pivô no quadril; tornozelo com articulação própria) */
  const legs = [], shoes = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * .2, HIP_Y, 0); root.add(pivot);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .44, 6, 12), m.black); leg.position.y = -.32; leg.castShadow = true; pivot.add(leg);
    const shoe = new THREE.Group(); shoe.position.set(0, -.7, 0); pivot.add(shoe);
    sphere(shoe, 0, 0, .1, .27, m.shoe, 1, .62, 1.5);
    sphere(shoe, 0, -.12, .1, .265, m.sole, 1.02, .2, 1.52);
    sphere(shoe, 0, .09, .3, .08, m.glove, 1.3, .5, 1);          // brilho no bico
    legs.push(pivot); shoes.push(shoe);
  }

  /* ---- jaleco: saia que balança (pivô no quadril) */
  const skirt = new THREE.Group(); skirt.position.set(0, 1.14, 0); root.add(skirt);
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(.47, .64, .56, 24), m.coat); flare.scale.z = .68; flare.position.y = -.28; flare.castShadow = true; skirt.add(flare);
  box(skirt, 0, -.3, .42, .03, .5, .02, m.shirt, .005);        // abertura frontal
  for (const sx of [-1, 1]) box(skirt, sx * .3, -.1, .4, .26, .22, .05, m.coat, .03);   // abas

  /* ---- tronco (pivô na cintura): respira, inclina e gira */
  const torso = new THREE.Group(); torso.position.set(0, 1.12, 0); root.add(torso);
  box(torso, 0, .34, 0, .96, .68, .6, m.coat, .24);
  box(torso, 0, .36, .295, .3, .62, .03, m.shirt, .01);        // camisa
  for (const sx of [-1, 1]) {
    const lapel = box(torso, sx * .19, .46, .31, .2, .5, .04, m.coat, .02); lapel.rotation.z = -sx * .3;
    const collar = box(torso, sx * .12, .72, .29, .17, .14, .05, m.coat, .02); collar.rotation.z = -sx * .55;
  }
  const tieShape = new THREE.Shape();
  [[-.05, 0], [.05, 0], [.04, -.08], [.085, -.42], [0, -.52], [-.085, -.42], [-.04, -.08]].forEach(([x, y], i) => i ? tieShape.lineTo(x, y) : tieShape.moveTo(x, y));
  const tieMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(tieShape, { depth: .03, bevelEnabled: false }), m.tie);
  tieMesh.position.set(0, .66, .325); torso.add(tieMesh);
  box(torso, 0, .67, .335, .1, .08, .04, m.tie, .02);          // nó da gravata
  plane(torso, .3, .4, .318, .24, .24, new THREE.MeshBasicMaterial({ map: logoPatchTexture, transparent: true, depthWrite: false, toneMapped: false }));
  box(torso, .37, .56, .318, .025, .13, .02, m.red, .005);     // caneta no bolso
  cyl(torso, 0, .8, 0, .12, .26, m.deep, 12);                   // pescoço

  /* ---- braços: ombro -> cotovelo -> luva */
  const arms = [], elbows = [];
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(sx * .6, .58, 0); shoulder.rotation.z = sx * .1; torso.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .2, 6, 12), m.coat); upper.position.y = -.2; upper.castShadow = true; shoulder.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -.36; shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .16, 6, 12), m.coat); fore.position.y = -.16; fore.castShadow = true; elbow.add(fore);
    cyl(elbow, 0, -.34, 0, .135, .08, m.tie, 16);               // punho azul
    sphere(elbow, 0, -.47, .02, .14, m.glove);                  // luva
    sphere(elbow, sx * .1, -.44, .08, .06, m.glove);            // polegar
    for (let f = 0; f < 3; f++) sphere(elbow, (f - 1) * .06, -.58, .05, .045, m.glove);   // dedinhos
    arms.push(shoulder); elbows.push(elbow);
  }

  /* ---- cabeça (cantos arredondados, tela verde, óculos pretos) */
  const head = new THREE.Group(); head.position.set(0, 1.36, 0); torso.add(head);
  box(head, 0, 0, 0, 1.5, 1.2, 1.05, m.blue, .3);
  box(head, .1, .6, 0, .9, .05, .55, MAT(0x4aa3ff, { roughness: .3 }), .02);                       // brilho do topo
  box(head, -.46, .58, .26, .5, .2, .38, m.red, .07);                                                // detalhe vermelho
  for (let i = 0; i < 3; i++) box(head, .1, .22 - i * .17, -.53, .8, .06, .03, m.deep, .01);       // aberturas traseiras
  for (const sx of [-1, 1]) {
    const ear = cyl(head, sx * .77, 0, 0, .27, .1, m.deep, 20); ear.rotation.z = Math.PI / 2;     // "orelhas"
    const led = new THREE.Mesh(new THREE.TorusGeometry(.15, .025, 8, 20), m.cyan); led.rotation.y = Math.PI / 2; led.position.set(sx * .83, 0, 0); head.add(led);
  }
  box(head, 0, .04, .5, 1.3, .98, .12, m.ink, .2);                                                  // moldura da tela
  box(head, 0, .04, .56, 1.18, .86, .08, m.screen, .18);                                            // tela / rosto
  // rosto: dois planos para transição suave entre expressões
  const faceGroup = new THREE.Group(); faceGroup.position.set(0, .06, .613); head.add(faceGroup);
  const faceCur = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .84), new THREE.MeshBasicMaterial({ map: FACES.happy, transparent: true, depthWrite: false, toneMapped: false }));
  const faceNext = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .84), new THREE.MeshBasicMaterial({ map: FACES.happy, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  faceNext.position.z = .001; faceGroup.add(faceCur, faceNext);
  plane(head, 0, .06, .625, 1.16, .84, new THREE.MeshBasicMaterial({ map: glareTexture, transparent: true, opacity: .55, depthWrite: false, toneMapped: false }));   // reflexo no visor
  for (const sx of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(.3, .048, 12, 44), m.black);
    lens.position.set(sx * .34, .12, .64); lens.castShadow = true; head.add(lens);
    cyl(head, sx * .7, .12, .45, .026, .34, m.black, 8).rotation.x = Math.PI / 2;
  }
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 20, Math.PI), m.black);
  bridge.position.set(0, .17, .64); head.add(bridge);
  box(head, 0, -.5, .35, 1.46, .26, .5, m.red, .09);                                                // faixa vermelha
  for (let i = 0; i < 3; i++) sphere(head, .26 + i * .13, -.5, .61, .035, m.ink, .55, 1.15, .3).rotation.z = -.35;
  plane(head, .66, -.5, .615, .2, .2, new THREE.MeshBasicMaterial({ map: uffBadgeTexture, transparent: true, depthWrite: false, toneMapped: false }));   // selo UFF
  root.scale.setScalar(.95);

  /* ---------------------------------------------------------------- controle de expressões */
  let faceTarget = 'happy', fadeT = 1, fadeDur = .14;
  function requestFace(kind, dur = .14) {
    if (kind === faceTarget) return;
    if (fadeT < 1) { faceCur.material.map = FACES[faceTarget]; faceCur.material.opacity = 1; }
    faceTarget = kind; faceNext.material.map = FACES[kind]; faceNext.material.opacity = 0; fadeT = 0; fadeDur = dur;
  }
  function tickFace(dt) {
    if (fadeT >= 1) return;
    fadeT = Math.min(1, fadeT + dt / fadeDur);
    faceCur.material.opacity = 1 - fadeT; faceNext.material.opacity = fadeT;
    if (fadeT >= 1) { faceCur.material.map = FACES[faceTarget]; faceCur.material.opacity = 1; faceNext.material.opacity = 0; }
  }

  /* ---------------------------------------------------------------- animação */
  const S = { t: 0, phase: 0, speed: 0, walk: 0, run: 0, inter: 0, wave: 0, waveT: 0, press: 0, blockedT: 0,
    blinkIn: 2.5, blinkT: 0, winkIn: 14, winkT: 0, lookX: 0, lookY: 0, hop: 0 };

  function update(dt, ctx = {}) {
    dt = Math.min(dt, .05);
    const { speed = 0, yaw = null, blocked = false, busy = false } = ctx;
    S.t += dt;
    const t = S.t;

    // velocidade suavizada -> quantidade de caminhada/corrida
    S.speed = approach(S.speed, speed, 9, dt);
    S.walk = clamp(S.speed / 4.6, 0, 1);
    S.run = clamp((S.speed - 4.6) / 3, 0, 1);
    if (S.speed > .12) S.phase += dt * S.speed * 1.6;
    const w = S.walk, r = S.run, idle = 1 - w;

    // interagir: perto de uma máquina e parado
    const wantsInter = yaw !== null && S.speed < .6 ? 1 : 0;
    S.inter = approach(S.inter, wantsInter, 5, dt);
    if (yaw !== null && S.speed < .6) group.rotation.y += wrapAngle(yaw - group.rotation.y) * (1 - Math.exp(-6 * dt));

    // aceno e aperto de botão
    if (S.waveT > 0) S.waveT -= dt;
    S.wave = approach(S.wave, S.waveT > 0 ? 1 : 0, 7, dt);
    if (S.press > 0) { S.press += dt / .45; if (S.press >= 1) S.press = 0; }
    const pressPose = S.press > 0 ? Math.sin(S.press * Math.PI) : 0;
    S.blockedT = blocked && S.speed < .8 ? S.blockedT + dt : Math.max(0, S.blockedT - dt * 2);

    const ph = S.phase, sL = Math.sin(ph), sR = Math.sin(ph + Math.PI);
    const legAmp = (.5 + .3 * r) * w;
    const lift = (.07 + .08 * r) * w;

    // pernas e pés
    [[legs[0], shoes[0], sL, ph], [legs[1], shoes[1], sR, ph + Math.PI]].forEach(([leg, shoe, s, p]) => {
      leg.rotation.x = -s * legAmp;
      leg.position.y = HIP_Y + Math.max(0, Math.cos(p)) * lift;
      shoe.rotation.x = s * legAmp * .75 - Math.max(0, Math.cos(p)) * .14 * w;
    });

    // corpo
    const lean = (.04 + .11 * r) * w + .05 * S.inter + .07 * pressPose;
    torso.rotation.x = lean;
    torso.rotation.y = sL * (.1 + .06 * r) * w;
    torso.rotation.z = Math.sin(ph) * .03 * w + Math.sin(t * .7) * .012 * idle;
    torso.scale.y = 1 + Math.sin(t * 1.9) * .014 * idle;
    skirt.rotation.x = lean * .35 + Math.sin(ph + .5) * (.09 + .08 * r) * w;
    skirt.rotation.z = Math.sin(ph) * .04 * w;
    S.hop = approach(S.hop, pressPose * .06, 18, dt);
    root.position.y = Math.abs(Math.sin(ph)) * (.06 + .05 * r) * w + Math.sin(t * 1.9) * .01 * idle + S.hop + (S.wave > .5 ? Math.abs(Math.sin(t * 9)) * .015 : 0);
    root.rotation.z = Math.sin(t * .6) * .01 * idle;

    // braços: balanço oposto às pernas + respiração; depois mistura com interação, aceno e aperto
    const armAmp = (.45 + .4 * r) * w;
    const armBase = [-sR * armAmp, -sL * armAmp];          // braço esquerdo acompanha a perna direita
    for (let i = 0; i < 2; i++) {
      const sx = i === 0 ? -1 : 1;
      let ax = armBase[i] + Math.sin(t * 1.5 + i * 1.7) * .05 * idle;
      let az = sx * (.1 + Math.sin(t * 1.3 + i) * .015 * idle + .05 * r);
      let ex = -(.2 + .55 * r) * w - Math.max(0, -armBase[i]) * .4 * w - .08 * idle;
      let ez = 0;
      if (i === 1) {                                         // braço "principal": interação, aceno e botão
        ax = ax * (1 - S.inter) + (-1.15 + Math.sin(t * 5) * .06) * S.inter;
        ex = ex * (1 - S.inter) + (-.5 + Math.sin(t * 6) * .12) * S.inter;
        az = az * (1 - S.inter) + .25 * S.inter;
        ax = ax * (1 - S.wave) + 0 * S.wave; az = az * (1 - S.wave) + 2.45 * S.wave;
        ex = ex * (1 - S.wave) - .2 * S.wave; ez = Math.sin(t * 11) * .5 * S.wave;
        ax += -.5 * pressPose; ex += -.35 * pressPose;
      }
      arms[i].rotation.x = ax; arms[i].rotation.z = az; elbows[i].rotation.x = ex; elbows[i].rotation.z = ez;
    }

    // cabeça: contra-movimento, olhar passeando quando parado, olhar para a tela da máquina ao interagir
    const look = idle * (1 - S.inter);
    S.lookY = approach(S.lookY, (Math.sin(t * .5) * .15 + Math.sin(t * .23 + 1) * .1) * look, 3, dt);
    S.lookX = approach(S.lookX, Math.sin(t * .37) * .04 * look - .14 * S.inter, 3, dt);
    head.rotation.x = -lean * .7 + S.lookX + Math.sin(ph * 2 + 1) * .015 * w;
    head.rotation.y = -torso.rotation.y * .7 + S.lookY + (S.blockedT > .2 ? Math.sin(t * 22) * .08 : 0);
    head.rotation.z = Math.sin(ph) * .03 * w + Math.sin(t * .8) * .03 * idle + .05 * S.inter;
    head.position.y = 1.36 + Math.sin(t * 1.9 + .3) * .01 * idle;
    faceGroup.position.x = Math.sin(t * .9) * .015 * idle + S.lookY * .1;       // olhos acompanham o olhar

    // expressões
    S.blinkIn -= dt; S.winkIn -= dt;
    if (S.blinkT > 0) S.blinkT -= dt;
    if (S.winkT > 0) S.winkT -= dt;
    if (S.blinkIn <= 0) { S.blinkT = .13; S.blinkIn = 2.4 + Math.random() * 3.2; }
    if (S.winkIn <= 0) { S.winkT = .7; S.winkIn = 13 + Math.random() * 8; }
    let want = 'happy';
    if (busy || pressPose > 0) want = 'joy';
    else if (S.waveT > 0) want = 'wink';
    else if (S.blockedT > .2) want = 'surprised';
    else if (S.inter > .5) want = 'excited';
    else if (S.winkT > 0 && w < .2) want = 'wink';
    else if (r > .5) want = 'joy';
    if (S.blinkT > 0 && (want === 'happy' || want === 'excited' || want === 'joy')) want = 'blink';
    requestFace(want, want === 'blink' ? .04 : .14);
    tickFace(dt);
  }

  // Nas oficinas, outros Matinhos usam o mesmo modelo completo, mas não
  // precisam projetar 30 sombras dinâmicas adicionais sobre o piso.
  if (remote) group.traverse((node) => { if (node.isMesh) node.castShadow = false; });

  return {
    group, root, head,
    rig: { legs, shoes, arms, elbows, torso, skirt, head, root },   // juntas expostas (testes e ajustes finos)
    update,
    pulse(kind) { if (kind === 'press') S.press = .001; else if (kind === 'wave') S.waveT = 1.7; },
    get speedNow() { return S.speed; }
  };
}
