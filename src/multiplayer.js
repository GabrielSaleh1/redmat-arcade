import { firebaseClient } from './firebase-client.js';

export const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
export function cleanRoomCode(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}
export function cleanNick(value = '') {
  // Nicks em texto simples (nunca inserir HTML); remove caracteres de controle.
  return String(value).normalize('NFC').replace(/[\u0000-\u001F\u007F<>]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, 18);
}

/** Serviço da sala: só replica presença e movimento; não compartilha o estado dos jogos externos. */
export class MultiplayerSession {
  constructor({ onPlayers = () => {}, onCount = () => {}, onStatus = () => {}, onClosed = () => {} } = {}) {
    this.onPlayers = onPlayers;
    this.onCount = onCount;
    this.onStatus = onStatus;
    this.onClosed = onClosed;
    this.roomCode = null;
    this.nick = null;
    this.uid = null;
    this.active = false;
    this.unsubscribers = [];
    this.myRef = null;
    this.disconnectOp = null;
    this.client = null;
    this.lastPayload = null;
    this.lastSendAt = 0;
    this.playersCache = {};
    this.isConnected = false;
    this._leaving = false;
  }

  async join({ code, nick, initialPosition }) {
    const roomCode = cleanRoomCode(code);
    const chosen = cleanNick(nick);
    if (!ROOM_CODE_RE.test(roomCode)) throw new Error('O código precisa ter 8 caracteres.');
    if (chosen.length < 2) throw new Error('Escolha um apelido de pelo menos 2 caracteres.');
    if (this.active || this.roomCode) await this.leave();

    const client = await firebaseClient();
    const { auth, db, authLib: a, dbLib: d } = client;
    await a.setPersistence(auth, a.browserSessionPersistence);
    if (!auth.currentUser) await a.signInAnonymously(auth);
    if (!auth.currentUser?.isAnonymous) {
      throw new Error('Este navegador está conectado como professor. Abra a sala dos alunos em uma janela anônima.');
    }

    const metaRef = d.ref(db, `rooms/${roomCode}/meta`);
    const metaSnap = await d.get(metaRef);
    const meta = metaSnap.val();
    if (!meta || meta.open !== true) throw new Error('Sala inexistente ou encerrada. Confira o código com o professor.');
    const playersRef = d.ref(db, `rooms/${roomCode}/players`);
    const playersSnap = await d.get(playersRef);
    const playerCount = Object.keys(playersSnap.val() || {}).length;
    const uid = auth.currentUser.uid;
    const maxPlayers = Math.min(30, Number(meta.capacity) || 30);
    if (playerCount >= maxPlayers && !playersSnap.hasChild(uid)) throw new Error('Esta sala está lotada.');

    const angle = (playerCount * 2.399963) % (Math.PI * 2);
    const initial = {
      x: Number(initialPosition?.x ?? 0) + Math.cos(angle) * 1.25,
      z: Number(initialPosition?.z ?? -1) + Math.sin(angle) * 1.25,
      yaw: 0,
      moving: false
    };
    this.client = client;
    this.nick = chosen;
    this.roomCode = roomCode;
    this.uid = uid;
    this.myRef = d.ref(db, `rooms/${roomCode}/players/${uid}`);
    this.lastPayload = { ...initial };
    this._leaving = false;
    this.onStatus('Conectando à sala...');

    try {
      // A inscrição no evento de desconexão acontece ANTES de publicar a presença.
      // Ao reconectar, o mesmo registro é rearmado.
      let readyResolve, readyReject;
      let firstConnection = true;
      const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
      const connectionRef = d.ref(db, '.info/connected');
      const offConnection = d.onValue(connectionRef, async (snapshot) => {
        if (this._leaving) return;
        this.isConnected = snapshot.val() === true;
        if (!this.isConnected) {
          this.onStatus('Reconectando...');
          return;
        }
        try {
          this.disconnectOp = d.onDisconnect(this.myRef);
          await this.disconnectOp.remove();
          await d.set(this.myRef, { nick: this.nick, ...this.lastPayload, ts: d.serverTimestamp() });
          this.active = true;
          this.onStatus('Conectado');
          if (firstConnection) { firstConnection = false; readyResolve(); }
        } catch (error) {
          if (firstConnection) { firstConnection = false; readyReject(error); }
          this.onStatus('Falha de conexão');
        }
      }, error => { if (firstConnection) { firstConnection = false; readyReject(error); } });
      this.unsubscribers.push(offConnection);

      // Não permitir que uma rede travada prenda a interface por tempo indeterminado.
      await Promise.race([ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo de conexão esgotado. Verifique a internet e o Firebase.')), 14000))]);

      // Eventos por criança: uma atualização de movimento envia apenas o
      // registro daquele aluno, não a lista completa de 30 pessoas.
      const emit = () => {
        this.onPlayers(this.playersCache, this.uid);
        this.onCount(Object.keys(this.playersCache).length, maxPlayers);
      };
      this.playersCache = {};
      const offAdded = d.onChildAdded(playersRef, snap => {
        this.playersCache[snap.key] = snap.val(); emit();
      }, () => this.onStatus('Não foi possível atualizar os jogadores.'));
      const offChanged = d.onChildChanged(playersRef, snap => {
        this.playersCache[snap.key] = snap.val(); emit();
      });
      const offRemoved = d.onChildRemoved(playersRef, snap => {
        delete this.playersCache[snap.key]; emit();
      });
      this.unsubscribers.push(offAdded, offChanged, offRemoved);

      const offMeta = d.onValue(metaRef, snapshot => {
        if (snapshot.val()?.open !== true && !this._leaving) {
          this.onClosed('O professor encerrou esta sala. Você pode continuar explorando sozinho.');
          void this.leave();
        }
      });
      this.unsubscribers.push(offMeta);
      return { roomCode, nick: chosen, uid, spawn: initial, capacity: maxPlayers };
    } catch (err) {
      await this.leave();
      throw err;
    }
  }

  publish({ x, z, yaw, moving }, now = performance.now(), force = false) {
    if (!this.active || !this.isConnected || this._leaving || !this.client) return;
    if (!force && now - this.lastSendAt < 250) return; // no máximo 4 atualizações/s por aluno
    const position = {
      x: Math.max(-18.3, Math.min(18.3, Number(x) || 0)),
      z: Math.max(-11, Math.min(11.6, Number(z) || 0)),
      yaw: Math.atan2(Math.sin(Number(yaw) || 0), Math.cos(Number(yaw) || 0)),
      moving: Boolean(moving)
    };
    const last = this.lastPayload;
    const changed = !last || Math.hypot(position.x - last.x, position.z - last.z) > .045 ||
      Math.abs(position.yaw - last.yaw) > .07 || position.moving !== last.moving;
    if (!changed && !force) return;
    this.lastSendAt = now;
    this.lastPayload = position;
    const { db, dbLib: d } = this.client;
    d.update(this.myRef, { ...position, ts: d.serverTimestamp() }).catch(() => {
      this.onStatus('Reconectando...');
    });
  }

  async leave() {
    if (this._leaving) return;
    this._leaving = true;
    this.active = false;
    const off = this.unsubscribers.splice(0);
    for (const fn of off) { try { fn(); } catch { /* listener desmontado */ } }
    if (this.client && this.myRef) {
      const d = this.client.dbLib;
      try { await d.remove(this.myRef); } catch { /* se offline, o onDisconnect remove */ }
      try { await this.disconnectOp?.cancel(); } catch { /* conexão encerrada */ }
    }
    this.myRef = null;
    this.disconnectOp = null;
    this.roomCode = null;
    this.uid = null;
    this.isConnected = false;
    this.lastPayload = null;
    this.playersCache = {};
    this.onPlayers({}, null);
    this.onCount(0, 30);
    this.onStatus('Modo individual');
    this._leaving = false;
  }
}
