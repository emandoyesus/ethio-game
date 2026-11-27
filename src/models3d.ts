import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createRealHuman3D } from './characters3d';
import type { VehicleId } from './types';

// Materials cache to maximize performance and batching
export const materials = {
  minibusBlue: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.25 }),
  minibusWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 }),
  ladaBlue: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.3 }),
  bajajBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }),
  isuzuOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 }),
  policeWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 }),
  policeBlue: new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.3 }),

  glass: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }),
  hubcap: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.15 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 }),

  headlightOn: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff59d, emissiveIntensity: 2.5 }),
  taillight: new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 1.8 }),
  taillightBraking: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff2222, emissiveIntensity: 6.0 }),
  reverseLight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 4.5 }),
  blinker: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xfbbf24, emissiveIntensity: 2.0 }),

  gold: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.3 }),
  clay: new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.85 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  luggageYellow: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),

  cowTan: new THREE.MeshStandardMaterial({ color: 0xb47942, roughness: 0.9 }),
  cowWhite: new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.85 }),
  cowHorns: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 }),
  goatDark: new THREE.MeshStandardMaterial({ color: 0x3d1d07, roughness: 0.9 }),
  potholeDark: new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 }),
  potholeEdge: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }),
  fuelRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 }),
  netelaWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }),
  netelaTibeb: new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 }),
  coneOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }),
  acaciaBark: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }),
  acaciaFoliage: new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.85 }),
  eucalyptusBark: new THREE.MeshStandardMaterial({ color: 0xccbba8, roughness: 0.8 }),
  eucalyptusFoliage: new THREE.MeshStandardMaterial({ color: 0x335c4b, roughness: 0.85 }),
  cbeTowerGlass: new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.9, roughness: 0.1 }),
  cbeTrim: new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.2 }),
  lrtGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35 }),
  concretePillar: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }),

  signalHousing: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 }),
  signalVisor: new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 }),
  signalRedOff: new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.9 }),
  signalRedOn: new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xff0000, emissiveIntensity: 5.5 }),
  signalYellowOff: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }),
  signalYellowOn: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xfbbf24, emissiveIntensity: 5.0 }),
  signalGreenOff: new THREE.MeshStandardMaterial({ color: 0x052e16, roughness: 0.9 }),
  signalGreenOn: new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x22c55e, emissiveIntensity: 5.0 }),
  blinkerAmberOff: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }),
  blinkerAmberOn: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xfbbf24, emissiveIntensity: 5.2 }),
  flameBlue: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
  flameOrange: new THREE.MeshBasicMaterial({ color: 0xff5500 }),
  asphaltPaintWhite: new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide }),
  asphaltPaintYellow: new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide }),

  // Roadside Building Materials (Warm Addis Stone, Terracotta, Concrete & Architectural Glass)
  bldgStuccoCream: new THREE.MeshStandardMaterial({ color: 0xe6dac4, roughness: 0.85 }),
  bldgStuccoTerracotta: new THREE.MeshStandardMaterial({ color: 0xc26d4a, roughness: 0.85 }),
  bldgConcrete: new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.88 }),
  bldgDarkTrim: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.72 }),
  bldgWindowLit: new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.55, roughness: 0.2 }),
  bldgWindowDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.45 }),
  bldgGlassBlue: new THREE.MeshStandardMaterial({ color: 0x2c4a5e, roughness: 0.22, metalness: 0.55 }),
  bldgRoofRed: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75 }),
  bldgRoofMetal: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.5 }),
  bldgAwningGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 }),
  bldgAwningGold: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }),
  bldgWaterTank: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }),

  // Modern Addis EV, Electric Bus, Corridor Palm, Smart Pole & AALRT Materials
  evWhite: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.4 }),
  evTeal: new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.22, metalness: 0.45 }),
  evSilver: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.22, metalness: 0.55 }),
  evLightbar: new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0xbae6fd, emissiveIntensity: 2.8 }),
  evPlateGreen: new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.3 }),
  busGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.35, metalness: 0.2 }),
  busYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }),
  palmTrunk: new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.92 }),
  palmFrond: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, side: THREE.DoubleSide }),
  smartPole: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.65 }),
  ledCoolWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xe0f2fe, emissiveIntensity: 3.0 }),
  lrtBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.25 }),
  lrtCanopy: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.65, side: THREE.DoubleSide }),
  cbeFacetGlass: new THREE.MeshStandardMaterial({ color: 0x0c4a6e, metalness: 0.92, roughness: 0.08 })
};

export interface Vehicle3DModel {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  taillights?: THREE.Mesh[];
  leftBlinkers?: THREE.Mesh[];
  rightBlinkers?: THREE.Mesh[];
  boostFlameJets?: THREE.Mesh[];
  policeStrobeRed?: THREE.PointLight;
  policeStrobeBlue?: THREE.PointLight;
}

export interface TrafficLight3DModel {
  group: THREE.Group;
  signalHeads: {
    red: THREE.Mesh;
    yellow: THREE.Mesh;
    green: THREE.Mesh;
  }[];
  lightSource: THREE.PointLight;
  setState: (state: 'GREEN' | 'YELLOW' | 'RED') => void;
}

