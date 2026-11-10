/**
 * Animação procedural do Matinho Doutor.
 * Não usa rig externo: controla os grupos articulados presentes em buildMatinho().
 * As transições são suavizadas por amortecimento independente do FPS.
 */
import * as THREE from 'three';

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;

export function createCharacterAnimator(player) {
  let locomotion = 0;
  let sprint = 0;
  let phase = 0;
  let gesture = 0;
  let look = 0;

  return {
    update({ dt, elapsed, moving = false, running = false, interacting = false, machineNearby = false }) {
      locomotion = damp(locomotion, moving ? 1 : 0, moving ? 9 : 6.5, dt);
      sprint = damp(sprint, moving && running ? 1 : 0, 6.5, dt);
      gesture = damp(gesture, interacting ? 1 : machineNearby && !moving ? .22 : 0, interacting ? 13 : 5, dt);
      look = damp(look, machineNearby ? 1 : 0, 4, dt);

      const gaitSpeed = 8.7 + sprint * 4.5;
      phase += gaitSpeed * dt * Math.max(.12, locomotion);
      const stride = Math.sin(phase);
      const lift = Math.abs(Math.cos(phase));
      const amplitude = locomotion * (.44 + sprint * .21);
      const breathe = Math.sin(elapsed * 1.8);
      const idle = 1 - locomotion;

      // Movimento dos pés opostos: corre mais forte, caminha com passos menores.
      player.legs[0].rotation.x = damp(player.legs[0].rotation.x, stride * amplitude, 12, dt);
      player.legs[1].rotation.x = damp(player.legs[1].rotation.x, -stride * amplitude, 12, dt);
      player.legs[0].rotation.z = damp(player.legs[0].rotation.z, -.025 * locomotion, 8, dt);
      player.legs[1].rotation.z = damp(player.legs[1].rotation.z, .025 * locomotion, 8, dt);

      const armSwing = .82 * amplitude;
      const armTargetL = -stride * armSwing + .04 * breathe * idle;
      const armTargetR = stride * armSwing + .04 * breathe * idle;
      player.arms[0].rotation.x = damp(player.arms[0].rotation.x, armTargetL - gesture * .23, 10, dt);
      player.arms[1].rotation.x = damp(player.arms[1].rotation.x, armTargetR - gesture * 1.24, 10, dt);
      player.arms[0].rotation.z = damp(player.arms[0].rotation.z, -.12 - gesture * .16, 9, dt);
      player.arms[1].rotation.z = damp(player.arms[1].rotation.z, .12 - gesture * .3, 9, dt);

      // O jaleco acompanha o caminhar, mas não atravessa exageradamente o corpo.
      for (const [i, flap] of (player.coatTails || []).entries()) {
        flap.rotation.x = damp(flap.rotation.x, locomotion * (.09 + sprint * .12) + stride * amplitude * (i ? -.07 : .07), 8, dt);
        flap.rotation.z = damp(flap.rotation.z, (i ? 1 : -1) * (.035 + locomotion * .04), 7, dt);
      }

      player.root.position.y = damp(player.root.position.y, .018 * breathe * idle + lift * .072 * locomotion, 11, dt);
      player.root.rotation.z = damp(player.root.rotation.z, Math.sin(phase) * locomotion * .021 + Math.sin(elapsed * .8) * idle * .009, 7, dt);
      player.root.rotation.x = damp(player.root.rotation.x, (.045 + sprint * .065) * locomotion, 7, dt);
      player.head.rotation.z = damp(player.head.rotation.z, Math.sin(elapsed * 1.4) * .025 * idle + Math.sin(phase) * .022 * locomotion, 5, dt);
      player.head.rotation.y = damp(player.head.rotation.y, Math.sin(elapsed * 1.05) * .045 * idle + .12 * look, 4, dt);
      player.head.rotation.x = damp(player.head.rotation.x, -gesture * .08 + Math.sin(elapsed * 1.9) * .015 * idle, 5, dt);

      // Leve sensação de presença, nunca pulsa até uma escala desproporcional.
      const breathScale = 1 + Math.sin(elapsed * 1.8) * .006 * (1 - locomotion);
      player.root.scale.setScalar(.95 * clamp(breathScale, .99, 1.01));
    }
  };
}
