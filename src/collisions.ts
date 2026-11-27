import type { SpriteType, VehicleId } from './types';

// Half-width and half-length in rendered metres.
export const vehicleFootprints: Record<VehicleId, readonly [number, number]> = {
  MINIBUS: [1.1, 2.5], LADA: [0.95, 2.2], BAJAJ: [0.74, 1.68], ISUZU: [1.25, 3.25]
};

export const spriteFootprints: Partial<Record<SpriteType, readonly [number, number]>> = {
  TRAFFIC_LADA: vehicleFootprints.LADA, TRAFFIC_POLICE: vehicleFootprints.LADA,
  TRAFFIC_BAJAJ: vehicleFootprints.BAJAJ, TRAFFIC_ISUZU: vehicleFootprints.ISUZU,
  TRAFFIC_EV: [1.0, 2.3], TRAFFIC_BUS: [1.3, 4.6],
  SCENERY_ACACIA: [0.36, 0.36], SCENERY_EUCALYPTUS: [0.3, 0.3], SCENERY_PALM: [0.32, 0.32],
  SCENERY_BUILDING_APARTMENT: [4.75, 6], SCENERY_BUILDING_SHOP: [4, 5.25],
  SCENERY_BUILDING_TOWER: [5.6, 6.5], SCENERY_BUILDING_HOUSE: [3.75, 4.5]
};

// Body origins sit behind the Bajaj nose and ahead of the truck cargo box.
export const vehicleCentreZ: Record<VehicleId, number> = { MINIBUS: 0, LADA: 0, BAJAJ: 0.32, ISUZU: -0.45 };

// Sweep the relative centre through the combined footprints. The first entering
// face determines which component of velocity the impact can change.
export function sweepContact(x: number, z: number, dx: number, dz: number, w: number, l: number) {
  if (Math.abs(x) < w && Math.abs(z) < l) {
    const lateral = w - Math.abs(x) < l - Math.abs(z);
    return { time: 0, lateral, sign: Math.sign(lateral ? x : z) || 1 };
  }
  function interval(p: number, d: number, radius: number) {
    if (d === 0) return Math.abs(p) < radius ? [-Infinity, Infinity] : [Infinity, -Infinity];
    const a = (-radius - p) / d;
    const b = (radius - p) / d;
    return [Math.min(a, b), Math.max(a, b)];
  }
  const [enterX, exitX] = interval(x, dx, w);
  const [enterZ, exitZ] = interval(z, dz, l);
  const time = Math.max(enterX, enterZ);
  if (time < 0 || time > 1 || time >= Math.min(exitX, exitZ)) return;
  const lateral = enterX > enterZ;
  return { time, lateral, sign: -Math.sign(lateral ? dx : dz) };
}
