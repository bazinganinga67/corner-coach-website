import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  SMAA,
  Noise,
} from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';

import { sceneState } from './sceneState';

const CA_BASE = 0.00015;
const CA_VELOCITY_SCALE = 0.003;
const CA_MAX_EXTRA = 0.002;
const CA_IMPACT_KICK = 0.002;

const BLOOM_BASE = 0.25;
const BLOOM_IMPACT_KICK = 0.4;

export function Effects() {
  const caOffset = useMemo(() => new THREE.Vector2(CA_BASE, CA_BASE * 0.6), []);
  const caCurrent = useRef(CA_BASE);
  const bloomRef = useRef<BloomEffect>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const impact = sceneState.impact;

    const target =
      CA_BASE +
      Math.min(Math.abs(sceneState.velocity) * CA_VELOCITY_SCALE, CA_MAX_EXTRA) +
      impact * impact * CA_IMPACT_KICK;
    caCurrent.current = THREE.MathUtils.damp(caCurrent.current, target, 3.5, dt);
    caOffset.set(caCurrent.current, caCurrent.current * 0.6);

    if (bloomRef.current) {
      bloomRef.current.intensity = BLOOM_BASE + impact * BLOOM_IMPACT_KICK;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        ref={bloomRef as unknown as React.Ref<typeof BloomEffect>}
        mipmapBlur
        intensity={BLOOM_BASE}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.25}
        radius={0.85}
      />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.12} />
      <Vignette eskil={false} offset={0.35} darkness={0.75} />
      <Noise opacity={0.04} />
    </EffectComposer>
  );
}
