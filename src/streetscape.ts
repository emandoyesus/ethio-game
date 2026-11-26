import * as THREE from 'three';
import type { RoadSegment } from './types';

// Painted elevations are shared across a route so a row of kiosks costs one draw per face.
const shopStyles = [
  { am: 'ቡና ቤት', en: 'BUNNA  •  COFFEE HOUSE', paint: '#22534d', trim: '#d9ae68', goods: 'coffee' },
  { am: 'ዳቦ ቤት', en: 'DABO  •  BAKERY', paint: '#824231', trim: '#f2c978', goods: 'bread' },
  { am: 'ፍራፍሬ', en: 'FRESH FRUIT', paint: '#405f42', trim: '#e9a541', goods: 'fruit' },
  { am: 'ጨርቃ ጨርቅ', en: 'TEXTILES', paint: '#39516e', trim: '#e5c8a3', goods: 'cloth' },
];

function paintedSurface(canvas: HTMLCanvasElement) {
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map, roughness: 0.85, emissiveMap: map, emissive: 0x27231b });
}

function shopFront(style: typeof shopStyles[number]) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = style.paint;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = style.trim;
  g.strokeRect(7, 5, 498, 59);
  g.fillStyle = '#fff2cd';
  g.textAlign = 'center';
  g.font = 'bold 35px "Noto Sans Ethiopic", sans-serif';
  g.fillText(style.am, 256, 39);
  g.font = 'bold 17px sans-serif';
  g.fillText(style.en, 256, 59);
  g.fillStyle = '#322c25';
  g.fillRect(12, 72, 488, 176);
  // Stacked goods in the open display bay and a ribbed rolling shutter beside it.
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 13; x++) {
      const colors = style.goods === 'fruit' ? ['#bc772b', '#858a39', '#c3a543'] :
        style.goods === 'cloth' ? ['#9e5349', '#dfcbaa', '#597887'] :
        style.goods === 'bread' ? ['#c08b50', '#d5a363', '#b77c46'] : ['#86654a', '#bd9567', '#765138'];
      g.fillStyle = colors[(x + y * 2) % 3];
      const px = 25 + x * 23;
      const py = 139 + y * 35;
      if (style.goods === 'cloth') g.fillRect(px, py - 12, 19, 19);
      else {
        g.beginPath();
        g.ellipse(px + 8, py, 10, style.goods === 'bread' ? 5 : 9, -0.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = '#876247';
    g.fillRect(17, 149 + y * 35, 310, 5);
  }
  g.fillStyle = '#7f837a';
  g.fillRect(348, 77, 143, 163);
  g.fillStyle = '#575f58';
  for (let y = 80; y < 240; y += 6) g.fillRect(348, y, 143, 2);
  for (let x = 0; x < 512; x += 16) {
    g.fillStyle = x % 32 ? style.trim : style.paint;
    g.fillRect(x, 70, 16, 26);
  }
  return paintedSurface(c);
}

export function addStreetShops(group: THREE.Group, points: THREE.Vector3[], normals: THREE.Vector3[], stage: number, segments: RoadSegment[]) {
  const fronts = shopStyles.map(shopFront);
  const siding = new THREE.MeshStandardMaterial({ color: 0xb59c7e, roughness: 0.94 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x929997, roughness: 0.68 });
  const building = new THREE.BoxGeometry(7.8, 3.5, 3.4);
  const canopy = new THREE.BoxGeometry(8.1, 0.12, 1.1);
  const end = stage === 3 ? points.length * 0.53 : points.length;
  for (let kind = 0; kind < fronts.length; kind++) {
    const sites: { index: number; side: number }[] = [];
    const spacing = stage === 2 ? 23 : 12;
    for (let row = 0; 5 + row * spacing < end; row++) {
      const index = 5 + row * spacing;
      const cluster = stage === 3 ? 3 : stage === 1 ? 2 : 1;
      for (let n = 0; n < cluster; n++) {
        const slot = index + n * 2;
        if (segments.slice(Math.max(0, slot - 4), slot + 5).some(seg => seg.intersectionId !== undefined)) continue;
        if ((row + n) % fronts.length === kind && index + n * 2 < end)
          sites.push({ index: index + n * 2, side: row % 2 ? -1 : 1 });
      }
    }
    if (!sites.length) continue;
    const stalls = new THREE.InstancedMesh(building, [siding, siding, roof, siding, fronts[kind], siding], sites.length);
    const awnings = new THREE.InstancedMesh(canopy, roof, sites.length);
    const at = new THREE.Object3D();
    sites.forEach(({ index, side }, i) => {
      const normal = normals[index];
      segments[index].kioskX = side * 16.4;
      at.position.copy(points[index]).addScaledVector(normal, side * 16.4);
      at.position.y += 1.75;
      at.rotation.set(0, Math.atan2(-side * normal.x, -side * normal.z), 0);
      at.updateMatrix();
      stalls.setMatrixAt(i, at.matrix);
      at.translateZ(2.1);
      at.position.y += 0.76;
      at.rotation.x = 0.12;
      at.updateMatrix();
      awnings.setMatrixAt(i, at.matrix);
    });
    stalls.receiveShadow = true;
    group.add(stalls, awnings);
  }
}

export function districtSign(amharic: string, english: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.fillStyle = '#16534b';
  g.fillRect(0, 0, 512, 192);
  g.strokeStyle = '#e4e5ce';
  g.lineWidth = 4;
  g.strokeRect(8, 8, 496, 176);
  g.fillStyle = '#fff7dc';
  g.textAlign = 'center';
  g.font = 'bold 58px "Noto Sans Ethiopic", sans-serif';
  g.fillText(amharic, 234, 91, 399);
  g.font = 'bold 34px sans-serif';
  g.fillText(english, 234, 147, 399);
  g.fillText('↑', 463, 110);
  const assembly = new THREE.Group();
  const face = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 2.18), paintedSurface(c));
  face.position.y = 4.0;
  assembly.add(face);
  const post = new THREE.MeshStandardMaterial({ color: 0x899492, roughness: 0.72 });
  for (const x of [-2, 2]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 4.9, 6), post);
    pole.position.set(x, 2.45, -0.11);
    assembly.add(pole);
  }
  return assembly;
}
