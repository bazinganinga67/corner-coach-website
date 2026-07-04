import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import type { BloomEffect } from 'postprocessing';

import { sceneState } from './sceneState';

const CA_BASE = 0.00015;
const CA_VELOCITY_SCALE = 0.003;
const CA_MAX_EXTRA = 0.0015;

const BLOOM_INTENSITY = 0.4;

export function Effects() {
  const caOffset = useMemo(() => new THREE.Vector2(CA_BASE, CA_BASE * 0.6), []);
  const caCurrent = useRef(CA_BASE);
  const bloomRef = useRef<BloomEffect>(null);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);

    const target =
      CA_BASE +
      Math.min(Math.abs(sceneState.velocity) * CA_VELOCITY_SCALE, CA_MAX_EXTRA);
    caCurrent.current = THREE.MathUtils.damp(caCurrent.current, target, 3.5, dt);
    caOffset.set(caCurrent.current, caCurrent.current * 0.6);
  });

  return (
    <EffectComposer multisampling={2}>
      <Bloom
        ref={bloomRef as unknown as React.Ref<typeof BloomEffect>}
        mipmapBlur
        intensity={BLOOM_INTENSITY}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.25}
        radius={0.85}
      />
      {/* Filmic rolloff AFTER bloom: HDR speculars compress like camera
          footage instead of clipping — the difference between "render" and
          "photo" for the PBR leather. Canvas stays `flat` so this is the
          only tone map in the chain. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.12} />
      <Vignette eskil={false} offset={0.35} darkness={0.75} />
      <Noise opacity={0.04} />
    </EffectComposer>
  );
}