// 1. Toyota HiAce Blue Minibus Taxi (The iconic Addis workhorse)
export function createMinibus3D(isPlayer: boolean = false): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Lower Body (Blue)
  const lowerGeo = new RoundedBoxGeometry(2.1, 0.95, 4.8, 1, 0.16);
  const lowerMesh = new THREE.Mesh(lowerGeo, materials.minibusBlue);
  lowerMesh.position.y = 0.82;
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  group.add(lowerMesh);

  // Upper Cabin / Roof (White)
  const upperGeo = new RoundedBoxGeometry(2.0, 0.88, 4.4, 1, 0.19);
  const upperMesh = new THREE.Mesh(upperGeo, materials.minibusWhite);
  upperMesh.position.set(0, 1.7, -0.15);
  upperMesh.castShadow = true;
  group.add(upperMesh);

  // Front Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.72, 0.1), materials.glass);
  windshield.position.set(0, 1.68, 2.08);
  windshield.rotation.x = -0.25;
  group.add(windshield);

  // Rear Window
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 0.1), materials.glass);
  rearWindow.position.set(0, 1.7, -2.36);
  group.add(rearWindow);

  // Tinted Side Windows
  const leftSideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 3.8), materials.glass);
  leftSideWin.position.set(-1.01, 1.68, -0.2);
  group.add(leftSideWin);

  const rightSideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 3.8), materials.glass);
  rightSideWin.position.set(1.01, 1.68, -0.2);
  group.add(rightSideWin);

  if (isPlayer) {
    const pillar = new THREE.BoxGeometry(0.04, 0.64, 0.064);
    for (const side of [-1, 1]) {
      for (const z of [-1.12, 0.08, 1.06]) {
        const frame = new THREE.Mesh(pillar, materials.minibusWhite);
        frame.position.set(side * 1.055, 1.68, z);
        group.add(frame);
      }
      const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.23, 0.31, 0.16, 1, 0.05), materials.rubber);
      mirror.position.set(side * 1.14, 1.52, 1.66);
      group.add(mirror);
    }
    const plate = document.createElement('canvas');
    plate.width = 256;
    plate.height = 80;
    const ink = plate.getContext('2d')!;
    ink.fillStyle = '#dfdfc9';
    ink.fillRect(0, 0, 256, 80);
    ink.fillStyle = '#243936';
    ink.font = 'bold 48px sans-serif';
    ink.textAlign = 'center';
    ink.fillText('AA  47216', 128, 58);
    const plateMap = new THREE.CanvasTexture(plate);
    plateMap.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.17),
      new THREE.MeshStandardMaterial({ map: plateMap, roughness: 0.55 }));
    badge.rotation.y = Math.PI;
    badge.position.set(0, 0.85, -2.405);
    group.add(badge);
  }

  // Roof Luggage Rack with wrapped baggage
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 2.8), materials.chrome);
  rack.position.set(0, 2.22, -0.5);
  group.add(rack);

  const parcel1 = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.38, 0.9, 1, 0.09), materials.luggageYellow);
  parcel1.position.set(-0.4, 2.46, -0.7);
  group.add(parcel1);

  const parcel2 = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.42, 1.0, 1, 0.1), materials.clay);
  parcel2.position.set(0.35, 2.48, -0.4);
  group.add(parcel2);

  // Bumpers
  const frontBumper = new THREE.Mesh(new RoundedBoxGeometry(2.18, 0.3, 0.25, 1, 0.07), materials.chrome);
  frontBumper.position.set(0, 0.45, 2.42);
  group.add(frontBumper);

  const rearBumper = new THREE.Mesh(new RoundedBoxGeometry(2.18, 0.3, 0.25, 1, 0.07), materials.chrome);
  rearBumper.position.set(0, 0.45, -2.42);
  group.add(rearBumper);

  // Headlights (Only player vehicle gets active dynamic SpotLights to preserve high 60 FPS)
  const hlGeo = new THREE.BoxGeometry(0.35, 0.22, 0.1);
  const leftHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  leftHL.position.set(-0.75, 0.78, 2.42);
  group.add(leftHL);

  const rightHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  rightHL.position.set(0.75, 0.78, 2.42);
  group.add(rightHL);

  const headlights: THREE.SpotLight[] = [];
  if (isPlayer) {
    const spotL = new THREE.SpotLight(0xfff8e7, 3.8, 50, Math.PI / 6, 0.4);
    spotL.position.set(-0.75, 0.82, 2.5);
    spotL.target.position.set(-0.75, 0, 20);
    group.add(spotL);
    group.add(spotL.target);
    headlights.push(spotL);

    const spotR = new THREE.SpotLight(0xfff8e7, 3.8, 50, Math.PI / 6, 0.4);
    spotR.position.set(0.75, 0.82, 2.5);
    spotR.target.position.set(0.75, 0, 20);
    group.add(spotR);
    group.add(spotR.target);
    headlights.push(spotR);
  }

  // 3D Dual Boost Flame Jets
  const boostFlameJets: THREE.Mesh[] = [];
  if (isPlayer) {
    const flameGeo = new THREE.ConeGeometry(0.12, 1.2, 8);
    flameGeo.rotateX(Math.PI / 2);
    [-0.55, 0.55].forEach(x => {
      const jet = new THREE.Mesh(flameGeo, materials.flameBlue);
      jet.position.set(x, 0.42, -2.55);
      jet.visible = false;
      group.add(jet);
      boostFlameJets.push(jet);
    });
  }

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.28, 0.38, 0.1);
  const leftTL = new THREE.Mesh(tlGeo, materials.taillight);
  leftTL.position.set(-0.85, 0.84, -2.42);
  group.add(leftTL);

  const rightTL = new THREE.Mesh(tlGeo, materials.taillight);
  rightTL.position.set(0.85, 0.84, -2.42);
  group.add(rightTL);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wPositions = [
    [-1.08, 0.4, 1.45],
    [1.08, 0.4, 1.45],
    [-1.08, 0.4, -1.45],
    [1.08, 0.4, -1.45]
  ];

  wPositions.forEach(p => {
    const wheel = new THREE.Mesh(wheelGeo, materials.rubber);
    wheel.position.set(p[0], p[1], p[2]);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);

    // Hubcap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.33, 12), materials.hubcap);
    cap.rotateZ(Math.PI / 2);
    cap.position.set(p[0], p[1], p[2]);
    group.add(cap);
  });

  // Turn Signal Blinkers
  const blinkerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.08);
  const leftFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftFB.position.set(-1.0, 0.78, 2.42);
  group.add(leftFB);

  const leftRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftRB.position.set(-1.0, 0.84, -2.42);
  group.add(leftRB);

  const rightFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightFB.position.set(1.0, 0.78, 2.42);
  group.add(rightFB);

  const rightRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightRB.position.set(1.0, 0.84, -2.42);
  group.add(rightRB);

  return {
    group,
    wheels,
    headlights,
    taillights: [leftTL, rightTL],
    leftBlinkers: [leftFB, leftRB],
    rightBlinkers: [rightFB, rightRB],
    boostFlameJets
  };
}

// 2. Classic Lada 2101 Taxi Sedan
export function createLada3D(isPlayer: boolean = false): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Lower Body (Blue)
  const lowerGeo = new RoundedBoxGeometry(1.82, 0.68, 4.4, 1, 0.13);
  const lowerMesh = new THREE.Mesh(lowerGeo, materials.ladaBlue);
  lowerMesh.position.y = 0.65;
  lowerMesh.castShadow = true;
  group.add(lowerMesh);

  // Cabin / Roof (White)
  const cabinGeo = new RoundedBoxGeometry(1.65, 0.72, 2.4, 1, 0.18);
  const cabinMesh = new THREE.Mesh(cabinGeo, materials.minibusWhite);
  cabinMesh.position.set(0, 1.32, -0.2);
  cabinMesh.castShadow = true;
  group.add(cabinMesh);

  // Windshield & Rear Windows
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.58, 0.1), materials.glass);
  frontGlass.position.set(0, 1.3, 1.02);
  frontGlass.rotation.x = -0.32;
  group.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.54, 0.1), materials.glass);
  rearGlass.position.set(0, 1.3, -1.42);
  rearGlass.rotation.x = 0.32;
  group.add(rearGlass);

  // Yellow Roof Taxi Sign
  const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.28), materials.gold);
  taxiSign.position.set(0, 1.78, -0.2);
  group.add(taxiSign);

  // Headlights
  const hlGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14);
  hlGeo.rotateX(Math.PI / 2);
  const leftHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  leftHL.position.set(-0.68, 0.72, 2.22);
  group.add(leftHL);

  const rightHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  rightHL.position.set(0.68, 0.72, 2.22);
  group.add(rightHL);

  const headlights: THREE.SpotLight[] = [];
  if (isPlayer) {
    const spotL = new THREE.SpotLight(0xfff8e7, 3.4, 45, Math.PI / 6, 0.4);
    spotL.position.set(-0.68, 0.72, 2.3);
    spotL.target.position.set(-0.68, 0, 20);
    group.add(spotL);
    group.add(spotL.target);
    headlights.push(spotL);

    const spotR = new THREE.SpotLight(0xfff8e7, 3.4, 45, Math.PI / 6, 0.4);
    spotR.position.set(0.68, 0.72, 2.3);
    spotR.target.position.set(0.68, 0, 20);
    group.add(spotR);
    group.add(spotR.target);
    headlights.push(spotR);
  }

  // 3D Dual Boost Flame Jets
  const boostFlameJets: THREE.Mesh[] = [];
  if (isPlayer) {
    const flameGeo = new THREE.ConeGeometry(0.1, 1.1, 8);
    flameGeo.rotateX(Math.PI / 2);
    [-0.45, 0.45].forEach(x => {
      const jet = new THREE.Mesh(flameGeo, materials.flameBlue);
      jet.position.set(x, 0.35, -2.25);
      jet.visible = false;
      group.add(jet);
      boostFlameJets.push(jet);
    });
  }

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.26, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const wPositions = [
    [-0.95, 0.35, 1.35],
    [0.95, 0.35, 1.35],
    [-0.95, 0.35, -1.35],
    [0.95, 0.35, -1.35]
  ];

  wPositions.forEach(p => {
    const wheel = new THREE.Mesh(wheelGeo, materials.rubber);
    wheel.position.set(p[0], p[1], p[2]);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  });

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.24, 0.22, 0.08);
  const leftTL = new THREE.Mesh(tlGeo, materials.taillight);
  leftTL.position.set(-0.7, 0.68, -2.12);
  group.add(leftTL);

  const rightTL = new THREE.Mesh(tlGeo, materials.taillight);
  rightTL.position.set(0.7, 0.68, -2.12);
  group.add(rightTL);

  // Turn Signal Blinkers
  const blinkerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.08);
  const leftFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftFB.position.set(-1.0, 0.78, 2.42);
  group.add(leftFB);

  const leftRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftRB.position.set(-1.0, 0.84, -2.42);
  group.add(leftRB);

  const rightFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightFB.position.set(1.0, 0.78, 2.42);
  group.add(rightFB);

  const rightRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightRB.position.set(1.0, 0.84, -2.42);
  group.add(rightRB);

  return {
    group,
    wheels,
    headlights,
    taillights: [leftTL, rightTL],
    leftBlinkers: [leftFB, leftRB],
    rightBlinkers: [rightFB, rightRB],
    boostFlameJets
  };
}

