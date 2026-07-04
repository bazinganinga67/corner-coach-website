import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  createGloveBodyGeometry,
  createCuffGeometry,
  createLeatherMaps,
  mirrorGeometry,
} from './gloveGeometry';
import { sceneState } from './sceneState';

/**
 * The hero object: a PAIR of sculpted PBR boxing gloves in guard stance.
 *
 * Two gloves instead of one because a pair is unmistakable — the mirrored
 * silhouettes disambiguate each other the way a single form never can.
 * Realism comes from the material stack: crimson leather with procedural
 * grain (bump + roughness breakup) and a clearcoat layer for the waxy sheen,
 * lit by the studio rig + environment in SceneContainer.
 *
 * Motion is deliberately restrained — this is a product render, not a toy:
 * a slow float, a gentle ~20° presentation turn across the entire page, and
 * a subtle magnetic tilt toward the cursor. Section impacts add a short
 * lunge + inner flash. No allocations inside useFrame.
 */

// HDR ring colors — well above 1.0 so bloom reads them as neon.
const RING_A = new THREE.Color('#FF2E3E').multiplyScalar(3.2);
const RING_B = new THREE.Color('#FF2E3E').multiplyScalar(1.6);
const RING_C = new THREE.Color('#FF7A5C').multiplyScalar(2.2);

interface GloveParts {
  body: THREE.BufferGeometry;
  cuff: THREE.BufferGeometry;
  leather: THREE.MeshPhysicalMaterial;
  cuffLeather: THREE.MeshPhysicalMaterial;
  trim: THREE.MeshPhysicalMaterial;
}

/** One glove: body + cuff assembly (ribbed elastic, opening trim, strap). */
function GloveUnit({ body, cuff, leather, cuffLeather, trim }: GloveParts) {
  return (
    <group>
      <mesh geometry={body} material={leather} frustumCulled={false} />
      <group position={[0, -1.0, 0]}>
        <mesh geometry={cuff} material={cuffLeather} />
        <mesh position={[0, -0.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.72, 0.055, 12, 72]} />
          <primitive object={trim} attach="material" />
        </mesh>
        <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.64, 0.05, 12, 72]} />
          <primitive object={trim} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

export function CinematicObject() {
  const groupRef = useRef<THREE.Group>(null);
  const leftRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const parts = useMemo(() => {
    const maps = createLeatherMaps();
    maps.bump.repeat.set(4, 4);
    maps.rough.repeat.set(4, 4);

    const leather = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#8a1518'), // deep oxblood crimson; rich and authoritative
      roughness: 0.65,
      roughnessMap: maps.rough,
      bumpMap: maps.bump,
      bumpScale: 0.45,
      clearcoat: 0.75,
      clearcoatRoughness: 0.25,
      envMapIntensity: 2.0,
      emissive: new THREE.Color('#FF2E3E'),
      emissiveIntensity: 0,
    });

    // The cuff reads as the same leather, a shade deeper and less coated.
    const cuffLeather = leather.clone();
    cuffLeather.color.set('#681014');
    cuffLeather.clearcoat = 0.4;

    const trim = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#17171a'),
      roughness: 0.6,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.8,
    });

    const bodyRight = createGloveBodyGeometry();
    return {
      bodyRight,
      bodyLeft: mirrorGeometry(bodyRight),
      cuff: createCuffGeometry(),
      leather,
      cuffLeather,
      trim,
    };
  }, []);

  useEffect(
    () => () => {
      parts.bodyRight.dispose();
      parts.bodyLeft.dispose();
      parts.cuff.dispose();
      parts.leather.bumpMap?.dispose();
      parts.leather.roughnessMap?.dispose();
      parts.leather.dispose();
      parts.cuffLeather.dispose();
      parts.trim.dispose();
    },
    [parts],
  );

  const dampedMouse = useRef(new THREE.Vector2(0, 0));

  useFrame((state, delta) => {
    const group = groupRef.current;
    const left = leftRef.current;
    const rings = ringsRef.current;
    if (!group || !left || !rings) return;

    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const mouse = dampedMouse.current;

    mouse.x = THREE.MathUtils.damp(mouse.x, sceneState.pointer.x, 2.5, dt);
    mouse.y = THREE.MathUtils.damp(mouse.y, sceneState.pointer.y, 2.5, dt);

    // Restrained presentation: ~20° total turn over the whole page, slow
    // breath-rate float, small magnetic tilt. Nothing spins, nothing whips.
    group.rotation.x = 0.06 + Math.sin(t * 0.2) * 0.02 - mouse.y * 0.1;
    group.rotation.y = Math.sin(t * 0.14) * 0.05 + sceneState.scroll * 0.35 + mouse.x * 0.14;
    group.rotation.z = -0.04 + Math.cos(t * 0.17) * 0.015;
    group.position.y = Math.sin(t * 0.5) * 0.05;

    // The rear glove bobs on its own phase so the pair feels alive.
    left.position.y = -0.28 + Math.sin(t * 0.5 + 1.6) * 0.035;

    rings.rotation.z = t * 0.1;
    rings.rotation.x = Math.PI * 0.44 + Math.sin(t * 0.2) * 0.08 - mouse.y * 0.08;
    rings.rotation.y = -sceneState.scroll * 0.35 + mouse.x * 0.1;
  });

  const gloveParts: GloveParts = {
    body: parts.bodyRight,
    cuff: parts.cuff,
    leather: parts.leather,
    cuffLeather: parts.cuffLeather,
    trim: parts.trim,
  };

  return (
    <group ref={groupRef} scale={0.8}>
      {/* Lead (right) glove: forward, angled slightly in. */}
      <group position={[0.58, 0.08, 0.25]} rotation={[0.05, -0.35, -0.08]}>
        <GloveUnit {...gloveParts} />
      </group>

      {/* Rear (left) glove: mirrored, tucked back and low — guard stance. */}
      <group ref={leftRef} position={[-0.62, -0.28, -0.45]} rotation={[0.02, 0.4, 0.12]}>
        <GloveUnit {...gloveParts} body={parts.bodyLeft} />
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
