// REDMAT Arcade 0.8 — lobby 3D (Three.js). Entrada: laço do jogo, movimentação, interação e entrada de teclado/toque.
import * as THREE from 'three';
import { $, scene, camera, cameraOffset, cameraTarget, renderer, view, applyView, resize } from './core.js';
import { PLAZA_Z, STAIRS, SIGNS, PLANT_SPOTS, BENCH_SPOTS, pulses } from './lobby.js';
import { cabinets, updateCabinets } from './cabinets.js';
import { updateWalkers } from './npcs.js';
import { createMatinho } from './matinho.js';
import { state } from './state.js';
import { setupUI, updateInteractionUI, openGame, closeGame, startGame, requestStart } from './ui.js';
import { MultiplayerSession, cleanNick, cleanRoomCode } from './multiplayer.js';
import { OnlineAvatars } from './network-avatars.js';

const player = createMatinho();
player.group.position.set(0, 0, PLAZA_Z - .45);

const keys = new Set();
const mobileKeys = new Set();
let elapsed = 0;
let previous = performance.now();
let modalAge = 0;
const onlineAvatars = new OnlineAvatars();
const multiplayer = new MultiplayerSession({
  onPlayers(players, myUid) { onlineAvatars.sync(players, myUid); },
  onCount(count, capacity) { $('room-hud-count').textContent = `${count}/${capacity}`; },
  onStatus(status) {
    if (multiplayer.roomCode) $('room-hud-code').title = status;
  },
  onClosed(message) {
    onlineAvatars.clear();
    $('room-hud').classList.add('hidden');
    window.alert(message);
  }
});
let startingRoom = false;
function showJoinOverlay() {
  if (state.started) return;
  $('join-overlay').classList.remove('hidden');
  $('join-error').classList.add('hidden');
  const fromUrl = new URLSearchParams(location.search).get('sala');
  if (fromUrl) $('room-code').value = cleanRoomCode(fromUrl);
  $('student-nick').focus();
}
function hideJoinOverlay() { if (!startingRoom) $('join-overlay').classList.add('hidden'); }
function showJoinError(message) {
  $('join-error').textContent = message;
  $('join-error').classList.remove('hidden');
}
function finishStart(nick) {
  onlineAvatars.setLocalName(player.group, nick);
  $('join-overlay').classList.add('hidden');
  startGame();
}
function setJoining(yes) {
  startingRoom = yes;
  $('join-room').disabled = yes;
  $('play-solo').disabled = yes;
  $('join-room').textContent = yes ? 'Conectando...' : 'Entrar na sala';
}
$('join-cancel').addEventListener('click', hideJoinOverlay);
$('room-code').addEventListener('input', event => { event.target.value = cleanRoomCode(event.target.value); });
$('join-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (startingRoom) return;
  const nick = cleanNick($('student-nick').value);
  const code = cleanRoomCode($('room-code').value);
  if (nick.length < 2) { showJoinError('Escreva um apelido de 2 a 18 caracteres.'); return; }
  if (code.length !== 8) { showJoinError('Peça ao professor o código de 8 caracteres da sala.'); return; }
  setJoining(true);
  $('join-error').classList.add('hidden');
  try {
    const joined = await multiplayer.join({ code, nick, initialPosition: player.group.position });
    player.group.position.x = joined.spawn.x;
    player.group.position.z = joined.spawn.z;
    $('room-hud-code').textContent = joined.roomCode;
    $('room-hud').classList.remove('hidden');
    finishStart(nick);
  } catch (err) {
    showJoinError(err?.message || 'Não foi possível acessar a sala.');
  } finally { setJoining(false); }
});
$('play-solo').addEventListener('click', () => {
  if (startingRoom) return;
  const nick = cleanNick($('student-nick').value);
  if (nick.length < 2) { showJoinError('Escolha um apelido de 2 a 18 caracteres.'); return; }
  finishStart(nick);
});
$('leave-room').addEventListener('click', async () => {
  if (!multiplayer.roomCode) return;
  await multiplayer.leave();
  $('room-hud').classList.add('hidden');
  onlineAvatars.clear();
});
window.addEventListener('pagehide', () => { if (multiplayer.active) void multiplayer.leave(); });

/* ------------------------------------------------------------------ colisões e movimento */
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
function isDown(...names) { return names.some((name) => keys.has(name) || mobileKeys.has(name)); }