// 3. Addis Bajaj (Auto-rickshaw 3-wheeler)
export function createBajaj3D(isPlayer: boolean = false): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.75, 2.6, 1, 0.14), materials.bajajBlue);
  body.position.set(0, 0.6, 0);
  body.castShadow = true;
  group.add(body);

  const hood = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.65, 0.9, 1, 0.16), materials.bajajBlue);
  hood.position.set(0, 0.6, 1.55);
  group.add(hood);

  const canopy = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.9, 2.4, 1, 0.19), materials.rubber);
  canopy.position.set(0, 1.4, -0.1);
  group.add(canopy);

  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14).rotateZ(Math.PI / 2);

  // Single Front Wheel
  const frontWheel = new THREE.Mesh(wheelGeo, materials.rubber);
  frontWheel.position.set(0, 0.3, 1.65);
  group.add(frontWheel);
  wheels.push(frontWheel);

  // Dual Rear Wheels
  [-0.75, 0.75].forEach(x => {
    const rWheel = new THREE.Mesh(wheelGeo, materials.rubber);
    rWheel.position.set(x, 0.3, -0.9);
    group.add(rWheel);
    wheels.push(rWheel);
  });

  const headlights: THREE.SpotLight[] = [];
  if (isPlayer) {
    const spot = new THREE.SpotLight(0xfff8e7, 3.0, 40, Math.PI / 6, 0.4);
    spot.position.set(0, 0.7, 2.0);
    spot.target.position.set(0, 0, 20);
    group.add(spot);
    group.add(spot.target);
    headlights.push(spot);
  }

  // 3D Dual Boost Flame Jets
  const boostFlameJets: THREE.Mesh[] = [];
  if (isPlayer) {
    const flameGeo = new THREE.ConeGeometry(0.08, 0.9, 8);
    flameGeo.rotateX(Math.PI / 2);
    const jet = new THREE.Mesh(flameGeo, materials.flameBlue);
    jet.position.set(0.35, 0.28, -1.35);
    jet.visible = false;
    group.add(jet);
    boostFlameJets.push(jet);
  }

  const blinkerGeo = new THREE.BoxGeometry(0.14, 0.14, 0.08);
  const leftBlinker = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftBlinker.position.set(-0.7, 0.55, -1.32);
  group.add(leftBlinker);

  const rightBlinker = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightBlinker.position.set(0.7, 0.55, -1.32);
  group.add(rightBlinker);

  return { group, wheels, headlights, leftBlinkers: [leftBlinker], rightBlinkers: [rightBlinker], boostFlameJets };
}

// 4. Isuzu Heavy Freight Truck
export function createIsuzu3D(isPlayer: boolean = false): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const cab = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.7, 1.8, 1, 0.17), materials.isuzuOrange);
  cab.position.set(0, 1.45, 1.9);
  cab.castShadow = true;
  group.add(cab);

  const box = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.2, 4.6), materials.clay);
  box.position.set(0, 1.85, -1.4);
  box.castShadow = true;
  group.add(box);

  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.36, 16).rotateZ(Math.PI / 2);
  [
    [-1.2, 0.48, 1.9],
    [1.2, 0.48, 1.9],
    [-1.2, 0.48, -1.1],
    [1.2, 0.48, -1.1],
    [-1.2, 0.48, -2.5],
    [1.2, 0.48, -2.5]
  ].forEach(p => {
    const w = new THREE.Mesh(wheelGeo, materials.rubber);
    w.position.set(p[0], p[1], p[2]);
    group.add(w);
    wheels.push(w);
  });

  const headlights: THREE.SpotLight[] = [];
  if (isPlayer) {
    const spotL = new THREE.SpotLight(0xfff8e7, 4.0, 55, Math.PI / 6, 0.4);
    spotL.position.set(-0.85, 0.95, 2.9);
    spotL.target.position.set(-0.85, 0, 20);
    group.add(spotL);
    group.add(spotL.target);
    headlights.push(spotL);

    const spotR = new THREE.SpotLight(0xfff8e7, 4.0, 55, Math.PI / 6, 0.4);
    spotR.position.set(0.85, 0.95, 2.9);
    spotR.target.position.set(0.85, 0, 20);
    group.add(spotR);
    group.add(spotR.target);
    headlights.push(spotR);
  }

  // 3D Dual Boost Flame Jets
  const boostFlameJets: THREE.Mesh[] = [];
  if (isPlayer) {
    const flameGeo = new THREE.ConeGeometry(0.14, 1.4, 8);
    flameGeo.rotateX(Math.PI / 2);
    [-0.6, 0.6].forEach(x => {
      const jet = new THREE.Mesh(flameGeo, materials.flameBlue);
      jet.position.set(x, 0.5, -3.75);
      jet.visible = false;
      group.add(jet);
      boostFlameJets.push(jet);
    });
  }

  // Taillights
  const tlGeo = new THREE.BoxGeometry(0.24, 0.22, 0.08);
  const leftTL = new THREE.Mesh(tlGeo, materials.taillight);
  leftTL.position.set(-0.7, 0.68, -2.12);
  group.add(leftTL);

  const rightTL = new THREE.Mesh(tlGeo, materials.taillight);
  rightTL.position.set(0.7, 0.68, -2.12);
  group.add(rightTL);

  // Turn Signal Blinkers
  const blinkerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.08);
  const leftFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftFB.position.set(-1.0, 0.78, 2.42);
  group.add(leftFB);

  const leftRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  leftRB.position.set(-1.0, 0.84, -2.42);
  group.add(leftRB);

  const rightFB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightFB.position.set(1.0, 0.78, 2.42);
  group.add(rightFB);

  const rightRB = new THREE.Mesh(blinkerGeo, materials.blinkerAmberOff);
  rightRB.position.set(1.0, 0.84, -2.42);
  group.add(rightRB);

  return {
    group,
    wheels,
    headlights,
    taillights: [leftTL, rightTL],
    leftBlinkers: [leftFB, leftRB],
    rightBlinkers: [rightFB, rightRB],
    boostFlameJets
  };
}

