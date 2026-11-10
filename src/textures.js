// textures.js — texturas desenhadas em canvas (letreiros, piso, tijolos, rosto do Matinho...).
import * as THREE from 'three';
import { canvasTexture, fitFont, rrect, outlinedText, FONT_TITLE, FONT_BODY, FONT_PIXEL } from './core.js';

export function skyTexture() {
  return canvasTexture(1600, 900, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#07041c'); g.addColorStop(.55, '#1d0f4a'); g.addColorStop(1, '#4b1a62');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) { ctx.fillStyle = `rgba(255,255,255,${.25 + Math.random() * .6})`; const sz = Math.random() < .12 ? 3 : 2; ctx.fillRect(Math.random() * w, Math.random() * h * .75, sz, sz); }
    const mg = ctx.createRadialGradient(w * .87, h * .16, 6, w * .87, h * .16, 130);
    mg.addColorStop(0, 'rgba(255,243,201,1)'); mg.addColorStop(.35, 'rgba(255,243,201,.3)'); mg.addColorStop(1, 'rgba(255,243,201,0)');
    ctx.fillStyle = mg; ctx.fillRect(w * .87 - 140, h * .16 - 140, 280, 280);
    ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(w * .87, h * .16, 34, 0, Math.PI * 2); ctx.fill();
    let x = -10;
    while (x < w) {
      const bw = 50 + Math.random() * 90, bh = 60 + Math.random() * 190;
      ctx.fillStyle = '#150a33'; ctx.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 12; wy < h - 12; wy += 20) for (let wx = x + 8; wx < x + bw - 12; wx += 16)
        if (Math.random() < .3) { ctx.fillStyle = '#ffd87a'; ctx.fillRect(wx, wy, 6, 9); }
      x += bw + 6;
    }
  });
}

