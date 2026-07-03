import * as THREE from 'three';

interface Ring {
  y: number;
  rx: number;
  rz: number;
  sq: number;
  th: number;
  thz: number;
}

const RINGS: Ring[] = [
  { y: -1.05, rx: 0.34, rz: 0.34, sq: 0.0, th: 0,    thz: 0    },
  { y: -0.85, rx: 0.42, rz: 0.42, sq: 0.0, th: 0,    thz: 0    },
  { y: -0.65, rx: 0.52, rz: 0.50, sq: 0.1, th: 0,    thz: 0    },
  { y: -0.48, rx: 0.58, rz: 0.55, sq: 0.1, th: 0.02, thz: 0.04 },
  { y: -0.30, rx: 0.66, rz: 0.58, sq: 0.3, th: 0.08, thz: 0.12 },
  { y: -0.12, rx: 0.74, rz: 0.62, sq: 0.4, th: 0.16, thz: 0.20 },
  { y:  0.06, rx: 0.80, rz: 0.66, sq: 0.5, th: 0.22, thz: 0.24 },
  { y:  0.24, rx: 0.85, rz: 0.70, sq: 0.7, th: 0.26, thz: 0.22 },
  { y:  0.42, rx: 0.86, rz: 0.72, sq: 0.7, th: 0.24, thz: 0.18 },
  { y:  0.60, rx: 0.82, rz: 0.68, sq: 0.6, th: 0.18, thz: 0.12 },
  { y:  0.78, rx: 0.70, rz: 0.58, sq: 0.4, th: 0.08, thz: 0.06 },
  { y:  0.92, rx: 0.42, rz: 0.36, sq: 0.2, th: 0,    thz: 0    },
  { y:  1.00, rx: 0.16, rz: 0.14, sq: 0.1, th: 0,    thz: 0    },
  { y:  1.04, rx: 0.04, rz: 0.04, sq: 0.0, th: 0,    thz: 0    },
];

const SEG = 40;
const H = RINGS.length;

const KNUCKLE_X = [-0.24, -0.08, 0.08, 0.24];
const KNUCKLE_Y = 0.32;
const KNUCKLE_DEPTH = 0.045;

const CURL_PIVOT_Y = -0.45;
const CURL_ANGLE = 0.55;

export function createGloveBodyGeometry(): THREE.BufferGeometry {
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i < H; i++) {
    const { y, rx, rz, sq, th, thz } = RINGS[i];
    const nBase = 2 + sq * 4;

    for (let j = 0; j <= SEG; j++) {
      const theta = (j / SEG) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const n = cos >= 0 ? nBase : 2;
      const s = Math.abs(sin / rx);
      const c = Math.abs(cos / rz);
      const sum = s === 0 && c === 0 ? 1 : Math.pow(s, n) + Math.pow(c, n);
      const R = Math.pow(sum, -1 / n);
      let x = sin * R;
      let z = cos * R;

      if (th > 0 && sin > 0 && cos > 0) {
        const tb = Math.exp(-Math.pow((theta - Math.PI * 0.55) / 0.45, 2));
        x += th * tb;
        z += thz * tb;
      }

      if (cos > 0 && y > 0.1 && y < 0.6) {
        for (const kx of KNUCKLE_X) {
          const d = Math.abs(x - kx);
          if (d < 0.3) {
            const kf = Math.exp(-d * d / 0.008) * Math.exp(-(y - KNUCKLE_Y) * (y - KNUCKLE_Y) / 0.03);
            z -= KNUCKLE_DEPTH * kf;
          }
        }
      }

      verts.push(x, y, z);
      uvs.push(j / SEG, i / (H - 1));
    }
  }

  for (let i = 0; i < H - 1; i++) {
    for (let j = 0; j < SEG; j++) {
      const a = i * (SEG + 1) + j;
      const b = a + 1;
      const c = (i + 1) * (SEG + 1) + j;
      const d = c + 1;
      idx.push(a, c, b);
      idx.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const theta = CURL_ANGLE * THREE.MathUtils.smoothstep(y, CURL_PIVOT_Y, 1.1);
    const dy = y - CURL_PIVOT_Y;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const cy = CURL_PIVOT_Y + dy * cos - z * sin;
    const cz = dy * sin + z * cos;
    pos.setXYZ(i, x * 1.04, cy * 1.1, cz);
  }

  geo.computeVertexNormals();
  return geo;
}

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

export function createCuffGeometry(): THREE.BufferGeometry {
  const height = 0.85;
  const geo = new THREE.CylinderGeometry(0.6, 0.72, height, 96, 28, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const radial = Math.sqrt(x * x + z * z);
    if (radial < 1e-5) continue;
    const rib = 1 + 0.016 * Math.sin((y / height) * Math.PI * 14);
    pos.setXYZ(i, x * rib, y, z * rib);
  }

  geo.computeVertexNormals();
  return geo;
}

export function createLeatherMaps(): { bump: THREE.CanvasTexture; rough: THREE.CanvasTexture } {
  const SIZE = 512;

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

  const bump = toTexture(
    (i) => 128 + (o1[i] - 0.5) * 60 + (o2[i] - 0.5) * 90 + (o3[i] - 0.5) * 110,
  );
  const rough = toTexture((i) => 150 + (o1[i] - 0.5) * 50 + (o2[i] - 0.5) * 40);

  return { bump, rough };
}
