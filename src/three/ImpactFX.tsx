import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sceneState } from './sceneState';

/**
 * Section-impact pyrotechnics: an expanding shockwave ring and a burst of
 * sparks, both driven entirely by the single `sceneState.impact` scalar.
 *
 * Everything is GPU-resident: spark trajectories are baked into vertex
 * attributes at build time and replayed by remapping `uImpact` (1 → 0) to
 * radial distance in the vertex shader. The CPU cost per frame is two
 * uniform writes; when impact fades below threshold the whole group sets
 * `visible = false` and costs nothing at all.
 */

const SPARK_COUNT = 120;

const WAVE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WAVE_FRAGMENT = /* glsl */ `
uniform float uRadius;
uniform float uAlpha;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float d = length(vUv - vec2(0.5)) * 2.0;
  // Soft trailing edge, crisp leading edge.
  float ring = smoothstep(uRadius - 0.28, uRadius, d) * (1.0 - smoothstep(uRadius, uRadius + 0.10, d));
  if (ring < 0.001) discard;
  gl_FragColor = vec4(uColor * 1.6, ring * uAlpha);
}
`;

const SPARK_VERTEX = /* glsl */ `
uniform float uImpact;
uniform float uPixelRatio;

attribute vec3 aDir;
attribute float aSpeed;
attribute float aSize;

varying float vAlpha;

void main() {
  // Replay the burst: impact 1 → 0 maps to radius 0.9 → ~3.7 (per-spark speed).
  float travel = (1.0 - uImpact);
  vec3 pos = aDir * (0.9 + travel * 2.8 * aSpeed);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  vAlpha = pow(uImpact, 1.4);
  gl_PointSize = aSize * uPixelRatio * (30.0 / -mvPosition.z) * (0.35 + uImpact * 0.65);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const SPARK_FRAGMENT = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorEmber;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float mask = smoothstep(0.5, 0.03, d);
  if (mask < 0.001) discard;
  // White-hot center cooling to ember red at the sprite edge.
  vec3 col = mix(uColorCore, uColorEmber, smoothstep(0.0, 0.4, d));
  gl_FragColor = vec4(col * 2.2, mask * vAlpha);
}
`;

export function ImpactFX() {
  const rootRef = useRef<THREE.Group>(null);
  const waveRef = useRef<THREE.Mesh>(null);

  const waveMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WAVE_VERTEX,
        fragmentShader: WAVE_FRAGMENT,
        uniforms: {
          uRadius: { value: 0 },
          uAlpha: { value: 0 },
          uColor: { value: new THREE.Color('#CC5555') },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const sparkGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(SPARK_COUNT * 3); // required attr; real pos comes from aDir
    const dirs = new Float32Array(SPARK_COUNT * 3);
    const speeds = new Float32Array(SPARK_COUNT);
    const sizes = new Float32Array(SPARK_COUNT);

    for (let i = 0; i < SPARK_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const cosPhi = Math.random() * 2 - 1;
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
      dirs[i * 3] = sinPhi * Math.cos(theta);
      dirs[i * 3 + 1] = cosPhi;
      dirs[i * 3 + 2] = sinPhi * Math.sin(theta);
      speeds[i] = 0.45 + Math.random() * 0.9;
      sizes[i] = 0.7 + Math.random() * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  const sparkMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPARK_VERTEX,
        fragmentShader: SPARK_FRAGMENT,
        uniforms: {
          uImpact: { value: 0 },
          uPixelRatio: { value: 1 },
          uColorCore: { value: new THREE.Color('#FFCC99') },
          uColorEmber: { value: new THREE.Color('#CC5533') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useEffect(
    () => () => {
      waveMaterial.dispose();
      sparkGeometry.dispose();
      sparkMaterial.dispose();
    },
    [waveMaterial, sparkGeometry, sparkMaterial],
  );

  useFrame((state) => {
    const root = rootRef.current;
    const wave = waveRef.current;
    if (!root || !wave) return;

    const impact = sceneState.impact;
    const active = impact > 0.012;
    root.visible = active;
    if (!active) return;

    waveMaterial.uniforms.uRadius.value = THREE.MathUtils.lerp(1.0, 0.06, impact);
    waveMaterial.uniforms.uAlpha.value = Math.pow(impact, 1.2) * 0.5;
    sparkMaterial.uniforms.uImpact.value = impact;
    sparkMaterial.uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Billboard the shockwave to the (constantly moving) camera.
    wave.quaternion.copy(state.camera.quaternion);
  });

  return (
    <group ref={rootRef} visible={false}>
      <mesh ref={waveRef} scale={7.5} renderOrder={10}>
        <planeGeometry args={[1, 1]} />
        <primitive object={waveMaterial} attach="material" />
      </mesh>
      <points geometry={sparkGeometry} material={sparkMaterial} frustumCulled={false} />
    </group>
  );
}