// 5. Federal Police Cruiser
export function createPolice3D(isPlayer: boolean = false): Vehicle3DModel {
  const model = createLada3D(isPlayer);
  (model.group.children[0] as THREE.Mesh).material = materials.policeWhite;

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 4.0), materials.policeBlue);
  stripe.position.set(0, 0.72, 0);
  model.group.add(stripe);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.32), materials.chrome);
  bar.position.set(0, 1.75, -0.2);
  model.group.add(bar);

  const strobeRed = new THREE.PointLight(0xef4444, 4.5, 20);
  strobeRed.position.set(-0.35, 1.9, -0.2);
  model.group.add(strobeRed);

  const strobeBlue = new THREE.PointLight(0x3b82f6, 4.5, 20);
  strobeBlue.position.set(0.35, 1.9, -0.2);
  model.group.add(strobeBlue);

  model.policeStrobeRed = strobeRed;
  model.policeStrobeBlue = strobeBlue;

  return model;
}

// 5b. Modern Addis Electric Crossover EV (VW ID.4 / BYD style)
export function createEV3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const leftBlinkers: THREE.Mesh[] = [];
  const rightBlinkers: THREE.Mesh[] = [];

  const bodyMats = [materials.evWhite, materials.evTeal, materials.evSilver];
  const bodyMat = bodyMats[Math.floor(Math.random() * bodyMats.length)];

  // Sleek aerodynamic lower chassis
  const lower = new THREE.Mesh(new RoundedBoxGeometry(1.94, 0.68, 4.45, 3, 0.14), bodyMat);
  lower.position.set(0, 0.62, 0);
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  // Sloped glasshouse cabin
  const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.72, 0.56, 2.55, 3, 0.16), materials.glass);
  cabin.position.set(0, 1.18, -0.18);
  cabin.castShadow = true;
  group.add(cabin);

  // Body-color roof cap
  const roof = new THREE.Mesh(new RoundedBoxGeometry(1.54, 0.09, 2.1, 2, 0.04), bodyMat);
  roof.position.set(0, 1.46, -0.22);
  group.add(roof);

  // Signature EV full-width front & rear LED lightbars
  const frontBar = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.07, 0.08), materials.evLightbar);
  frontBar.position.set(0, 0.78, 2.22);
  group.add(frontBar);

  const rearBar = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.08, 0.08), materials.taillight);
  rearBar.position.set(0, 0.82, -2.22);
  group.add(rearBar);

  // Green Ethiopian EV license plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.05), materials.evPlateGreen);
  plate.position.set(0, 0.45, -2.23);
  group.add(plate);

  // Blinkers
  const bGeo = new THREE.BoxGeometry(0.16, 0.09, 0.12);
  for (const z of [2.18, -2.18]) {
    const bL = new THREE.Mesh(bGeo, materials.blinkerAmberOff);
    bL.position.set(-0.86, 0.68, z);
    group.add(bL);
    leftBlinkers.push(bL);

    const bR = new THREE.Mesh(bGeo, materials.blinkerAmberOff);
    bR.position.set(0.86, 0.68, z);
    group.add(bR);
    rightBlinkers.push(bR);
  }

  // Alloy wheels
  const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.26, 12);
  rimGeo.rotateZ(Math.PI / 2);

  for (const [wx, wz] of [[-0.92, 1.38], [0.92, 1.38], [-0.92, -1.38], [0.92, -1.38]]) {
    const tire = new THREE.Mesh(tireGeo, materials.rubber);
    tire.position.set(wx, 0.36, wz);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, materials.hubcap);
    tire.add(rim);
    group.add(tire);
    wheels.push(tire);
  }

  return { group, wheels, headlights: [], leftBlinkers, rightBlinkers };
}

// 5c. Addis Electric City Bus (Anbessa / Sheger E-Bus)
export function createElectricBus3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const leftBlinkers: THREE.Mesh[] = [];
  const rightBlinkers: THREE.Mesh[] = [];

  // Main bus body (Green eco-transit lower + crisp white upper or yellow stripe)
  const lower = new THREE.Mesh(new RoundedBoxGeometry(2.48, 1.25, 9.0, 2, 0.08), materials.busGreen);
  lower.position.set(0, 1.05, 0);
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.51, 0.22, 9.02), materials.busYellow);
  stripe.position.set(0, 1.68, 0);
  group.add(stripe);

  const upper = new THREE.Mesh(new RoundedBoxGeometry(2.44, 1.28, 8.92, 2, 0.08), materials.minibusWhite);
  upper.position.set(0, 2.38, 0);
  upper.castShadow = true;
  group.add(upper);

  // Panoramic front windshield & side passenger window band
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.35, 0.1), materials.glass);
  frontGlass.position.set(0, 2.15, 4.46);
  group.add(frontGlass);

  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.88, 7.8), materials.glass);
  sideGlass.position.set(0, 2.35, -0.2);
  group.add(sideGlass);

  // Roof-mounted electric battery & HVAC pod
  const batteryPod = new THREE.Mesh(new RoundedBoxGeometry(1.75, 0.34, 5.2, 2, 0.06), materials.evSilver);
  batteryPod.position.set(0, 3.16, 0.2);
  group.add(batteryPod);

  // Amber LED destination header
  const destBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 0.12), materials.blinker);
  destBoard.position.set(0, 2.92, 4.46);
  group.add(destBoard);

  // Headlights & Taillights
  const hlGeo = new THREE.BoxGeometry(0.32, 0.18, 0.1);
  for (const x of [-0.9, 0.9]) {
    const hl = new THREE.Mesh(hlGeo, materials.headlightOn);
    hl.position.set(x, 0.72, 4.5);
    group.add(hl);
    const tl = new THREE.Mesh(hlGeo, materials.taillight);
    tl.position.set(x, 0.85, -4.5);
    group.add(tl);
  }

  // Blinkers
  const bGeo = new THREE.BoxGeometry(0.18, 0.14, 0.12);
  for (const z of [4.48, -4.48]) {
    const bL = new THREE.Mesh(bGeo, materials.blinkerAmberOff);
    bL.position.set(-1.12, 0.72, z);
    group.add(bL);
    leftBlinkers.push(bL);

    const bR = new THREE.Mesh(bGeo, materials.blinkerAmberOff);
    bR.position.set(1.12, 0.72, z);
    group.add(bR);
    rightBlinkers.push(bR);
  }

  // Heavy bus wheels
  const tireGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.34, 12);
  rimGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [[-1.16, 2.75], [1.16, 2.75], [-1.16, -2.65], [1.16, -2.65]]) {
    const tire = new THREE.Mesh(tireGeo, materials.rubber);
    tire.position.set(wx, 0.48, wz);
    tire.castShadow = true;
    tire.add(new THREE.Mesh(rimGeo, materials.hubcap));
    group.add(tire);
    wheels.push(tire);
  }

  return { group, wheels, headlights: [], leftBlinkers, rightBlinkers };
}

