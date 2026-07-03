import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createGloveBodyGeometry, createCuffGeometry, createLeatherMaps } from './gloveGeometry';
import { sceneState } from './sceneState';

/**
 * The hero object: a sculpted PBR boxing glove.
 *
 * Realism comes from the material stack, not tricks: crimson leather with
 * procedural grain (bump + roughness breakup), a clearcoat layer for the
 * waxy sheen real gloves have, and the studio light rig + environment in
 * SceneContainer providing believable specular. The neon lives around the
 * glove (orbit rings, particles, impacts) — never on it.
 *
 * Motion: heavy floating idle, magnetic tilt toward the cursor, a slow
 * presentation turn across the page scroll, and a punch lunge + inner
 * emissive flash on section impacts. No allocations inside useFrame.
 */

// HDR ring colors — well above 1.0 so bloom reads them as neon.
const RING_A = new THREE.Color('#FF2E3E').multiplyScalar(2.6);
const RING_B = new THREE.Color('#FF2E3E').multiplyScalar(1.3);
const RING_C = new THREE.Color('#FF7A5C').multiplyScalar(1.8);

export function CinematicObject() {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const { bodyGeometry, cuffGeometry, leather, cuffLeather, trim } = useMemo(() => {
    const maps = createLeatherMaps();
    maps.bump.repeat.set(4, 4);
    maps.rough.repeat.set(4, 4);

    const leatherMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#a81824'), // crimson; the key light lifts it further
      roughness: 0.72,
      roughnessMap: maps.rough,
      bumpMap: maps.bump,
      bumpScale: 0.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.5,
      emissive: new THREE.Color('#FF2E3E'),
      emissiveIntensity: 0,
    });

    // The cuff reads as the same leather, a shade deeper and less coated.
    const cuffMat = leatherMat.clone();
    cuffMat.color.set('#7d101d');
    cuffMat.clearcoat = 0.35;

    const trimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#17171a'),
      roughness: 0.6,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.8,
    });

    return {
      bodyGeometry: createGloveBodyGeometry(),
      cuffGeometry: createCuffGeometry(),
      leather: leatherMat,
      cuffLeather: cuffMat,
      trim: trimMat,
      maps,
    };
  }, []);

  useEffect(
    () => () => {
      bodyGeometry.dispose();
      cuffGeometry.dispose();
      leather.bumpMap?.dispose();
      leather.roughnessMap?.dispose();
      leather.dispose();
      cuffLeather.dispose();
      trim.dispose();
    },
    [bodyGeometry, cuffGeometry, leather, cuffLeather, trim],
  );

  const dampedMouse = useRef(new THREE.Vector2(0, 0));

  useFrame((state, delta) => {
    const group = groupRef.current;
    const rings = ringsRef.current;
    if (!group || !rings) return;

    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const mouse = dampedMouse.current;
    const impact = sceneState.impact;
    const punch = impact * impact;

    mouse.x = THREE.MathUtils.damp(mouse.x, sceneState.pointer.x, 2.5, dt);
    mouse.y = THREE.MathUtils.damp(mouse.y, sceneState.pointer.y, 2.5, dt);

    // Guard stance: knuckles angled toward the lens, slow presentation turn
    // over the scroll, magnetic tilt toward the cursor.
    group.rotation.x = 0.18 + Math.sin(t * 0.2) * 0.05 - mouse.y * 0.26 - punch * 0.16;
    group.rotation.y =
      0.55 + Math.sin(t * 0.14) * 0.3 + sceneState.scroll * Math.PI * 1.4 + mouse.x * 0.4;
    group.rotation.z = -0.24 + Math.cos(t * 0.17) * 0.04 + punch * 0.12;
    group.position.y = Math.sin(t * 0.5) * 0.1;
    group.position.z = punch * 1.0;

    // Inner flash on impact — the only moment the leather itself glows.
    leather.emissiveIntensity = punch * 0.35;

    rings.rotation.z = t * 0.14;
    rings.rotation.x = Math.PI * 0.44 + Math.sin(t * 0.2) * 0.12 - mouse.y * 0.16;
    rings.rotation.y = -sceneState.scroll * Math.PI * 0.9 + mouse.x * 0.2;
  });

  return (
    <group ref={groupRef} scale={0.92}>
      {/* Pose: raised fist — cuff down, knuckles up toward the lens, thumb
          quartered in. The iconic silhouette; reads as a glove instantly. */}
      <group rotation={[-0.35, 0.45, Math.PI]}>
        <mesh geometry={bodyGeometry} material={leather} frustumCulled={false} />

        {/* Cuff assembly: ribbed elastic, dark top band, wrist strap. */}
        <group position={[0, 1.0, 0]}>
          <mesh geometry={cuffGeometry} material={cuffLeather} />
          <mesh position={[0, 0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.05, 12, 72]} />
            <primitive object={trim} attach="material" />
          </mesh>
          <mesh position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.73, 0.055, 12, 72]} />
            <primitive object={trim} attach="material" />
          </mesh>
        </group>
      </group>

      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.45, 0.009, 8, 220]} />
          <meshBasicMaterial color={RING_A} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.45, 0]}>
          <torusGeometry args={[2.85, 0.006, 8, 220]} />
          <meshBasicMaterial color={RING_B} toneMapped={false} transparent opacity={0.75} />
        </mesh>
        <mesh rotation={[Math.PI / 1.8, -0.35, 0.2]}>
          <torusGeometry args={[3.25, 0.005, 8, 220]} />
          <meshBasicMaterial color={RING_C} toneMapped={false} transparent opacity={0.55} />
        </mesh>
      </group>
    </group>
  );
}
