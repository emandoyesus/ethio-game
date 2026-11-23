import * as THREE from 'three';
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
  blinker: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xfbbf24, emissiveIntensity: 2.0 }),

  gold: new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.3 }),
  clay: new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.85 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  luggageYellow: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
};

export interface Vehicle3DModel {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  taillights?: THREE.Mesh[];
  policeStrobeRed?: THREE.PointLight;
  policeStrobeBlue?: THREE.PointLight;
}

// 1. Toyota HiAce Blue Minibus Taxi (The iconic Addis workhorse)
export function createMinibus3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Lower Body (Blue)
  const lowerGeo = new THREE.BoxGeometry(2.1, 0.95, 4.8);
  const lowerMesh = new THREE.Mesh(lowerGeo, materials.minibusBlue);
  lowerMesh.position.y = 0.82;
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  group.add(lowerMesh);

  // Upper Cabin / Roof (White)
  const upperGeo = new THREE.BoxGeometry(2.0, 0.88, 4.4);
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

  // Roof Luggage Rack with wrapped baggage
  const rack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 2.8), materials.chrome);
  rack.position.set(0, 2.22, -0.5);
  group.add(rack);

  const parcel1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.9), materials.luggageYellow);
  parcel1.position.set(-0.4, 2.46, -0.7);
  group.add(parcel1);

  const parcel2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 1.0), materials.clay);
  parcel2.position.set(0.35, 2.48, -0.4);
  group.add(parcel2);

  // Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.3, 0.25), materials.chrome);
  frontBumper.position.set(0, 0.45, 2.42);
  group.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.3, 0.25), materials.chrome);
  rearBumper.position.set(0, 0.45, -2.42);
  group.add(rearBumper);

  // Headlights & Spotlights
  const hlGeo = new THREE.BoxGeometry(0.35, 0.22, 0.1);
  const leftHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  leftHL.position.set(-0.75, 0.78, 2.42);
  group.add(leftHL);

  const rightHL = new THREE.Mesh(hlGeo, materials.headlightOn);
  rightHL.position.set(0.75, 0.78, 2.42);
  group.add(rightHL);

  const spotL = new THREE.SpotLight(0xfff8e7, 3.8, 50, Math.PI / 6, 0.4);
  spotL.position.set(-0.75, 0.82, 2.5);
  spotL.target.position.set(-0.75, 0, 20);
  group.add(spotL);
  group.add(spotL.target);

  const spotR = new THREE.SpotLight(0xfff8e7, 3.8, 50, Math.PI / 6, 0.4);
  spotR.position.set(0.75, 0.82, 2.5);
  spotR.target.position.set(0.75, 0, 20);
  group.add(spotR);
  group.add(spotR.target);

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

  return { group, wheels, headlights: [spotL, spotR], taillights: [leftTL, rightTL] };
}

// 2. Classic Lada 2101 Taxi Sedan
export function createLada3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Lower Body (Blue)
  const lowerGeo = new THREE.BoxGeometry(1.82, 0.68, 4.4);
  const lowerMesh = new THREE.Mesh(lowerGeo, materials.ladaBlue);
  lowerMesh.position.y = 0.65;
  lowerMesh.castShadow = true;
  group.add(lowerMesh);

  // Cabin / Roof (White)
  const cabinGeo = new THREE.BoxGeometry(1.65, 0.72, 2.4);
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

  const spotL = new THREE.SpotLight(0xfff8e7, 3.4, 45, Math.PI / 6, 0.4);
  spotL.position.set(-0.68, 0.72, 2.3);
  spotL.target.position.set(-0.68, 0, 20);
  group.add(spotL);
  group.add(spotL.target);

  const spotR = new THREE.SpotLight(0xfff8e7, 3.4, 45, Math.PI / 6, 0.4);
  spotR.position.set(0.68, 0.72, 2.3);
  spotR.target.position.set(0.68, 0, 20);
  group.add(spotR);
  group.add(spotR.target);

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

  return { group, wheels, headlights: [spotL, spotR] };
}

// 3. Addis Bajaj (Auto-rickshaw 3-wheeler)
export function createBajaj3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.6), materials.bajajBlue);
  body.position.set(0, 0.6, 0);
  body.castShadow = true;
  group.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.9), materials.bajajBlue);
  hood.position.set(0, 0.6, 1.55);
  group.add(hood);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.9, 2.4), materials.rubber);
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

  const spot = new THREE.SpotLight(0xfff8e7, 3.0, 40, Math.PI / 6, 0.4);
  spot.position.set(0, 0.7, 2.0);
  spot.target.position.set(0, 0, 20);
  group.add(spot);
  group.add(spot.target);

  return { group, wheels, headlights: [spot] };
}

// 4. Isuzu Heavy Freight Truck
export function createIsuzu3D(): Vehicle3DModel {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 1.8), materials.isuzuOrange);
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

  const spotL = new THREE.SpotLight(0xfff8e7, 4.0, 55, Math.PI / 6, 0.4);
  spotL.position.set(-0.85, 0.95, 2.9);
  spotL.target.position.set(-0.85, 0, 20);
  group.add(spotL);
  group.add(spotL.target);

  const spotR = new THREE.SpotLight(0xfff8e7, 4.0, 55, Math.PI / 6, 0.4);
  spotR.position.set(0.85, 0.95, 2.9);
  spotR.target.position.set(0.85, 0, 20);
  group.add(spotR);
  group.add(spotR.target);

  return { group, wheels, headlights: [spotL, spotR] };
}

// 5. Federal Police Cruiser
export function createPolice3D(): Vehicle3DModel {
  const model = createLada3D();
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

export function createVehicleMeshById(id: VehicleId): Vehicle3DModel {
  switch (id) {
    case 'MINIBUS':
      return createMinibus3D();
    case 'LADA':
      return createLada3D();
    case 'BAJAJ':
      return createBajaj3D();
    case 'ISUZU':
      return createIsuzu3D();
    default:
      return createMinibus3D();
  }
}