export function createVehicleMeshById(id: VehicleId, isPlayer: boolean = false): Vehicle3DModel {
  switch (id) {
    case 'MINIBUS':
      return createMinibus3D(isPlayer);
    case 'LADA':
      return createLada3D(isPlayer);
    case 'BAJAJ':
      return createBajaj3D(isPlayer);
    case 'ISUZU':
      return createIsuzu3D(isPlayer);
    default:
      return createMinibus3D(isPlayer);
  }
}

// 6. Ethiopian Zebu Cattle (የሀበሻ በሬ/ላም with thoracic hump & curved horns)
export function createZebuCow3D(): THREE.Group {
  const group = new THREE.Group();

  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 2.1), materials.cowTan);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // Thoracic Hump (Iconic Zebu feature)
  const hump = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.75), materials.cowTan);
  hump.position.set(0, 1.72, 0.35);
  hump.castShadow = true;
  group.add(hump);

  // Neck & Head
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.7), materials.cowTan);
  neck.position.set(0, 1.35, 1.15);
  neck.rotation.x = -0.3;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.6), materials.cowWhite);
  head.position.set(0, 1.45, 1.5);
  group.add(head);

  // Curved Horns (Pointing outwards and upwards)
  const hornGeo = new THREE.CylinderGeometry(0.05, 0.015, 0.65, 6);
  const hornL = new THREE.Mesh(hornGeo, materials.cowHorns);
  hornL.position.set(-0.35, 1.82, 1.45);
  hornL.rotation.z = 0.55;
  hornL.rotation.x = -0.2;
  group.add(hornL);

  const hornR = new THREE.Mesh(hornGeo, materials.cowHorns);
  hornR.position.set(0.35, 1.82, 1.45);
  hornR.rotation.z = -0.55;
  hornR.rotation.x = -0.2;
  group.add(hornR);

  // 4 Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.85, 6);
  [
    [-0.32, 0.42, 0.7],
    [0.32, 0.42, 0.7],
    [-0.32, 0.42, -0.7],
    [0.32, 0.42, -0.7]
  ].forEach(p => {
    const leg = new THREE.Mesh(legGeo, materials.cowTan);
    leg.position.set(p[0], p[1], p[2]);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}

// 7. Ethiopian Highland Goat (ፍየል)
export function createGoat3D(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 1.05), materials.goatDark);
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.4), materials.goatDark);
  head.position.set(0, 0.95, 0.6);
  group.add(head);

  // Small backward horns
  const hornGeo = new THREE.CylinderGeometry(0.03, 0.01, 0.3, 5);
  const hornL = new THREE.Mesh(hornGeo, materials.cowHorns);
  hornL.position.set(-0.1, 1.15, 0.55);
  hornL.rotation.x = -0.5;
  group.add(hornL);

  const hornR = new THREE.Mesh(hornGeo, materials.cowHorns);
  hornR.position.set(0.1, 1.15, 0.55);
  hornR.rotation.x = -0.5;
  group.add(hornR);

  // 4 Legs
  const legGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.5, 5);
  [
    [-0.18, 0.25, 0.38],
    [0.18, 0.25, 0.38],
    [-0.18, 0.25, -0.38],
    [0.18, 0.25, -0.38]
  ].forEach(p => {
    const leg = new THREE.Mesh(legGeo, materials.goatDark);
    leg.position.set(p[0], p[1], p[2]);
    group.add(leg);
  });

  return group;
}

// 8. Authentic Ethiopian Road Pothole (ጉድጓድ)
export function createPothole3D(): THREE.Group {
  const group = new THREE.Group();

  // Dark recessed circular cavity
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, 0.04, 14), materials.potholeDark);
  hole.position.y = 0.02;
  group.add(hole);

  // Jagged asphalt broken edge ring
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.98, 1.05, 0.02, 14), materials.potholeEdge);
  edge.position.y = 0.01;
  group.add(edge);

  return group;
}

// 9. 3D Gold Birr Coin (የብር ሳንቲም)
export function createBirrCoin3D(): THREE.Group {
  const group = new THREE.Group();

  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 16), materials.gold);
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.65;
  group.add(coin);

  const innerRim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.09, 16), materials.hubcap);
  innerRim.rotation.x = Math.PI / 2;
  innerRim.position.y = 0.65;
  group.add(innerRim);

  return group;
}

// 10. Traditional Black Clay Coffee Jebena (የቡና ጀበና)
export function createBunnaJebena3D(): THREE.Group {
  const group = new THREE.Group();

  // Straw mat base (ማትማጫ)
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 6, 12), materials.luggageYellow);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.35;
  group.add(baseRing);

  // Round black clay spherical belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), materials.clay);
  belly.position.y = 0.62;
  group.add(belly);

  // Tall tapered neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.42, 10), materials.clay);
  neck.position.y = 0.95;
  group.add(neck);

  // Spout (ማፍሰሻ)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.28, 6), materials.clay);
  spout.position.set(0, 0.74, 0.28);
  spout.rotation.x = 0.6;
  group.add(spout);

  // Curved Clay Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 10), materials.clay);
  handle.position.set(0, 0.82, -0.22);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  return group;
}

// 11. Red Jerry Can Fuel (ቤንዚን ቦቲ)
export function createFuelCan3D(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.28), materials.fuelRed);
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.24), materials.fuelRed);
  handle.position.set(0, 0.94, 0);
  group.add(handle);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), materials.chrome);
  cap.position.set(0.14, 0.92, 0.08);
  group.add(cap);

  return group;
}

// 12. Rigged 3D Human Pedestrian / Passenger (GTA-style GLB character)
export function createPassenger3D(role: 'passenger' | 'pedestrian' = 'passenger'): THREE.Group {
  return createRealHuman3D(role);
}

// 12b. Rigged 3D Human Cyclist & Bicycle (ለብስክሌት መንገድ)
export function createCyclist3D(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.7 });

  // Bicycle Wheels
  const wheelGeo = new THREE.TorusGeometry(0.33, 0.038, 8, 16);
  wheelGeo.rotateY(Math.PI / 2);
  const wheelF = new THREE.Mesh(wheelGeo, materials.rubber);
  wheelF.position.set(0, 0.35, 0.56);
  const wheelR = new THREE.Mesh(wheelGeo, materials.rubber);
  wheelR.position.set(0, 0.35, -0.56);
  group.add(wheelF, wheelR);

  // Diamond Bicycle Frame, Fork, Handlebars & Saddle
  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 6), frameMat);
  topTube.rotation.x = Math.PI / 2;
  topTube.position.set(0, 0.74, 0.04);
  const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.76, 6), frameMat);
  downTube.rotation.x = 0.85;
  downTube.position.set(0, 0.55, 0.14);
  const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6), frameMat);
  seatTube.rotation.x = -0.25;
  seatTube.position.set(0, 0.6, -0.22);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.64, 6), frameMat);
  fork.rotation.x = -0.28;
  fork.position.set(0, 0.62, 0.44);
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 6), materials.chrome);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.94, 0.36);
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.24), materials.signalHousing);
  saddle.position.set(0, 0.9, -0.26);
  group.add(topTube, downTube, seatTube, fork, handlebar, saddle);

  // Real Rigged 3D Human Rider
  group.add(createRealHuman3D('cyclist'));
  group.userData.wheels = [wheelF, wheelR];

  return group;
}

