import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';

import { CameraRig } from './CameraRig';
import { ParticleField } from './ParticleField';
import { ImpactFX } from './ImpactFX';
import { Effects } from './Effects';
import { sceneState, useSceneStateBindings } from './sceneState';

function ScrollSync() {
  useFrame((_, delta) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const raw = THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
    const dt = Math.max(Math.min(delta, 1 / 30), 1e-4);

    const instantaneous = (raw - sceneState.scroll) / dt;
    sceneState.velocity = THREE.MathUtils.damp(sceneState.velocity, instantaneous, 5, dt);
    sceneState.scroll = raw;

    sceneState.impact = sceneState.impact < 0.001 ? 0 : sceneState.impact * Math.exp(-dt * 2.4);
  }, -100);
  return null;
}

function GymLighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#1a1a24" />
      <hemisphereLight
        args={['#2a2018', '#0a0a12', 0.4]}
        position={[0, 2, 0]}
      />
      <directionalLight
        position={[2.5, 4, 2]}
        intensity={0.6}
        color="#ffd9b3"
        castShadow={false}
      />
      <directionalLight
        position={[-0.5, 0.5, -1]}
        intensity={0.15}
        color="#4a6a8a"
      />
      <pointLight
        position={[0, 3.5, 0]}
        intensity={0.08}
        color="#ffcc88"
        distance={6}
        decay={1.5}
      />
      <fog
        attach="fog"
        args={[new THREE.Color('#050508'), 8, 18]}
      />
    </>
  );
}

function GymAtmosphere() {
  const coneRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const coneGeo = useMemo(() => new THREE.CylinderGeometry(0.05, 2.8, 5, 32, 1, true), []);
  const coneMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            float dist = abs(vUv.x - 0.5) * 2.0;
            float alpha = smoothstep(1.0, 0.1, dist);
            alpha *= smoothstep(0.0, 0.6, vUv.y);
            alpha *= 0.035;
            float flicker = 0.85 + 0.15 * sin(uTime * 1.3 + vUv.y * 10.0);
            gl_FragColor = vec4(1.0, 0.85, 0.6, alpha * flicker);
          }
        `,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame((_, delta) => {
    coneMat.uniforms.uTime.value = (coneMat.uniforms.uTime.value as number) + delta;
    if (coneRef.current) {
      coneRef.current.rotation.z = Math.sin(performance.now() * 0.0001) * 0.02;
    }
  });

  useEffect(() => () => { coneGeo.dispose(); coneMat.dispose(); }, [coneGeo, coneMat]);

  return (
    <mesh ref={coneRef} geometry={coneGeo} material={coneMat} position={[0.5, 2.5, -0.5]} rotation={[0.15, 0, 0.05]} />
  );
}

function GymFloor() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(30, 30);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -2.2, 0);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0a0e',
        roughness: 0.9,
        metalness: 0.0,
        transparent: true,
        opacity: 0.6,
      }),
    [],
  );

  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  return <mesh geometry={geo} material={mat} />;
}

function canRenderScene(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const DPR_MAX = 1.75;

export default function SceneContainer() {
  const [dpr, setDpr] = useState(() =>
    Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5),
  );
  const supported = useMemo(canRenderScene, []);

  useSceneStateBindings();

  if (!supported) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <Canvas
        flat
        dpr={dpr}
        frameloop="always"
        performance={{ min: 0.5 }}
        camera={{ fov: 42, near: 0.1, far: 80, position: [2.6, 0.3, 5.8] }}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#050508']} />

        <GymLighting />
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(window.devicePixelRatio || 1, DPR_MAX))}
          onDecline={() => setDpr(1)}
        >
          <ScrollSync />
          <CameraRig />
          <GymFloor />
          <GymAtmosphere />
          <Suspense fallback={null}>
            <ParticleField />
            <ImpactFX />
          </Suspense>
          <Effects />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
