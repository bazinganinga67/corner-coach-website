import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sceneState } from './sceneState';

/**
 * A sparse ember field wrapped around the hero object. One draw call,
 * custom point shader (soft round sprites, per-particle twinkle phase),
 * additive blending with depthWrite off so sorting never matters.
 */

const COUNT = 600;
const INNER_RADIUS = 3.2;
const OUTER_RADIUS = 11;

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aPhase;
attribute float aTint;

varying float vAlpha;
varying float vTint;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  float twinkle = 0.55 + 0.45 * sin(uTime * 0.7 + aPhase);
  // Fade with distance so far embers read as dust, not confetti.
  float depthFade = smoothstep(${OUTER_RADIUS.toFixed(1)}, 2.0, -mvPosition.z);

  vAlpha = twinkle * mix(0.35, 1.0, depthFade);
  vTint = aTint;

  gl_PointSize = aSize * uPixelRatio * (36.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColorDust;
uniform vec3 uColorEmber;

varying float vAlpha;
varying float vTint;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float mask = smoothstep(0.5, 0.05, d);
  if (mask < 0.001) discard;

  vec3 col = mix(uColorDust, uColorEmber, vTint);
  gl_FragColor = vec4(col, mask * vAlpha * 0.55);
}
`;

/* ─── dust particle system: warm motes in a spotlight cone ─── */

const DUST_COUNT = 200;

const DUST_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aPhase;
attribute float aDriftX;
attribute float aDriftZ;

varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  float twinkle = 0.5 + 0.5 * sin(uTime * 0.5 + aPhase * 2.0);
  float depthFade = smoothstep(16.0, 3.0, -mvPosition.z);

  vAlpha = twinkle * mix(0.15, 0.6, depthFade);

  gl_PointSize = aSize * uPixelRatio * (48.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColor;

varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float mask = smoothstep(0.5, 0.05, d);
  if (mask < 0.001) discard;

  gl_FragColor = vec4(uColor, mask * vAlpha * 0.5);
}
`;

function DustParticles() {
  const dustRef = useRef<THREE.Points>(null);
  const driftRef = useRef(0);

  const dustGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(DUST_COUNT * 3);
    const sizes = new Float32Array(DUST_COUNT);
    const phases = new Float32Array(DUST_COUNT);
    const drX = new Float32Array(DUST_COUNT);
    const drZ = new Float32Array(DUST_COUNT);

    // Cone apex at (-4, 4, 3) spreading downward-right
    const apex = new THREE.Vector3(-4, 4, 3);
    const dir = new THREE.Vector3(0.3, -0.7, -0.2);

    for (let i = 0; i < DUST_COUNT; i++) {
      const t = Math.pow(Math.random(), 0.6);
      const spread = 0.2 + t * 4.5;
      const angle = Math.random() * Math.PI * 2;

      pos[i * 3] = apex.x + dir.x * t * 8 + Math.cos(angle) * spread;
      pos[i * 3 + 1] = apex.y + dir.y * t * 8 + Math.sin(angle) * spread * 0.6;
      pos[i * 3 + 2] = apex.z + dir.z * t * 8 + Math.sin(angle) * spread * 0.4;

      sizes[i] = 1.2 + Math.random() * 2.4;
      phases[i] = Math.random() * Math.PI * 2;
      drX[i] = (Math.random() - 0.5) * 0.008;
      drZ[i] = (Math.random() - 0.5) * 0.005;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aDriftX', new THREE.BufferAttribute(drX, 1));
    geo.setAttribute('aDriftZ', new THREE.BufferAttribute(drZ, 1));
    return geo;
  }, []);

  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERTEX,
        fragmentShader: DUST_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color('#F5E6C8') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    dustMat.uniforms.uTime.value += dt;
    dustMat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    if (dustRef.current) {
      // Gentle brownian drift
      driftRef.current += dt * 0.2;
      const pos = dustGeo.attributes.position;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < DUST_COUNT; i++) {
        arr[i * 3] += Math.sin(driftRef.current + drX[i]) * 0.001;
        arr[i * 3 + 2] += Math.cos(driftRef.current + drZ[i]) * 0.0008;
      }
      pos.needsUpdate = true;
    }
  });

  const drX = useMemo(() => new Float32Array(DUST_COUNT), []);
  const drZ = useMemo(() => new Float32Array(DUST_COUNT), []);

  // Re-init drift arrays on mount
  useEffect(() => {
    for (let i = 0; i < DUST_COUNT; i++) {
      drX[i] = (Math.random() - 0.5) * 0.008;
      drZ[i] = (Math.random() - 0.5) * 0.005;
      dustGeo.attributes.aDriftX.array[i] = drX[i];
      dustGeo.attributes.aDriftZ.array[i] = drZ[i];
    }
  }, [drX, drZ, dustGeo]);

  return <points ref={dustRef} geometry={dustGeo} material={dustMat} frustumCulled={false} />;
}

export function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const tints = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Uniform-ish shell distribution: random direction, biased radius.
      const theta = Math.random() * Math.PI * 2;
      const cosPhi = Math.random() * 2 - 1;
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
      const r = INNER_RADIUS + Math.pow(Math.random(), 0.65) * (OUTER_RADIUS - INNER_RADIUS);

      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = r * cosPhi * 0.72; // squash vertically — cinematic letterbox space
      positions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

      sizes[i] = 0.6 + Math.random() * 1.4;
      phases[i] = Math.random() * Math.PI * 2;
      tints[i] = Math.random() < 0.28 ? 1 : 0; // ~1/4 read as red embers
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uColorDust: { value: new THREE.Color('#8A8F9C') },
          uColorEmber: { value: new THREE.Color('#FF2E3E') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const dt = Math.min(delta, 1 / 30);
    material.uniforms.uTime.value += dt;
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    points.rotation.y += dt * 0.018;
    points.rotation.y += (sceneState.velocity) * dt * 0.5;
    points.rotation.x = sceneState.scroll * 0.25;
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
      <DustParticles />
    </>
  );
}