// 13. Traffic Police Checkpoint Cone (የፖሊስ ኮን)
export function createPoliceCone3D(): THREE.Group {
  const group = new THREE.Group();

  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 8), materials.coneOrange);
  cone.position.y = 0.35;
  group.add(cone);

  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.15, 8), materials.minibusWhite);
  stripe.position.y = 0.32;
  group.add(stripe);

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), materials.rubber);
  base.position.y = 0.025;
  group.add(base);

  return group;
}

// 14. Umbrella Acacia Tree (ግራር ዛፍ)
export function createAcaciaTree3D(): THREE.Group {
  const group = new THREE.Group();

  // Gnarled branching trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 4.2, 6), materials.acaciaBark);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  group.add(trunk);

  // Wide flat-topped umbrella canopy
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 2.5, 0.95, 8), materials.acaciaFoliage);
  canopy.position.y = 4.4;
  canopy.castShadow = true;
  group.add(canopy);

  const upperCanopy = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, 0.65, 8), materials.acaciaFoliage);
  upperCanopy.position.y = 4.9;
  group.add(upperCanopy);

  return group;
}

// 15. Bahir Zaf / Tall Eucalyptus Tree (ባህር ዛፍ)
export function createEucalyptusTree3D(): THREE.Group {
  const group = new THREE.Group();

  // Slender pale trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 9.5, 6), materials.eucalyptusBark);
  trunk.position.y = 4.75;
  trunk.castShadow = true;
  group.add(trunk);

  // Tiered high foliage clusters
  [
    { y: 7.2, r: 1.5, h: 2.2 },
    { y: 8.8, r: 1.2, h: 2.0 },
    { y: 10.2, r: 0.8, h: 1.6 }
  ].forEach(t => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), materials.eucalyptusFoliage);
    f.position.y = t.y;
    f.castShadow = true;
    group.add(f);
  });

  return group;
}

// 16. Addis Corridor Smart Dual-Arm LED Street Lamp (የዘመናዊ ጎዳና መብራት)
export function createStreetLamp3D(): THREE.Group {
  const group = new THREE.Group();

  // Sleek dark-metallic tapered smart pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 7.6, 8), materials.smartPole);
  pole.position.y = 3.8;
  group.add(pole);

  // Decorative base collar
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.7, 8), materials.smartPole);
  base.position.y = 0.35;
  group.add(base);

  // Dual arched overhead luminaire arms (roadway + pedestrian walkway)
  const armRoad = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.08), materials.smartPole);
  armRoad.position.set(0.95, 7.45, 0);
  armRoad.rotation.z = 0.08;
  group.add(armRoad);

  const headRoad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.32), materials.ledCoolWhite);
  headRoad.position.set(1.9, 7.52, 0);
  group.add(headRoad);

  const housingRoad = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.36), materials.signalHousing);
  housingRoad.position.set(1.9, 7.59, 0);
  group.add(housingRoad);

  const armWalk = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.07), materials.smartPole);
  armWalk.position.set(-0.5, 5.8, 0);
  armWalk.rotation.z = -0.1;
  group.add(armWalk);

  const headWalk = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.24), materials.ledCoolWhite);
  headWalk.position.set(-0.95, 5.75, 0);
  group.add(headWalk);

  // Addis Ababa Boulevard Tricolor Banner (Green / Yellow / Red)
  const bannerG = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), materials.bldgAwningGreen);
  bannerG.position.set(0.32, 4.9, 0);
  group.add(bannerG);
  const bannerY = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), materials.gold);
  bannerY.position.set(0.32, 4.45, 0);
  group.add(bannerY);
  const bannerR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), materials.fuelRed);
  bannerR.position.set(0.32, 4.0, 0);
  group.add(bannerR);

  return group;
}

// 16b. Addis Corridor Ornamental Palm Tree (የቦሌ መንገድ ዘንባባ)
export function createPalmTree3D(): THREE.Group {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 6.2, 7), materials.palmTrunk);
  trunk.position.y = 3.1;
  trunk.castShadow = true;
  group.add(trunk);

  const frondGeo = new THREE.ConeGeometry(0.55, 3.2, 4);
  frondGeo.scale(1, 1, 0.16);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const frond = new THREE.Mesh(frondGeo, materials.palmFrond);
    frond.position.set(Math.cos(angle) * 1.15, 6.1, Math.sin(angle) * 1.15);
    frond.rotation.y = -angle + Math.PI / 2;
    frond.rotation.x = 1.18;
    group.add(frond);
  }

  return group;
}

// 17. Commercial Addis Billboard (የንግድ ማስታወቂያ)
export function createBillboard3D(): THREE.Group {
  const group = new THREE.Group();

  // Two support pillars
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6), materials.concretePillar);
  postL.position.set(-1.6, 2.25, 0);
  group.add(postL);

  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6), materials.concretePillar);
  postR.position.set(1.6, 2.25, 0);
  group.add(postR);

  // Billboard Board Panel
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.18), materials.minibusWhite);
  board.position.set(0, 5.0, 0);
  group.add(board);

  // Billboard Colorful Face (St. George Beer / Bunna Coffee motif)
  const face = new THREE.Mesh(new THREE.BoxGeometry(3.9, 1.9, 0.2), materials.minibusBlue);
  face.position.set(0, 5.0, 0.02);
  group.add(face);

  return group;
}

// 18. Addis Taxi Stop Sign ("የታክሲ ማቆሚያ")
export function createTaxiSign3D(): THREE.Group {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), materials.chrome);
  pole.position.y = 1.4;
  group.add(pole);

  const sign = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12), materials.minibusBlue);
  sign.rotation.x = Math.PI / 2;
  sign.position.y = 2.75;
  group.add(sign);

  return group;
}

// 19. Highway Checkpoint Finish Gantry (የመድረሻ ኬላ)
export function createCheckpointGate3D(): THREE.Group {
  const group = new THREE.Group();

  // Left & Right Gantry Towers
  const towerGeo = new THREE.BoxGeometry(0.6, 8.0, 0.6);
  const towerL = new THREE.Mesh(towerGeo, materials.concretePillar);
  towerL.position.set(-11.0, 4.0, 0);
  group.add(towerL);

  const towerR = new THREE.Mesh(towerGeo, materials.concretePillar);
  towerR.position.set(11.0, 4.0, 0);
  group.add(towerR);

  // Overhead Cross Truss
  const truss = new THREE.Mesh(new THREE.BoxGeometry(23.0, 1.2, 1.0), materials.concretePillar);
  truss.position.set(0, 7.8, 0);
  group.add(truss);

  // Illuminated Finish Banner
  const banner = new THREE.Mesh(new THREE.BoxGeometry(18.0, 1.6, 0.2), materials.gold);
  banner.position.set(0, 7.8, 0.55);
  group.add(banner);

  return group;
}

