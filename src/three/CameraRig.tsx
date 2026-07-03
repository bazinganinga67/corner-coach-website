import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sceneState, SCENE_SECTION_IDS } from './sceneState';

/**
 * Scroll-driven cinematic camera.
 *
 * Each DOM section owns a "shot" (position, look-at, focal length, dutch
 * roll). The rig measures where those sections actually live on the page
 * (via sceneState), builds a keyframe track, and interpolates along it with
 * smoothstep easing inside each segment. Frame-rate-independent exponential
 * damping on top of the already-Lenis-smoothed scroll gives the camera its
 * weight — it always arrives, never snaps.
 *
 * The rig is also the referee: it knows which shot is live, so when the
 * scroll crosses into a new section it fires `sceneState.impact = 1` — the
 * single scalar that detonates the punch lunge, shockwave, sparks, shake,
 * FOV kick, and bloom/aberration spikes across the other components.
 *
 * Zero allocations in the frame loop: every vector below is created once.
 */

interface Shot {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  /** Dutch-angle roll in radians, applied after lookAt. */
  roll: number;
}

/**
 * The shot list — the film language of the page. Note: look-at x is
 * inverted vs. frame position (aiming LEFT of the glove pushes it RIGHT
 * in frame).
 *
 *  top           hero: glove framed right, behind the phone, medium lens
 *  numbers       overhead crane down as the numbers pin
 *  how-it-works  low lateral dolly, side profile, slight dutch
 *  voice         wide-lens close-up, in your face like a cornerman
 *  pricing       pulled-back three-quarter, calm
 *  download      long-lens low hero shot, looking up — the finale
 */
const SHOTS: Record<string, Shot> = {
  top: { pos: [2.2, 0.3, 6.6], look: [-1.35, 0.1, 0], fov: 42, roll: 0 },
  numbers: { pos: [-0.8, 3.6, 4.2], look: [0, 0.1, 0], fov: 55, roll: -0.055 },
  'how-it-works': { pos: [-4.8, -0.9, 3.0], look: [0.9, 0.1, 0], fov: 38, roll: 0.05 },
  voice: { pos: [0.3, -0.1, 3.4], look: [0, 0.25, 0], fov: 58, roll: -0.035 },
  pricing: { pos: [3.4, 2.2, 5.6], look: [0.7, 0.3, 0], fov: 45, roll: 0.04 },
  download: { pos: [0, -0.8, 7.8], look: [0, 0.5, 0], fov: 32, roll: 0 },
};

interface TrackPoint {
  at: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
  roll: number;
}

// Damping half-life coefficients. Lower = heavier camera.
const LAMBDA_POS = 2.2;
const LAMBDA_LOOK = 2.8;
const LAMBDA_FOV = 2.5;
const LAMBDA_ROLL = 3.0;
const LAMBDA_PARALLAX = 1.8;

