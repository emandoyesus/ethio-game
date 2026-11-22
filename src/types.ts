export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STAGE_CLEAR' | 'GARAGE';

export type VehicleId = 'MINIBUS' | 'LADA' | 'BAJAJ' | 'ISUZU';

export interface VehicleDef {
  id: VehicleId;
  name: string;
  nameAmharic: string;
  tagline: string;
  unlockPrice: number;
  baseMaxSpeed: number;
  baseAccel: number;
  baseTurnSpeed: number;
  baseMaxFuel: number;
  basePassengerCap: number;
  farePerPassenger: number;
  hitboxWidth: number;
  isPlow?: boolean;
  unlocked: boolean;
  upgrades: {
    engine: number; // 0..3
    steering: number; // 0..3
    fuel: number; // 0..3
    turbo: number; // 0..3
  };
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  w: number;
}

export interface RoadSegmentColor {
  road: string;
  grass: string;
  shoulder: string;
  kerb: string;
  lane: string;
}

export interface RoadSegment {
  index: number;
  p1: Point3D;
  p2: Point3D;
  curve: number;
  color: RoadSegmentColor;
  sprites: SpriteInstance[];
  clip: number;
  hasZebraCrossing?: boolean;
}

export interface SpriteInstance {
  type: SpriteType;
  offset: number; // -2 to 2 (0 = center of road, -1 = left edge, 1 = right edge)
  speed?: number; // for moving traffic
  zOffset?: number;
  width?: number;
  height?: number;
  collected?: boolean;
  tag?: string; // e.g. passenger destination
  alertTimer?: number; // reaction when horn is sounded
  targetOffset?: number; // lane change target when yielding
}

export type SpriteType =
  | 'TRAFFIC_LADA'
  | 'TRAFFIC_BAJAJ'
  | 'TRAFFIC_ISUZU'
  | 'TRAFFIC_POLICE'
  | 'OBSTACLE_POTHOLE'
  | 'OBSTACLE_GOAT'
  | 'OBSTACLE_COW'
  | 'ITEM_BIRR'
  | 'ITEM_BUNNA'
  | 'ITEM_FUEL'
  | 'PASSENGER'
  | 'SCENERY_ACACIA'
  | 'SCENERY_EUCALYPTUS'
  | 'SCENERY_LAMP'
  | 'SCENERY_BILLBOARD'
  | 'SCENERY_TAXI_SIGN'
  | 'SCENERY_POLICE_CONE'
  | 'SCENERY_RADAR_SIGN'
  | 'SCENERY_ZEBRA_PEDESTRIAN'
  | 'CHECKPOINT_GATE';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'smoke' | 'spark' | 'flame' | 'dust' | 'speedline' | 'spray' | 'splash';
}

export interface RainDrop {
  x: number;
  y: number;
  length: number;
  vy: number;
  vx: number;
  alpha: number;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface Player {
  vehicleId: VehicleId;
  x: number; // -1 to 1 across the road
  z: number;
  speed: number;
  maxSpeed: number;
  accel: number;
  decel: number;
  turnSpeed: number;
  boostRemaining: number;
  boostMax: number;
  fuel: number;
  maxFuel: number;
  fareCollected: number;
  passengersOnBoard: number;
  passengersTarget: number;
  health: number;

  // Realistic vehicle dynamics
  gear: number; // 1..5
  rpm: number; // 1000..7500
  pitch: number; // -1 (squat) to 1 (dive)
  roll: number; // -1 to 1 chassis body roll
  bounce: number; // suspension vertical displacement
  bounceVelocity: number;
  steerAngle: number;
  skidding: boolean;
  driftAngle: number;
  isDrifting: boolean;
  turnSignal: 'none' | 'left' | 'right';
  turnSignalTimer: number;

  // Mechanical condition & thermal telemetry
  engineTemp: number; // 80..130 °C
  alignmentBias: number; // steering drift offset from pothole impact (-0.4 to 0.4)
  hazardFlashers: boolean;

  comboCount: number;
  comboTimer: number;
  comboMultiplier: number;
}

export interface RouteStage {
  id: number;
  name: string;
  nameAmharic: string;
  subtitle: string;
  trackLength: number;
  targetPassengers: number;
  timeLimit: number;
  skyTheme: 'day' | 'sunset' | 'night';
  fogColor: string;
  weather: 'clear' | 'sunshower' | 'rain' | 'fog';
  isWetRoad: boolean;
}

export interface CareerContract {
  id: string;
  title: string;
  titleAmharic: string;
  client: string;
  clientAmharic: string;
  description: string;
  targetStageId: number;
  rewardETB: number;
  bonusCondition: string;
  completed: boolean;
}

export interface GameSaveData {
  highScore: number;
  walletBalance: number;
  selectedVehicle: VehicleId;
  vehicles: { [key in VehicleId]?: { unlocked: boolean; upgrades: { engine: number; steering: number; fuel: number; turbo: number } } };
  completedContracts?: string[];
}