// 20. Iconic Commercial Bank of Ethiopia (CBE) Headquarters Tower (209m)
export function createCBETower3D(): THREE.Group {
  const group = new THREE.Group();

  // Sweeping commercial podium plaza
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(16, 18, 12, 8), materials.bldgConcrete);
  podium.position.y = 6;
  group.add(podium);

  // Tapered, faceted glass prism skyscraper
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 11.8, 124, 8), materials.cbeFacetGlass);
  tower.position.y = 74;
  group.add(tower);

  // Exterior structural blue-silver curtain-wall ribs
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(22 - i * 1.4, 120, 1.3), materials.cbeTrim);
    rib.position.y = 72;
    rib.rotation.y = (i * Math.PI) / 4;
    group.add(rib);
  }

  // Top observation crown & architectural spire
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 7.2, 10, 8), materials.chrome);
  crown.position.y = 141;
  group.add(crown);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 1.4, 8), materials.gold);
  beacon.position.y = 136;
  group.add(beacon);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 1.2, 24, 8), materials.chrome);
  spire.position.y = 158;
  group.add(spire);

  return group;
}

// 21. Addis Ababa Light Rail Transit (AALRT) Elevated Viaduct, Station & Articulated Tram
export function createLightRailViaduct3D(): THREE.Group {
  const group = new THREE.Group();

  // 240m Elevated Twin-Track Concrete Viaduct Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.2, 240), materials.concretePillar);
  deck.position.set(0, 6.2, 0);
  group.add(deck);

  // Concrete safety parapet walls along deck edges
  for (const px of [-4.15, 4.15]) {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 240), materials.bldgConcrete);
    parapet.position.set(px, 7.25, 0);
    group.add(parapet);
  }

  // Concrete Piers & Overhead Catenary Gantry Poles
  for (let z = -105; z <= 105; z += 30) {
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 6.2, 8), materials.concretePillar);
    pier.position.set(0, 3.1, z);
    group.add(pier);

    const catenaryPole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 0.2), materials.smartPole);
    catenaryPole.position.set(-3.9, 8.9, z);
    group.add(catenaryPole);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 0.14), materials.smartPole);
    crossArm.position.set(-1.6, 10.9, z);
    group.add(crossArm);
  }

  // Elevated AALRT Station Canopy (Arched translucent roof)
  const canopyGeo = new THREE.CylinderGeometry(5.6, 5.6, 38, 12, 1, true, -Math.PI * 0.36, Math.PI * 0.72);
  canopyGeo.rotateX(Math.PI / 2);
  const stationCanopy = new THREE.Mesh(canopyGeo, materials.lrtCanopy);
  stationCanopy.position.set(0, 7.8, 0);
  group.add(stationCanopy);

  // Articulated 3-Car Blue & White Addis LRT Tram (moves along viaduct)
  const tram = new THREE.Group();
  tram.position.set(0, 7.0, 0);

  for (const carZ of [-10.6, 0, 10.6]) {
    const lower = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.3, 9.6), materials.lrtBlue);
    lower.position.set(0, 0.85, carZ);
    tram.add(lower);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.25, 9.5), materials.minibusWhite);
    upper.position.set(0, 2.1, carZ);
    tram.add(upper);

    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.85, 8.6), materials.glass);
    windows.position.set(0, 2.05, carZ);
    tram.add(windows);
  }

  // Articulated accordion bellows between cars
  for (const jointZ of [-5.3, 5.3]) {
    const bellows = new THREE.Mesh(new THREE.BoxGeometry(2.45, 2.35, 1.1), materials.signalHousing);
    bellows.position.set(0, 1.45, jointZ);
    tram.add(bellows);
  }

  // Front & rear windshields + headlights + roof pantograph
  for (const dir of [-1, 1]) {
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.12), materials.glass);
    ws.position.set(0, 1.9, dir * 15.42);
    tram.add(ws);

    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.12), materials.headlightOn);
    hl.position.set(0, 0.75, dir * 15.42);
    tram.add(hl);
  }
  const pantograph = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.4), materials.chrome);
  pantograph.position.set(0, 3.1, 0);
  tram.add(pantograph);

  tram.userData.isLrtTrain = true;
  group.add(tram);

  return group;
}

// 22. Overhead Highway Traffic Light Gantry (የትራፊክ መብራት ፖርታል)
export function createTrafficLightGantry3D(): TrafficLight3DModel {
  const group = new THREE.Group();

  // 1. Support Pillars (Left & Right Shoulders)
  const pillarGeo = new THREE.BoxGeometry(0.5, 7.8, 0.5);
  const leftPillar = new THREE.Mesh(pillarGeo, materials.concretePillar);
  leftPillar.position.set(-11.0, 3.9, 0);
  leftPillar.castShadow = true;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, materials.concretePillar);
  rightPillar.position.set(11.0, 3.9, 0);
  rightPillar.castShadow = true;
  group.add(rightPillar);

  // 2. Overhead Truss Gantry Beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(22.8, 0.65, 0.65), materials.concretePillar);
  beam.position.set(0, 7.5, 0);
  beam.castShadow = true;
  group.add(beam);

  // 3. Three Traffic Signal Heads (Above Left Lane, Center Lane, Right Lane)
  const laneOffsets = [-5.5, 0, 5.5];
  const signalHeads: { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh }[] = [];

  const housingGeo = new THREE.BoxGeometry(0.95, 2.5, 0.55);
  const lensGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16);
  lensGeo.rotateX(Math.PI / 2);
  const visorGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 12, 1, false, -Math.PI * 0.75, Math.PI * 0.75);
  visorGeo.rotateX(Math.PI / 2);

  laneOffsets.forEach(xOffset => {
    const headGroup = new THREE.Group();
    headGroup.position.set(xOffset, 5.8, 0.35);

    // Dark housing box
    const housing = new THREE.Mesh(housingGeo, materials.signalHousing);
    housing.castShadow = true;
    headGroup.add(housing);

    // Red Lens (Top)
    const redLens = new THREE.Mesh(lensGeo, materials.signalRedOn);
    redLens.position.set(0, 0.75, 0.28);
    headGroup.add(redLens);

    const redVisor = new THREE.Mesh(visorGeo, materials.signalVisor);
    redVisor.position.set(0, 0.75, 0.35);
    headGroup.add(redVisor);

    // Yellow Lens (Middle)
    const yellowLens = new THREE.Mesh(lensGeo, materials.signalYellowOff);
    yellowLens.position.set(0, 0, 0.28);
    headGroup.add(yellowLens);

    const yellowVisor = new THREE.Mesh(visorGeo, materials.signalVisor);
    yellowVisor.position.set(0, 0, 0.35);
    headGroup.add(yellowVisor);

    // Green Lens (Bottom)
    const greenLens = new THREE.Mesh(lensGeo, materials.signalGreenOff);
    greenLens.position.set(0, -0.75, 0.28);
    headGroup.add(greenLens);

    const greenVisor = new THREE.Mesh(visorGeo, materials.signalVisor);
    greenVisor.position.set(0, -0.75, 0.35);
    headGroup.add(greenVisor);

    group.add(headGroup);
    signalHeads.push({ red: redLens, yellow: yellowLens, green: greenLens });
  });

  // 4. Dynamic Point Light casting active light onto the road
  const lightSource = new THREE.PointLight(0xff0000, 4.0, 32);
  lightSource.position.set(0, 5.8, 1.2);
  group.add(lightSource);

  const setState = (state: 'GREEN' | 'YELLOW' | 'RED') => {
    signalHeads.forEach(head => {
      head.red.material = state === 'RED' ? materials.signalRedOn : materials.signalRedOff;
      head.yellow.material = state === 'YELLOW' ? materials.signalYellowOn : materials.signalYellowOff;
      head.green.material = state === 'GREEN' ? materials.signalGreenOn : materials.signalGreenOff;
    });

    if (state === 'RED') {
      lightSource.color.setHex(0xff0000);
      lightSource.intensity = 4.5;
    } else if (state === 'YELLOW') {
      lightSource.color.setHex(0xfbbf24);
      lightSource.intensity = 4.0;
    } else {
      lightSource.color.setHex(0x22c55e);
      lightSource.intensity = 3.5;
    }
  };

  return { group, signalHeads, lightSource, setState };
}

