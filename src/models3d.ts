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
  concretePillar: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
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

// 12. Ethiopian Pedestrian / Passenger in Netela Shawl (ተሳፋሪ)
export function createPassenger3D(): THREE.Group {
  const group = new THREE.Group();

  // White Netela/Gabi Garment
  const gown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.15, 8), materials.netelaWhite);
  gown.position.y = 0.65;
  gown.castShadow = true;
  group.add(gown);

  // Emerald/Gold Tibeb embroidery trim around bottom
  const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.12, 8), materials.netelaTibeb);
  trim.position.y = 0.15;
  group.add(trim);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), materials.clay);
  head.position.y = 1.38;
  group.add(head);

  // Waving / Taxi Hailing Arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), materials.netelaWhite);
  arm.position.set(-0.35, 1.25, 0.1);
  arm.rotation.z = -0.55;
  arm.rotation.x = 0.35;
  group.add(arm);

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

// 16. Addis Highway Street Light Lamp (የጎዳና መብራት)
export function createStreetLamp3D(): THREE.Group {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.8, 6), materials.concretePillar);
  pole.position.y = 3.4;
  group.add(pole);

  // Curved overhead arm extending toward roadway
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.08), materials.chrome);
  arm.position.set(0.9, 6.75, 0);
  group.add(arm);

  // Overhead luminaire head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.25), materials.headlightOn);
  head.position.set(1.8, 6.7, 0);
  group.add(head);

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

  // Main glass prism skyscraper
  const tower = new THREE.Mesh(new THREE.BoxGeometry(18, 120, 18), materials.cbeTowerGlass);
  tower.position.y = 60;
  group.add(tower);

  // Exterior structural blue ribs
  const rib = new THREE.Mesh(new THREE.BoxGeometry(19.2, 115, 2), materials.cbeTrim);
  rib.position.y = 60;
  group.add(rib);

  // Top observation crown & architectural spire
  const crown = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 14), materials.chrome);
  crown.position.y = 125;
  group.add(crown);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 1.5, 25, 8), materials.chrome);
  spire.position.y = 142.5;
  group.add(spire);

  return group;
}

// 21. Addis Ababa Light Rail Transit (AALRT) Elevated Viaduct & Train
export function createLightRailViaduct3D(): THREE.Group {
  const group = new THREE.Group();

  // Viaduct Bridge Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 120), materials.concretePillar);
  deck.position.set(0, 6.0, 0);
  group.add(deck);

  // Concrete Piers
  for (let z = -50; z <= 50; z += 25) {
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 6.0, 8), materials.concretePillar);
    pier.position.set(0, 3.0, z);
    group.add(pier);
  }

  // Modern Green & White Addis LRT Train
  const trainCar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 28), materials.lrtGreen);
  trainCar.position.set(0, 7.8, 0);
  group.add(trainCar);

  const trainRoof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 27.5), materials.minibusWhite);
  trainRoof.position.set(0, 9.3, 0);
  group.add(trainRoof);

  return group;
}
