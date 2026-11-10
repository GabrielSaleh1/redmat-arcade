// ui.js — tela inicial, HUD, caixa de interação e janela do jogo (moldura de fliperama).
import { $, hex } from './core.js';
import { MACHINES } from './machines.js';
import { state } from './state.js';

let hooks = { onOpen() {}, onClose() {}, onStart() {}, onRequestStart: null };
export function requestStart() { if (hooks.onRequestStart) hooks.onRequestStart(); else startGame(); }
let visited = new Set();
let loadTimer = null;
let lastPromptId = null;

try { visited = new Set(JSON.parse(localStorage.getItem('redmat-arcade-visited') || '[]')); } catch { }

export function updateVisitCount() {
  $('visited-text').textContent = `${visited.size} / ${MACHINES.length} jogos`;
  $('visited-bar').firstElementChild.style.width = `${Math.round(visited.size / MACHINES.length * 100)}%`;
}

/* ------------------------------------------------------------------ caixa de interação */
export function updateInteractionUI(nearby) {
  const id = nearby ? nearby.id : null;
  if (id === lastPromptId) return;
  lastPromptId = id;
  $('interaction').classList.toggle('hidden', !nearby);
  if (!nearby) return;
  $('interaction-name').textContent = nearby.title;
  $('interaction-hint').textContent = nearby.mode === 'pending' ? 'Em breve · pressione E para ver' : 'Pressione E para jogar';
  const cover = $('interaction-cover');
  cover.src = `./assets/capas/${nearby.cover}.webp`;
  $('interaction').style.setProperty('--neon', hex(nearby.neon));
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
function makeLoadFailNotice(game) {
  const note = document.createElement('div');
  note.className = 'load-notice';
  const msg = document.createElement('span'); msg.textContent = 'O jogo está demorando para carregar. Se não aparecer, abra em outra aba:';
  note.append(msg, makeExternalLink(game, 'Abrir em outra aba'));
  return note;
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
  const bar = document.createElement('div'); bar.className = 'soon-bar'; bar.innerHTML = '<i></i>';
  screen.append(dots, heading, p, bar);
  div.append(screen);
  content.append(div);
}

export function openGame(game) {
  if (!game || state.openModal) return;
  state.openModal = true;
  hooks.onOpen(game);
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
    let loaded = false;
    clearTimeout(loadTimer);
    iframe.addEventListener('load', () => { loaded = true; clearTimeout(loadTimer); loading.classList.add('done'); });
    iframe.addEventListener('error', () => { loading.classList.add('done'); content.append(makeLoadFailNotice(game)); });
    loadTimer = setTimeout(() => { loading.classList.add('done'); if (!loaded) content.append(makeLoadFailNotice(game)); }, 8000);
    content.append(iframe);
    outside.append(makeExternalLink(game));
  } else if (game.mode === 'external' && game.url) {
    showProtectedGame(content, game); loading.classList.add('done');
    outside.append(makeExternalLink(game));
  } else {
    showSoonScreen(content, game); loading.classList.add('done');
  }
  modal.classList.remove('hidden'); $('interaction').classList.add('hidden'); lastPromptId = null;
  $('close-game').focus();
}
export function closeGame() {
  if (!state.openModal) return;
  state.openModal = false; clearTimeout(loadTimer);
  if (document.fullscreenElement) document.exitFullscreen?.();
  $('game-modal').classList.add('hidden'); $('game-content').replaceChildren(); $('open-external').replaceChildren();
  hooks.onClose();
}

/* ------------------------------------------------------------------ tela inicial -> fliperama */
export function startGame() {
  if (state.started) return;
  state.started = true;
  const intro = $('intro');
  intro.classList.add('leaving');                         // fade + leve aproximação (CSS)
  $('hud').classList.remove('hidden');                    // HUD entra deslizando (CSS)
  if (window.matchMedia('(pointer:coarse)').matches) $('mobile-controls').classList.remove('hidden');
  setTimeout(() => intro.classList.add('hidden'), 800);
  hooks.onStart();
}

export function setupUI(h) {
  hooks = { ...hooks, ...h };
  updateVisitCount();
  const fullscreenBtn = $('fullscreen-game');
  if (!document.fullscreenEnabled) fullscreenBtn.classList.add('hidden');
  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else $('screen-glass').requestFullscreen?.().catch(() => {});
  });
  $('close-game').addEventListener('click', closeGame);
  $('back-game').addEventListener('click', closeGame);
  $('interact-button').addEventListener('click', () => openGame(state.nearby));
  $('mobile-interact').addEventListener('click', () => openGame(state.nearby));
  $('start-btn').addEventListener('click', requestStart);
  $('help-btn').addEventListener('click', () => { $('help').classList.toggle('hidden'); hooks.onHelp?.(); });
  $('help-close').addEventListener('click', () => $('help').classList.add('hidden'));
  $('start-btn').focus?.({ preventScroll: true });
}
