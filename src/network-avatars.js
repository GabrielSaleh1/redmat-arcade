import * as THREE from 'three';
import { scene } from './core.js';
import { createMatinho } from './matinho.js';

// Os personagens locais e remotos usam EXATAMENTE o mesmo modelo 3D
// e o mesmo animador de src/matinho.js. Somente a posição e a animação
// dos personagens remotos chegam pela rede; cada nome é desenhado acima
// da cabeça em seu próprio dispositivo.

function nameSprite(nick, self = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d');
  c.fillStyle = self ? 'rgba(18,76,93,.91)' : 'rgba(14,20,54,.92)';
  c.strokeStyle = self ? '#6effd6' : '#ffd956';
  c.lineWidth = 5;
  c.beginPath(); c.roundRect(8, 15, 496, 98, 26); c.fill(); c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = 'bold 45px Arial, sans-serif';
  c.fillStyle = '#ffffff'; c.shadowColor = '#000'; c.shadowBlur = 6;
  let title = nick;
  while (c.measureText(title).width > 455 && c.font.includes('45px')) {
    c.font = 'bold 39px Arial, sans-serif';
    break;
  }
  c.fillText(title, 256, 66, 456);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true }));
  sprite.scale.set(2.9, .72, 1); sprite.position.set(0, 3.3, 0);
  sprite.userData.ownedLabelTexture = texture;
  return sprite;
}

export class OnlineAvatars {
  constructor() {
    this.remotes = new Map();
    this.localLabel = null;
    this.localGroup = null;
  }

  setLocalName(playerGroup, nick) {
    this.localGroup = playerGroup;
    this.removeLocalName();
    this.localLabel = nameSprite(nick, true);
    playerGroup.add(this.localLabel);
  }

  removeLocalName() {
    if (!this.localLabel) return;
    this.localLabel.parent?.remove(this.localLabel);
    this.localLabel.userData.ownedLabelTexture?.dispose();
    this.localLabel.material.dispose();
    this.localLabel = null;
  }

  sync(players, myUid) {
    const incoming = new Set();
    for (const [uid, raw] of Object.entries(players || {})) {
      if (uid === myUid || !raw || typeof raw.nick !== 'string') continue;
      if (!Number.isFinite(raw.x) || !Number.isFinite(raw.z)) continue;
      incoming.add(uid);
      let item = this.remotes.get(uid);
      if (!item) {
        // Modelo completo: jaleco, rosto animado, óculos, braços articulados,
        // sapatos e todos os elementos iguais aos do Matinho local.
        const avatar = createMatinho({ remote: true });
        avatar.group.position.set(raw.x, 0, raw.z);
        avatar.group.rotation.y = Number.isFinite(raw.yaw) ? raw.yaw : 0;
        const label = nameSprite(raw.nick.slice(0, 18));
        avatar.group.add(label);
        item = {
          avatar,
          group: avatar.group,
          label,
          name: raw.nick,
          targetX: raw.x,
          targetZ: raw.z,
          targetYaw: Number.isFinite(raw.yaw) ? raw.yaw : 0,
          moving: !!raw.moving
        };
        this.remotes.set(uid, item);
      }
      if (raw.nick !== item.name) {
        item.group.remove(item.label);
        item.label.userData.ownedLabelTexture?.dispose();
        item.label.material.dispose();
        item.name = raw.nick;
        item.label = nameSprite(raw.nick.slice(0, 18));
        item.group.add(item.label);
      }
      item.targetX = raw.x;
      item.targetZ = raw.z;
      item.targetYaw = Number.isFinite(raw.yaw) ? raw.yaw : 0;
      item.moving = !!raw.moving;
    }
    for (const uid of this.remotes.keys()) if (!incoming.has(uid)) this.remove(uid);
  }

  update(dt) {
    const follow = 1 - Math.exp(-10 * dt);
    for (const item of this.remotes.values()) {
      const { group } = item;
      const distanceToTarget = Math.hypot(item.targetX - group.position.x, item.targetZ - group.position.z);
      group.position.x += (item.targetX - group.position.x) * follow;
      group.position.z += (item.targetZ - group.position.z) * follow;
      const delta = Math.atan2(Math.sin(item.targetYaw - group.rotation.y), Math.cos(item.targetYaw - group.rotation.y));
      group.rotation.y += delta * follow;

      // Reaproveita TODAS as animações da versão principal (respiração,
      // caminhada, expressões, movimento do jaleco e piscadas).
      // As coordenadas são interpoladas entre as atualizações do Firebase.
      const walking = item.moving || distanceToTarget > .06;
      item.avatar.update(dt, { speed: walking ? 4.6 : 0 });
    }
  }

  remove(uid) {
    const item = this.remotes.get(uid);
    if (!item) return;
    item.group.remove(item.label);
    item.label.userData.ownedLabelTexture?.dispose();
    item.label.material.dispose();
    scene.remove(item.group);

    // O modelo procedural gera geometrias e materiais próprios por usuário.
    // Liberá-los ao sair evita acúmulo de memória em oficinas com entradas/saídas.
    item.group.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) material?.dispose();
      // As texturas comuns do rosto e da identidade REDMAT são reutilizadas
      // por outros Matinhos e não devem ser destruídas aqui.
    });
    this.remotes.delete(uid);
  }

  clear() {
    for (const uid of [...this.remotes.keys()]) this.remove(uid);
  }
}
