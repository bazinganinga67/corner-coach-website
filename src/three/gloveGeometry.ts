import * as THREE from 'three';

/**
 * Procedural boxing-glove sculpt + leather material maps.
 *
 * The body starts as a high-res sphere displaced radially by gaussian bumps
 * (knuckle mass, four knuckle ridges, an elongated thumb, heel pad, palm
 * flatten, wrist taper) — then the whole form is CURLED forward around the
 * wrist axis. That curl is what makes it read as a glove: a real glove is
 * comma-shaped in profile because the fist rolls toward the palm, and no
 * amount of bump detail on a straight sphere ever conveys that.
 *
 * Orientation: wrist/cuff at -y, knuckle face rolled up-forward (+y/+z).
 * The geometry is right-handed (thumb at +x); `mirrorGeometry` bakes a
 * proper left glove (flipped winding, recomputed normals) so a pair can
 * share materials without inside-out rendering.
 *
 * Everything runs once at load on the CPU (~20k vertices per glove), then
 * the geometry is static for the lifetime of the scene.
 */

/** Gaussian falloff on the unit sphere: 1 at the bump center, 0 away from it. */
function gauss(dot: number, width: number): number {
  return Math.exp((dot - 1) / width);
}

// Sculpt landmarks (unit directions). Knuckle face up-forward, wrist -y.
const KNUCKLE_MASS = new THREE.Vector3(0, 0.35, 0.93).normalize();
const KNUCKLES = [-0.45, -0.16, 0.16, 0.45].map((x) =>
  new THREE.Vector3(x, 0.52, 0.83).normalize(),
);
// Two overlapping mounds along an arc: an elongated thumb, not a wart.
const THUMB_A = new THREE.Vector3(0.92, 0.05, 0.42).normalize();
const THUMB_B = new THREE.Vector3(0.97, -0.28, 0.22).normalize();
const HEEL = new THREE.Vector3(0, -0.35, -0.78).normalize();
const PALM = new THREE.Vector3(0, 0.15, -1).normalize();

// Forward curl: 0 at the wrist pivot, full at the knuckle crown.
const CURL_ANGLE = 0.55;
const CURL_PIVOT_Y = -0.45;

export function createGloveBodyGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 168, 128);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();

    let r = 1;

    // Broad padded mass over the striking face.
    r += 0.16 * gauss(v.dot(KNUCKLE_MASS), 0.32);

    // Individual knuckle ridges — tight, shallow, mostly read via specular.
    for (const k of KNUCKLES) r += 0.045 * gauss(v.dot(k), 0.012);

    // Thumb: elongated ridge from side toward the palm.
    r += 0.3 * gauss(v.dot(THUMB_A), 0.07);
    r += 0.26 * gauss(v.dot(THUMB_B), 0.07);

    // Heel of the hand.
    r += 0.08 * gauss(v.dot(HEEL), 0.22);

    // Palm side sits flatter than the padded front.
    r -= 0.07 * gauss(v.dot(PALM), 0.3);

    // Taper into the wrist (bottom pole).
    r *= 1 - 0.35 * THREE.MathUtils.smoothstep(-v.y, 0.45, 1.0);

    // Displaced position, then the comma curl: rotate around the x-axis at
    // the wrist pivot, angle ramping toward the crown.
    let px = v.x * r;
    let py = v.y * r;
    let pz = v.z * r;

    const theta = CURL_ANGLE * THREE.MathUtils.smoothstep(py, CURL_PIVOT_Y, 1.1);
    const dy = py - CURL_PIVOT_Y;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const cy = CURL_PIVOT_Y + dy * cos - pz * sin;
    const cz = dy * sin + pz * cos;
    py = cy;
    pz = cz;

    pos.setXYZ(i, px * 1.04, py * 1.1, pz);
  }

  geo.computeVertexNormals();
  return geo;
}

/** Bake a left glove: mirror in x, fix triangle winding, rebuild normals. */
export function mirrorGeometry(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = src.clone();
  geo.scale(-1, 1, 1);
  const index = geo.getIndex();
  if (index) {
    const arr = index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    index.needsUpdate = true;
  }
  geo.computeVertexNormals();
  return geo;
}

/** Elastic cuff with molded ribs, flaring toward the (bottom) opening. */
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