// 23. Asphalt Painted Directional Lane Arrows
export function createLaneArrowMesh3D(direction: 'STRAIGHT' | 'LEFT' | 'RIGHT'): THREE.Group {
  const group = new THREE.Group();

  // Shaft
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 2.4), materials.asphaltPaintWhite);
  shaft.position.set(0, 0.09, 0);
  group.add(shaft);

  // Arrow Head
  if (direction === 'STRAIGHT') {
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.8), materials.asphaltPaintWhite);
    headL.position.set(-0.25, 0.09, 0.85);
    headL.rotation.y = Math.PI / 4;
    group.add(headL);

    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.8), materials.asphaltPaintWhite);
    headR.position.set(0.25, 0.09, 0.85);
    headR.rotation.y = -Math.PI / 4;
    group.add(headR);
  } else if (direction === 'LEFT') {
    const headCurve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 1.2), materials.asphaltPaintWhite);
    headCurve.position.set(-0.45, 0.09, 0.6);
    headCurve.rotation.y = Math.PI / 3;
    group.add(headCurve);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.7), materials.asphaltPaintWhite);
    tip.position.set(-0.85, 0.09, 0.85);
    tip.rotation.y = Math.PI / 6;
    group.add(tip);
  } else {
    const headCurve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 1.2), materials.asphaltPaintWhite);
    headCurve.position.set(0.45, 0.09, 0.6);
    headCurve.rotation.y = -Math.PI / 3;
    group.add(headCurve);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.7), materials.asphaltPaintWhite);
    tip.position.set(0.85, 0.09, 0.85);
    tip.rotation.y = -Math.PI / 6;
    group.add(tip);
  }

  return group;
}

// 24. Ethiopian Roadside Buildings (Apartments, Shops, Commercial Towers, Neighborhood Houses)
export function createBuilding3D(variant: 'APARTMENT' | 'SHOP' | 'TOWER' | 'HOUSE'): THREE.Group {
  const group = new THREE.Group();

  if (variant === 'SHOP') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(10.5, 7.2, 8.0), materials.bldgStuccoCream);
    body.position.y = 3.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.5, 8.4), materials.bldgStuccoTerracotta);
    roofTrim.position.y = 7.45;
    group.add(roofTrim);

    const awningMat = Math.random() > 0.5 ? materials.bldgAwningGreen : materials.bldgAwningGold;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.35, 1.8), awningMat);
    awning.position.set(0, 3.1, 4.6);
    awning.rotation.x = 0.22;
    group.add(awning);

    const shopWindow = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.2, 0.15), materials.bldgWindowLit);
    shopWindow.position.set(0, 1.4, 4.02);
    group.add(shopWindow);

    // Upper floor windows with frames
    for (const wx of [-3.2, 0, 3.2]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.65, 0.12), materials.bldgDarkTrim);
      frame.position.set(wx, 5.2, 4.0);
      group.add(frame);

      const win = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.35, 0.16), materials.bldgWindowDark);
      win.position.set(wx, 5.2, 4.03);
      group.add(win);
    }

    // Illuminated storefront fascia sign
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.65, 0.22), materials.bldgWindowLit);
    signBoard.position.set(0, 3.65, 4.08);
    group.add(signBoard);
  } else if (variant === 'APARTMENT') {
    const floors = 4 + Math.floor(Math.random() * 2);
    const h = floors * 3.4;
    const wallMat = Math.random() > 0.45 ? materials.bldgStuccoCream : materials.bldgStuccoTerracotta;
    const body = new THREE.Mesh(new THREE.BoxGeometry(12.0, h, 9.5), wallMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.45, 9.9), materials.bldgDarkTrim);
    roof.position.y = h + 0.22;
    group.add(roof);

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.8, 10), materials.bldgWaterTank);
    tank.position.set(-3.2, h + 1.35, -1.5);
    group.add(tank);

    for (let f = 0; f < floors; f++) {
      const wy = 2.0 + f * 3.4;
      for (const wx of [-3.8, -1.3, 1.3, 3.8]) {
        const isLit = (f + Math.abs(wx)) % 2 === 0;
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.5, 0.15),
          isLit ? materials.bldgWindowLit : materials.bldgWindowDark
        );
        win.position.set(wx, wy, 4.78);
        group.add(win);
      }
    }
  } else if (variant === 'TOWER') {
    const floors = 8 + Math.floor(Math.random() * 4);
    const h = floors * 3.6;
    const core = new THREE.Mesh(new THREE.BoxGeometry(13.4, h, 11.2), materials.bldgConcrete);
    core.position.y = h / 2;
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // Modern Bole / Financial District curtain-wall glass facade
    const facade = new THREE.Mesh(new THREE.BoxGeometry(12.2, h - 1.2, 11.5), materials.bldgGlassBlue);
    facade.position.y = h / 2 + 0.3;
    group.add(facade);

    // Vertical aluminum mullions
    for (const mx of [-4.2, -1.4, 1.4, 4.2]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.28, h - 0.8, 11.65), materials.bldgDarkTrim);
      mullion.position.set(mx, h / 2 + 0.3, 0);
      group.add(mullion);
    }

    for (let f = 1; f < floors; f++) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.42, 11.75), materials.bldgDarkTrim);
      band.position.y = f * 3.6;
      group.add(band);
    }

    // Rooftop mechanical penthouse + illuminated commercial crown
    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.4, 6.2), materials.bldgDarkTrim);
    penthouse.position.y = h + 1.2;
    group.add(penthouse);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.3, 0.5), materials.bldgWindowLit);
    crown.position.set(0, h + 0.75, 5.75);
    group.add(crown);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.0, 7.5), materials.bldgStuccoCream);
    body.position.y = 2.0;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.4, 4), materials.bldgRoofRed);
    roof.position.y = 5.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.8, 0.45), materials.bldgConcrete);
    wall.position.set(0, 0.9, 5.0);
    group.add(wall);

    for (const wx of [-2.4, 2.4]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.15), materials.bldgWindowLit);
      win.position.set(wx, 2.3, 3.78);
      group.add(win);
    }
  }

  return group;
}