export function labelTexture(lines, { width = 900, height = 230, background = '#0f1b45', accent = '#ffd54a', fontSize = 90, alt = '#ffffff' } = {}) {
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

export function splitTitle(text) {
  const words = text.split(' ');
  if (words.length < 2 || text.length <= 11) return [text];
  let best = 1, diff = 1e9;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < diff) { diff = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
export function marqueeTexture(title, neon) {
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

export function chalkTexture() {
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

export function bannerTexture() {
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
export function floorTextureBuild() {
  return canvasTexture(256, 256, (ctx) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      ctx.fillStyle = (i + j) % 2 ? '#6454a0' : '#8575bb';
      ctx.fillRect(i * 128, j * 128, 128, 128);
      const g = ctx.createLinearGradient(i * 128, j * 128, i * 128 + 128, j * 128 + 128);
      g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.10)');
      ctx.fillStyle = g; ctx.fillRect(i * 128, j * 128, 128, 128);
      ctx.strokeStyle = 'rgba(45,25,100,.25)'; ctx.lineWidth = 2; ctx.strokeRect(i * 128 + 1, j * 128 + 1, 126, 126);
    }
    ctx.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  });
}
export function brickTextureBuild() {
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
export function nightSkyTexture() {
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
export function gamepadIcon(ctx, cx, cy, s, body, accent) {
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
export function mainSignTexture() {
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
export function wallSignTexture() {
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
export function monitorTexture() {
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
export function neonGamepadTexture() {
  return canvasTexture(560, 360, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#d6a8ff'; ctx.shadowColor = '#a45bff'; ctx.shadowBlur = 36;
    rrect(ctx, 70, 80, 420, 170, 80); ctx.stroke();
    for (const cx of [150, 410]) { ctx.beginPath(); ctx.arc(cx, 240, 66, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(150, 130); ctx.lineTo(150, 190); ctx.moveTo(120, 160); ctx.lineTo(180, 160); ctx.stroke();
    for (const [x, y] of [[400, 130], [440, 160], [400, 190], [360, 160]]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke(); }
  });
}
export function plazaTexture() {
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
export function checkerTexture(cols, rows) {
  const tex = canvasTexture(256, 192, (ctx, w, h) => {
    const cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { ctx.fillStyle = (i + j) % 2 ? '#101018' : '#ffffff'; ctx.fillRect(i * cw, j * ch, cw, ch); }
  });
  return tex;
}
export function dollarTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#a06a00'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(w / 2, h / 2, 108, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#8a5a00'; ctx.font = `900 170px ${FONT_BODY}`; ctx.fillText('$', w / 2, h / 2 + 8);
  });
}
export function questionTexture() {
  return canvasTexture(384, 192, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `900 150px ${FONT_BODY}`;
    outlinedText(ctx, '???', w / 2, h / 2 + 6, '#ff3b3b', '#ffffff', 10);
  });
}



/* ------------------------------------------------------------------ Matinho Doutor: rosto, patch do jaleco, selo UFF */
export function faceTexture(kind) {
  return canvasTexture(512, 384, (ctx) => {
    ctx.clearRect(0, 0, 512, 384);
    const ink = '#06303a';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 20;
    const ex = [106, 406], ey = 168;
    const happyEye = (x, r = 48) => { ctx.beginPath(); ctx.arc(x, ey + 24, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); };
    const smile = (r = 62) => { ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(256, 240, r, Math.PI * .16, Math.PI * .84); ctx.stroke(); };
    if (kind === 'excited') {
      ctx.beginPath(); ctx.moveTo(70, ey - 46); ctx.lineTo(138, ey); ctx.lineTo(70, ey + 46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(442, ey - 46); ctx.lineTo(374, ey); ctx.lineTo(442, ey + 46); ctx.stroke();
      ctx.beginPath(); ctx.arc(256, 236, 54, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.arc(256, 276, 26, Math.PI, 0); ctx.fill();
    } else if (kind === 'joy') {
      happyEye(ex[0], 54); happyEye(ex[1], 54);
      ctx.fillStyle = 'rgba(255,107,138,.55)';
      for (const x of [78, 434]) { ctx.beginPath(); ctx.ellipse(x, 252, 30, 16, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(256, 232, 66, 0, Math.PI); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.arc(256, 282, 32, Math.PI, 0); ctx.fill();
    } else if (kind === 'wink') {
      happyEye(ex[0]);
      ctx.beginPath(); ctx.moveTo(442, ey - 40); ctx.lineTo(374, ey + 4); ctx.lineTo(442, ey + 48); ctx.stroke();
      smile();
    } else if (kind === 'surprised') {
      ctx.lineWidth = 14;
      for (const x of ex) { ctx.beginPath(); ctx.arc(x, ey + 10, 40, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, ey + 12, 12, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 12;
      for (const x of ex) { ctx.beginPath(); ctx.arc(x, ey - 60, 36, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(256, 262, 24, 0, Math.PI * 2); ctx.stroke();
    } else if (kind === 'blink') {
      ctx.beginPath(); ctx.moveTo(ex[0] - 44, ey + 2); ctx.lineTo(ex[0] + 44, ey + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex[1] - 44, ey + 2); ctx.lineTo(ex[1] + 44, ey + 2); ctx.stroke();
      smile();
    } else {   // happy
      happyEye(ex[0]); happyEye(ex[1]); smile();
    }
  });
}
export const logoPatchTexture = canvasTexture(256, 256, (ctx) => {
  ctx.clearRect(0, 0, 256, 256); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff3b3b'; ctx.font = `900 110px ${FONT_BODY}`; ctx.fillText('red', 128, 88);
  ctx.fillStyle = '#0b1f3f'; ctx.fillText('mat', 128, 188);
});
export const uffBadgeTexture = canvasTexture(128, 128, (ctx) => {
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d4fb8'; ctx.beginPath(); ctx.arc(64, 64, 54, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = `900 52px ${FONT_BODY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('uff', 64, 68);
});