// Impact tuning.
const SHAKE_AMPLITUDE = 0.055;
const FOV_KICK = 6;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function CameraRig() {
  // Pre-allocated keyframe pool + scratch vectors — reused every frame/rebuild.
  const scratch = useMemo(() => {
    const pool: TrackPoint[] = SCENE_SECTION_IDS.map(() => ({
      at: 0,
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      fov: 45,
      roll: 0,
    }));
    return {
      pool,
      trackLen: 0,
      builtVersion: -1,
      targetPos: new THREE.Vector3().fromArray(SHOTS.top.pos),
      targetLook: new THREE.Vector3().fromArray(SHOTS.top.look),
      currentLook: new THREE.Vector3().fromArray(SHOTS.top.look),
      parallax: new THREE.Vector2(0, 0),
    };
  }, []);

  const targetFov = useRef(SHOTS.top.fov);
  const targetRoll = useRef(SHOTS.top.roll);
  const currentRoll = useRef(SHOTS.top.roll);

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(delta, 1 / 30);
    const s = scratch;

    // Rebuild the track only when section measurements change (resize,
    // ScrollTrigger refresh) — detected by version counter, not deep compare.
    if (s.builtVersion !== sceneState.stopsVersion) {
      s.builtVersion = sceneState.stopsVersion;
      let len = 0;
      for (const stop of sceneState.stops) {
        const shot = SHOTS[stop.id];
        if (!shot) continue;
        const point = s.pool[len++];
        point.at = stop.at;
        point.pos.fromArray(shot.pos);
        point.look.fromArray(shot.look);
        point.fov = shot.fov;
        point.roll = shot.roll;
      }
      if (len === 0) {
        const point = s.pool[len++];
        point.at = 0;
        point.pos.fromArray(SHOTS.top.pos);
        point.look.fromArray(SHOTS.top.look);
        point.fov = SHOTS.top.fov;
        point.roll = SHOTS.top.roll;
      }
      s.trackLen = len;
    }

    // ---- Interpolate the shot track ----
    const p = sceneState.scroll;
    const last = s.trackLen - 1;

    if (p <= s.pool[0].at || last === 0) {
      s.targetPos.copy(s.pool[0].pos);
      s.targetLook.copy(s.pool[0].look);
      targetFov.current = s.pool[0].fov;
      targetRoll.current = s.pool[0].roll;
    } else if (p >= s.pool[last].at) {
      s.targetPos.copy(s.pool[last].pos);
      s.targetLook.copy(s.pool[last].look);
      targetFov.current = s.pool[last].fov;
      targetRoll.current = s.pool[last].roll;
    } else {
      let i = 0;
      while (i < last - 1 && p > s.pool[i + 1].at) i++;
      const a = s.pool[i];
      const b = s.pool[i + 1];
      const span = Math.max(b.at - a.at, 1e-4);
      const t = smoothstep(Math.min(Math.max((p - a.at) / span, 0), 1));

      s.targetPos.lerpVectors(a.pos, b.pos, t);
      s.targetLook.lerpVectors(a.look, b.look, t);
      targetFov.current = THREE.MathUtils.lerp(a.fov, b.fov, t);
      targetRoll.current = THREE.MathUtils.lerp(a.roll, b.roll, t);
    }

    // ---- Section-crossing detection → impact trigger ----
    // The live shot is the last keyframe whose anchor the scroll has passed.
    let shotIndex = 0;
    for (let i = last; i >= 0; i--) {
      if (p >= s.pool[i].at - 1e-4) {
        shotIndex = i;
        break;
      }
    }
    if (shotIndex !== sceneState.activeShot) {
      // Fire only on real transitions (not the initial resolve), and don't
      // machine-gun retrigger while a hit is still ringing.
      if (sceneState.activeShot !== -1 && sceneState.impact < 0.55) {
        sceneState.impact = 1;
      }
      sceneState.activeShot = shotIndex;
    }

    // ---- Natural operator sway + mouse parallax ----
    const t = state.clock.elapsedTime;
    s.targetPos.y += Math.sin(t * 0.22) * 0.025;
    s.targetPos.x += Math.sin(t * 0.18 + 1.2) * 0.018;

    s.parallax.x = THREE.MathUtils.damp(s.parallax.x, sceneState.pointer.x, LAMBDA_PARALLAX, dt);
    s.parallax.y = THREE.MathUtils.damp(s.parallax.y, sceneState.pointer.y, LAMBDA_PARALLAX, dt);
    s.targetPos.x += s.parallax.x * 0.25;
    s.targetPos.y += s.parallax.y * 0.15;
    s.targetLook.x += s.parallax.x * 0.06;
    s.targetLook.y += s.parallax.y * 0.04;

    // ---- Damp everything toward the target ----
    cam.position.x = THREE.MathUtils.damp(cam.position.x, s.targetPos.x, LAMBDA_POS, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, s.targetPos.y, LAMBDA_POS, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, s.targetPos.z, LAMBDA_POS, dt);

    // ---- Impact shake: multi-frequency, decays with the impact scalar ----
    const k = sceneState.impact * sceneState.impact;
    if (k > 0.0001) {
      cam.position.x += (Math.sin(t * 39.7) + Math.sin(t * 63.1) * 0.5) * SHAKE_AMPLITUDE * k;
      cam.position.y += (Math.cos(t * 47.3) + Math.cos(t * 71.9) * 0.5) * SHAKE_AMPLITUDE * 0.85 * k;
    }

    s.currentLook.x = THREE.MathUtils.damp(s.currentLook.x, s.targetLook.x, LAMBDA_LOOK, dt);
    s.currentLook.y = THREE.MathUtils.damp(s.currentLook.y, s.targetLook.y, LAMBDA_LOOK, dt);
    s.currentLook.z = THREE.MathUtils.damp(s.currentLook.z, s.targetLook.z, LAMBDA_LOOK, dt);
    cam.lookAt(s.currentLook);

    // Dutch roll rides on top of lookAt (which resets camera roll each frame).
    currentRoll.current = THREE.MathUtils.damp(
      currentRoll.current,
      targetRoll.current,
      LAMBDA_ROLL,
      dt,
    );
    cam.rotateZ(currentRoll.current);

    // ---- FOV: damped lens change + impact punch-in ----
    const dampedFov = THREE.MathUtils.damp(cam.fov + k * FOV_KICK, targetFov.current, LAMBDA_FOV, dt);
    const nextFov = dampedFov - k * FOV_KICK;
    // updateProjectionMatrix isn't free — only pay for it when fov moves.
    if (Math.abs(nextFov - cam.fov) > 0.005) {
      cam.fov = nextFov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
