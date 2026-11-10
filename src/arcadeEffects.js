/** Efeitos leves nas telas. Não interfere nas imagens de capa nem nos links dos jogos. */
import * as THREE from 'three';

let sharedTexture;
function getShineTexture() {
  if (sharedTexture) return sharedTexture;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256;
  const c = cv.getContext('2d');
  const grad = c.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(.3, 'rgba(255,255,255,.13)');
  grad.addColorStop(.52, 'rgba(255,255,255,.45)');
  grad.addColorStop(.74, 'rgba(255,255,255,.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = grad; c.fillRect(0, 0, 128, 256);
  sharedTexture = new THREE.CanvasTexture(cv);
  sharedTexture.colorSpace = THREE.SRGBColorSpace;
  return sharedTexture;
}

export function addMachineScreenEffect(screenGroup, index = 0, lite = false) {
  const material = new THREE.MeshBasicMaterial({
    map: getShineTexture(), transparent: true, opacity: 0,
    depthWrite: false, depthTest: true, toneMapped: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.29, 1.005), material);
  mesh.position.set(-.74, 0, .12);
  mesh.rotation.z = -.15;
  mesh.renderOrder = 4;
  screenGroup.add(mesh);
  const period = lite ? 11 : 7.5;
  const offset = (index * .67) % period;
  return {
    update(seconds, active) {
      const progress = ((seconds + offset) % period) / period;
      // Faixa dentro da tela — nunca extrapola a moldura.
      const visible = progress >= .09 && progress <= .39;
      mesh.visible = visible;
      if (!visible) return;
      const u = (progress - .09) / .30;
      mesh.position.x = -.72 + u * 1.44;
      material.opacity = (active ? .75 : .42) * Math.sin(Math.PI * u);
    }
  };
}
