import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sceneState } from './sceneState';

const GLOVE_VERTEX = `
uniform float uTime;
uniform float uImpact;

varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vSeamCoord;
varying float vKnuckleDist;
varying float vEdgeDist;

void main() {
  vPos = position;
  vNormal = normalize(normalMatrix * normal);

  float x = position.x;
  float y = position.y;
  float z = position.z;
  float r = length(position.xz);

  vSeamCoord = vec2(atan(z, x) / 3.14159 * 0.5 + 0.5, y * 0.8 + 0.5);
  vKnuckleDist = 1.0 - smoothstep(0.0, 1.0, distance(position, vec3(-0.1, -0.55, 0.45)));
  vEdgeDist = abs(position.y);

  float breathe = sin(uTime * 0.2 + position.y * 1.5) * 0.006;
  float impactShake = uImpact * 0.04 * sin(uTime * 60.0 + position.x * 10.0) * smoothstep(0.0, 0.3, abs(position.y));

  vec3 displaced = position + normal * (breathe + impactShake);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const GLOVE_FRAGMENT = `
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uWornColor;
uniform vec3 uStitchColor;
uniform vec3 uRimColor;
uniform float uImpact;

varying vec3 vPos;
varying vec3 vNormal;
varying vec2 vSeamCoord;
varying float vKnuckleDist;
varying float vEdgeDist;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; i++) {
    v += a * hash(p);
    p = r * p * 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vPos);

  float grain = fbm(vPos.xy * 8.0 + vPos.z * 6.0) * 0.06;
  float fineGrain = fbm(vPos.xz * 16.0 + vPos.y * 12.0) * 0.03;
  float coarsePatch = fbm(vPos.xy * 3.0 + vPos.z * 2.0) * 0.08;

  float knuckle = smoothstep(0.3, 0.7, vKnuckleDist);
  float knuckleWear = knuckle * (0.5 + 0.5 * fbm(vPos.xz * 5.0 + vPos.y * 3.0));

  float stitchX = abs(fract(vSeamCoord.x * 12.0 - 0.5) - 0.5);
  float stitchY = abs(fract(vSeamCoord.y * 8.0 - 0.5) - 0.5);
  float seamMask = smoothstep(0.12, 0.05, min(stitchX, stitchY));
  float stitchLine = smoothstep(0.04, 0.01, abs(vSeamCoord.x - 0.35)) * 0.3;

  vec3 base = mix(uBaseColor, uWornColor, knuckleWear);
  base += grain + fineGrain + coarsePatch;
  base *= 1.0 - knuckleWear * 0.15;

  vec3 stitchCol = mix(base, uStitchColor, 0.7);
  base = mix(base, stitchCol, seamMask * 0.5);
  base += stitchLine * 0.06;

  vec3 lightDir = normalize(vec3(1.2, 1.8, 1.0));
  float diff = max(dot(N, lightDir), 0.0) * 0.55 + 0.45;
  float ambient = 0.3;

  vec3 lightDirBounce = normalize(vec3(-0.5, -0.3, 0.8));
  float bounce = max(dot(N, lightDirBounce), 0.0) * 0.08;

  float roughness = 0.65 + knuckleWear * 0.25 + grain * 0.3;
  float spec = pow(max(dot(N, normalize(lightDir + V)), 0.0), 32.0 / max(roughness, 0.01)) * 0.3;

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

  vec3 col = base * (ambient + diff * 0.65 + bounce);
  col += vec3(0.8, 0.7, 0.6) * spec * (0.4 + knuckleWear * 0.3);
  col += uRimColor * fresnel * 0.08;

  float impactFlash = uImpact * 0.15 * exp(-vEdgeDist * 0.5);
  col += vec3(0.6, 0.5, 0.4) * impactFlash;

  float chalk = knuckle * 0.04 * (1.0 - grain);
  col += vec3(0.95, 0.93, 0.9) * chalk;

  col *= 1.0 - max(dot(N, vec3(0.0, -1.0, 0.0)), 0.0) * 0.12;

  gl_FragColor = vec4(col, 1.0);
}
`;

const CUFF_VERTEX = `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}
`;

const CUFF_FRAGMENT = `
uniform vec3 uColor;
uniform vec3 uStitchColor;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(vec3(0.5, 1.0, 0.8));
  float diff = max(dot(N, L), 0.0) * 0.6 + 0.4;
  float spec = pow(max(dot(N, normalize(L + V)), 0.0), 24.0) * 0.2;
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0) * 0.1;

  vec3 col = uColor * diff + vec3(1.0) * spec + fresnel * vec3(0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

function buildGloveGeometry(): THREE.BufferGeometry {
  const fist = new THREE.SphereGeometry(1, 56, 52);
  fist.scale(1.05, 1.25, 0.92);

  const knucklePad = new THREE.SphereGeometry(0.82, 44, 40);
  knucklePad.scale(1.1, 0.72, 0.82);
  knucklePad.translate(0, -0.52, 0.48);

  const thumb = new THREE.CapsuleGeometry(0.28, 0.50, 16, 28);
  thumb.rotateZ(-0.85);
  thumb.rotateX(0.3);
  thumb.translate(0.78, -0.30, 0.15);

  const thumbPad = new THREE.SphereGeometry(0.34, 24, 24);
  thumbPad.scale(1.2, 1.1, 0.8);
  thumbPad.translate(0.92, -0.15, 0.10);

  const heel = new THREE.SphereGeometry(0.72, 36, 36);
  heel.scale(0.95, 1.1, 0.88);
  heel.translate(0, 0.42, -0.14);

  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  const meshes = [fist, knucklePad, thumb, thumbPad, heel];
  for (const mesh of meshes) {
    const pos = mesh.getAttribute('position') as THREE.BufferAttribute;
    const norm = mesh.getAttribute('normal') as THREE.BufferAttribute;
    const uv = mesh.getAttribute('uv') as THREE.BufferAttribute;
    const idx = mesh.getIndex();

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + vertexOffset);
      }
    }
    vertexOffset += pos.count;
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);

  [fist, knucklePad, thumb, thumbPad, heel].forEach((g) => g.dispose());
  return merged;
}

