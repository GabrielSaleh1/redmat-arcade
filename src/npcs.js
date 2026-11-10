// npcs.js — alunos caminhando pelo lobby (comportamento simples: passeio, pausa e balões de fala).
import * as THREE from 'three';
import { scene, MAT, LITE, box, cyl, sphere, glowMat, canvasTexture, rrect, fitFont, FONT_BODY } from './core.js';

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
const kidPhrases = ['Que jogo legal!', 'Vamos jogar?', 'Quero a minha vez!', 'Matemática é divertida!', 'Bora pro Xadrez!', 'Adoro este arcade!'];
const bubbleTextures = kidPhrases.map((txt) => canvasTexture(512, 160, (ctx, w, h) => {
  ctx.fillStyle = '#fffde8'; rrect(ctx, 8, 8, w - 16, h - 52, 36); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w / 2 - 22, h - 48); ctx.lineTo(w / 2, h - 8); ctx.lineTo(w / 2 + 22, h - 48); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#0b1f3f'; ctx.lineWidth = 6; rrect(ctx, 8, 8, w - 16, h - 52, 36); ctx.stroke();
  ctx.fillStyle = '#0b1f3f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const size = fitFont(ctx, txt, 'italic', 800, FONT_BODY, w - 70, 44, 24);
  ctx.font = `italic 800 ${size}px ${FONT_BODY}`; ctx.fillText(txt, w / 2, (h - 52) / 2 + 8);
}));
function addWalker(kid, path, speed = 1.15, pingpong = false) {
  kid.group.position.set(path[0][0], 0, path[0][1]);
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTextures[0], transparent: true, depthTest: false, toneMapped: false }));
  bubble.scale.set(2.6, .81, 1); bubble.position.set(0, 3.0, 0); bubble.renderOrder = 20; bubble.visible = false;
  kid.group.add(bubble);
  walkers.push({ kid, path, speed, target: 1, dir: 1, pingpong, phase: Math.random() * 6, wait: 0, bubble, bubbleShow: 0, bubbleT: 3 + Math.random() * 8 });
}
addWalker(buildKid({ shirt: 0xd9443c, pack: 0xe8423f, hair: 0x3a2416 }), [[-15, -3], [-9, -3], [-9, 3.5], [-15, 3.5]]);
addWalker(buildKid({ shirt: 0xf2f2fa, pants: 0x3a2f6e, hair: 0x2a1a12, phones: 0xff5ab4, pack: 0x7a4fd0 }), [[-2.6, -3.4], [2.6, -3.4], [2.6, 3.4], [-2.6, 3.4]], 1.0);
addWalker(buildKid({ shirt: 0x2b4fa0, cap: 0x3a6fe0, skin: 0xe2b184, pack: 0xffd54a }), [[7, 3.4], [11, 3.4], [11, -3.2], [7, -3.2]], 1.2);
if (!LITE) {
  addWalker(buildKid({ shirt: 0x2f8f5a, curly: true, hair: 0x2a1a12, skin: 0xb9805a, pack: 0x2fbf78 }), [[13, -3.2], [15.2, -3.2], [15.2, 3.6], [13, 3.6]], 1.1);
  addWalker(buildKid({ shirt: 0x2c3a78, cap: 0xe8423f, pack: 0x3a6fe0, skin: 0xf1c7a0 }), [[-10, 10.9], [10, 10.9]], 1.3, true);
}
export function updateWalkers(dt, elapsed, playerPos) {
  for (const w of walkers) {
    const p = w.kid.group.position;
    // balão de fala de vez em quando
    if (w.bubbleShow > 0) { w.bubbleShow -= dt; if (w.bubbleShow <= 0) w.bubble.visible = false; }
    else { w.bubbleT -= dt; if (w.bubbleT <= 0) { w.bubble.material.map = bubbleTextures[Math.floor(Math.random() * bubbleTextures.length)]; w.bubble.visible = true; w.bubbleShow = 3; w.bubbleT = 9 + Math.random() * 8; } }
    // perto do Matinho: para e olha para ele
    const px = playerPos.x - p.x, pz = playerPos.z - p.z;
    const near = Math.hypot(px, pz) < 1.7;
    if (w.wait > 0) w.wait -= dt;
    const [tx, tz] = w.path[w.target];
    const dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
    let moving = !near && w.wait <= 0;
    if (moving && dist < .08) {
      if (w.pingpong) { if (w.target + w.dir < 0 || w.target + w.dir >= w.path.length) w.dir *= -1; w.target += w.dir; }
      else w.target = (w.target + 1) % w.path.length;
      w.wait = .6 + Math.random() * 1.2; moving = false;
    }
    const look = near ? Math.atan2(px, pz) : Math.atan2(dx, dz);
    if (moving || near) {
      let a = look - w.kid.group.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
      w.kid.group.rotation.y += a * Math.min(1, dt * 8);
    }
    if (moving) {
      const step = Math.min(dist, w.speed * dt);
      p.x += dx / dist * step; p.z += dz / dist * step;
      const sw = Math.sin(elapsed * 9 + w.phase) * .5;
      w.kid.legs[0].rotation.x = sw; w.kid.legs[1].rotation.x = -sw;
      w.kid.arms[0].rotation.x = -sw * .8; w.kid.arms[1].rotation.x = sw * .8;
      w.kid.root.position.y = Math.abs(Math.sin(elapsed * 9 + w.phase)) * .05;
    } else {
      for (const l of w.kid.legs) l.rotation.x *= .8;
      for (const ar of w.kid.arms) ar.rotation.x *= .8;
      w.kid.root.position.y *= .8;
    }
  }
}