/** Move o jogador e devolve a velocidade atual (0 parado, 4.6 andando, 7.6 correndo) e se bateu em algo. */
function movement(dt) {
  const up = Number(isDown('KeyW', 'ArrowUp', 'up')) - Number(isDown('KeyS', 'ArrowDown', 'down'));
  const right = Number(isDown('KeyD', 'ArrowRight', 'right')) - Number(isDown('KeyA', 'ArrowLeft', 'left'));
  moveV.set(0, 0, 0).addScaledVector(camDir, up).addScaledVector(camRight, right);
  if (moveV.lengthSq() <= .01) return { speed: 0, blocked: false };
  moveV.normalize();
  const speed = isDown('ShiftLeft', 'ShiftRight') ? 7.6 : 4.6;
  const ox = player.group.position.x, oz = player.group.position.z;
  const nx = ox + moveV.x * speed * dt;
  const nz = oz + moveV.z * speed * dt;
  if (!isBlocked(nx, player.group.position.z)) player.group.position.x = nx;
  if (!isBlocked(player.group.position.x, nz)) player.group.position.z = nz;
  const angle = Math.atan2(moveV.x, moveV.z);
  let a = angle - player.group.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
  player.group.rotation.y += a * Math.min(1, dt * 12);
  const moved = Math.hypot(player.group.position.x - ox, player.group.position.z - oz);
  return { speed, blocked: moved < speed * dt * .35 };
}
function findNearby() {
  if (!state.started || state.openModal) return null;
  let min = 2.45, result = null;
  for (const { data } of cabinets) {
    const d = Math.hypot(player.group.position.x - data.x, player.group.position.z - (data.z + 1.65));
    if (d < min) { min = d; result = data; }
  }
  return result;
}

/* ------------------------------------------------------------------ interface e entrada */
setupUI({
  onOpen() {
    keys.clear(); mobileKeys.clear(); player.pulse('press'); modalAge = 0;
    if (multiplayer.active) multiplayer.publish({ x: player.group.position.x, z: player.group.position.z, yaw: player.group.rotation.y, moving: false }, performance.now(), true);
  },
  onClose() { previous = performance.now(); },
  onStart() { view.boostTarget = 1; player.pulse('wave'); },
  onRequestStart: showJoinOverlay,
  onHelp() { keys.clear(); }
});

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!state.started) {
    if (!$('join-overlay').classList.contains('hidden')) {
      if (e.code === 'Escape') hideJoinOverlay();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') requestStart();
    return;
  }
  if (e.code === 'Escape') {
    if (state.openModal) closeGame(); else $('help').classList.add('hidden');
    return;
  }
  if (state.openModal || !$('help').classList.contains('hidden')) return;
  if (e.code === 'KeyE' && !e.repeat && state.nearby) openGame(state.nearby);
  else keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
for (const button of document.querySelectorAll('[data-dir]')) {
  const dir = button.dataset.dir;
  button.addEventListener('pointerdown', (e) => { e.preventDefault(); button.setPointerCapture(e.pointerId); mobileKeys.add(dir); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => mobileKeys.delete(dir));
}

const clampN = (v, a, b) => Math.min(b, Math.max(a, v));
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.zoom = clampN(view.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), .75, 1.7); applyView();
}, { passive: false });
window.addEventListener('resize', resize); resize();

/* ------------------------------------------------------------------ laço principal */
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - previous) / 1000, .05); previous = now;

  // com o jogo aberto, o lobby fica parado (economiza GPU/CPU para o jogo); mantém ~0,8 s para o Matinho terminar o gesto
  if (state.openModal) { modalAge += dt; if (modalAge > .8) return; }

  elapsed += dt;
  const mv = state.started && !state.openModal ? movement(dt) : { speed: 0, blocked: false };
  state.nearby = findNearby();
  updateInteractionUI(state.nearby);
  const p = player.group.position;
  const yaw = state.nearby ? Math.atan2(state.nearby.x - p.x, state.nearby.z - p.z) : null;
  player.update(dt, { speed: mv.speed, yaw, blocked: mv.blocked, busy: state.openModal });
  updateWalkers(dt, elapsed, p);
  if (state.started && !state.openModal && multiplayer.active) {
    multiplayer.publish({ x: p.x, z: p.z, yaw: player.group.rotation.y, moving: mv.speed > 0 });
  }
  onlineAvatars.update(dt);
  updateCabinets(elapsed, state.nearby?.id);
  for (const pu of pulses) pu.mat.opacity = pu.base + Math.sin(elapsed * pu.speed + pu.phase) * pu.amp;

  // câmera: acompanha o jogador com suavidade; ao entrar, aproxima devagar
  const target = new THREE.Vector3(p.x, 1.2, p.z);
  cameraTarget.lerp(target, Math.min(1, dt * 2.0));
  camera.position.copy(cameraTarget).add(cameraOffset); camera.lookAt(cameraTarget);
  if (Math.abs(view.boost - view.boostTarget) > .0005) {
    view.boost += (view.boostTarget - view.boost) * Math.min(1, dt * 2.2);
    applyView();
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