function buildCuffGeometry(): THREE.BufferGeometry {
  const cuff = new THREE.CylinderGeometry(0.64, 0.72, 0.72, 48, 6, true);
  cuff.translate(0, 1.18, 0);

  const cuffRim = new THREE.TorusGeometry(0.68, 0.025, 8, 48);
  cuffRim.translate(0, 1.54, 0);

  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  [cuff, cuffRim].forEach((mesh) => {
    const pos = mesh.getAttribute('position') as THREE.BufferAttribute;
    const norm = mesh.getAttribute('normal') as THREE.BufferAttribute;
    const uv = mesh.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      uvs.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0);
    }
  });

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  [cuff, cuffRim].forEach((g) => g.dispose());
  return merged;
}

export function CinematicObject() {
  const groupRef = useRef<THREE.Group>(null);

  const gloveGeo = useMemo(buildGloveGeometry, []);
  const cuffGeo = useMemo(buildCuffGeometry, []);

  const gloveMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLOVE_VERTEX,
        fragmentShader: GLOVE_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uImpact: { value: 0 },
          uBaseColor: { value: new THREE.Color('#2a1515') },
          uWornColor: { value: new THREE.Color('#4a2828') },
          uStitchColor: { value: new THREE.Color('#1a0a0a') },
          uRimColor: { value: new THREE.Color('#6a3535') },
        },
      }),
    [],
  );

  const cuffMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CUFF_VERTEX,
        fragmentShader: CUFF_FRAGMENT,
        uniforms: {
          uColor: { value: new THREE.Color('#0d0d0f') },
          uStitchColor: { value: new THREE.Color('#1a1a1e') },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      gloveGeo.dispose();
      cuffGeo.dispose();
      gloveMat.dispose();
      cuffMat.dispose();
    },
    [gloveGeo, cuffGeo, gloveMat, cuffMat],
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const dt = Math.min(delta, 1 / 30);
    const t = performance.now() / 1000;
    const impact = sceneState.impact;

    gloveMat.uniforms.uTime.value = (gloveMat.uniforms.uTime.value as number) + dt;
    gloveMat.uniforms.uImpact.value = impact;

    const punch = impact * impact;
    group.rotation.x = 0.28 + Math.sin(t * 0.15) * 0.04 - punch * 0.12;
    group.rotation.y = 0.35 + Math.sin(t * 0.11) * 0.25 + sceneState.scroll * 1.4;
    group.rotation.z = -0.12 + Math.cos(t * 0.13) * 0.03 + punch * 0.08;
    group.position.y = Math.sin(t * 0.4) * 0.06;
    group.position.z = punch * 0.6;
    group.position.x = punch * 0.2;
  });

  return (
    <group ref={groupRef} scale={0.78}>
      {/* Main glove body */}
      <mesh geometry={gloveGeo} frustumCulled={false}>
        <primitive object={gloveMat} attach="material" />
      </mesh>

      {/* Wrist cuff */}
      <mesh geometry={cuffGeo} frustumCulled={false}>
        <primitive object={cuffMat} attach="material" />
      </mesh>
    </group>
  );
}
