import * as THREE from 'three';

/**
 * Procedural boxing-glove sculpt + leather material maps.
 *
 * The body is a high-res sphere displaced radially by a field of gaussian
 * bumps on the unit sphere — the same way a sculptor pushes clay: a broad
 * knuckle mass, four individual knuckle ridges, a thumb mound, a heel pad,
 * a flattened palm and a tapered wrist. Because it stays a displaced sphere
 * it keeps clean UVs (for the leather grain maps) and produces ONE smooth,
 * continuous surface — no primitive-intersection seams to give it away.
 *
 * Everything here runs once at load on the CPU (~20k vertices), then the
 * geometry is static for the lifetime of the scene.
 */

/** Gaussian falloff on the unit sphere: 1 at the bump center, 0 away from it. */
function gauss(dot: number, width: number): number {
  return Math.exp((dot - 1) / width);
}

// Sculpt landmarks (unit directions). Knuckles face +z, wrist points +y.
const KNUCKLE_MASS = new THREE.Vector3(0, 0.28, 0.96).normalize();
const KNUCKLES = [-0.45, -0.16, 0.16, 0.45].map((x) =>
  new THREE.Vector3(x, 0.4, 0.9).normalize(),
);
const THUMB = new THREE.Vector3(0.95, -0.32, 0.52).normalize();
const HEEL = new THREE.Vector3(0, -0.72, -0.55).normalize();
const PALM = new THREE.Vector3(0, 0.05, -1).normalize();

export function createGloveBodyGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 168, 128);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();

    let r = 1;

    // Broad padded mass over the fist front.
    r += 0.13 * gauss(v.dot(KNUCKLE_MASS), 0.3);

    // Individual knuckle ridges — tight, shallow, mostly read via specular.
    for (const k of KNUCKLES) r += 0.045 * gauss(v.dot(k), 0.012);

    // Thumb mound, blended smoothly into the side.
    r += 0.4 * gauss(v.dot(THUMB), 0.095);

    // Heel of the hand.
    r += 0.09 * gauss(v.dot(HEEL), 0.26);

    // Palm side sits flatter than the padded front.
    r -= 0.07 * gauss(v.dot(PALM), 0.34);

    // Taper into the wrist.
    r *= 1 - 0.34 * THREE.MathUtils.smoothstep(v.y, 0.5, 1.0);

    pos.setXYZ(i, v.x * r * 0.96, v.y * r * 1.12, v.z * r * 1.03);
  }

  geo.computeVertexNormals();
  return geo;
}

/** Elastic cuff with molded ribs, flaring slightly toward the opening. */
export function createCuffGeometry(): THREE.BufferGeometry {
  const height = 0.85;
  const geo = new THREE.CylinderGeometry(0.6, 0.72, height, 96, 28, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const radial = Math.sqrt(x * x + z * z);
    if (radial < 1e-5) continue; // cap centers
    // Horizontal elastic ribs.
    const rib = 1 + 0.016 * Math.sin((y / height) * Math.PI * 14);
    pos.setXYZ(i, x * rib, y, z * rib);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedural leather grain: tiling value noise baked to canvases once at
 * load. `bump` is high-contrast fine grain; `rough` is a low-contrast
 * mid-gray field that breaks up the specular so the surface never reads as
 * uniform plastic.
 */
export function createLeatherMaps(): { bump: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  const SIZE = 512;

  // Tiling value-noise octave: random lattice, smootherstep bilinear sampling.
  const octave = (cells: number): Float32Array => {
    const lattice = new Float32Array(cells * cells);
    for (let i = 0; i < lattice.length; i++) lattice[i] = Math.random();

    const out = new Float32Array(SIZE * SIZE);
    const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

    for (let y = 0; y < SIZE; y++) {
      const gy = (y / SIZE) * cells;
      const y0 = Math.floor(gy) % cells;
      const y1 = (y0 + 1) % cells;
      const ty = smooth(gy - Math.floor(gy));
      for (let x = 0; x < SIZE; x++) {
        const gx = (x / SIZE) * cells;
        const x0 = Math.floor(gx) % cells;
        const x1 = (x0 + 1) % cells;
        const tx = smooth(gx - Math.floor(gx));
        const a = lattice[y0 * cells + x0];
        const b = lattice[y0 * cells + x1];
        const c = lattice[y1 * cells + x0];
        const d = lattice[y1 * cells + x1];
        out[y * SIZE + x] = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
      }
    }
    return out;
  };

  const o1 = octave(24);
  const o2 = octave(64);
  const o3 = octave(160);

  const toTexture = (map: (i: number) => number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const value = Math.max(0, Math.min(255, map(i)));
      img.data[i * 4] = value;
      img.data[i * 4 + 1] = value;
      img.data[i * 4 + 2] = value;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };

  // Grain: pebbled fine detail dominates, broad octave keeps it organic.
  const bump = toTexture(
    (i) => 128 + (o1[i] - 0.5) * 60 + (o2[i] - 0.5) * 90 + (o3[i] - 0.5) * 110,
  );
  // Roughness: gentle mid-gray variation (multiplied by material.roughness).
  const rough = toTexture((i) => 150 + (o1[i] - 0.5) * 50 + (o2[i] - 0.5) * 40);

  return { bump, rough };
}
