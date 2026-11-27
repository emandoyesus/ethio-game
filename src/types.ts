export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STAGE_CLEAR' | 'GARAGE';

export type RacingLimitsGameMode = 'CAREER' | 'INFINITE' | 'TIME_ATTACK' | 'FREE_RIDE';
export type TrafficFlow = 'ONE_WAY' | 'TWO_WAY';

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

export type TrafficLightState = 'GREEN' | 'YELLOW' | 'RED';

export interface CrossTrafficVehicle {
  id: number;
  type: 'LADA' | 'BAJAJ' | 'ISUZU' | 'MINIBUS';
  crossX: number; // offset across intersection (-30m to +30m)
  laneZ: number; // which lane in cross-street
  speed: number;
  direction: 1 | -1;
  mesh3d?: any;
  previousX?: number;
}

export interface IntersectionZone {
  id: number;
  name: string;
  nameAmharic: string;
  segmentIndex: number;
  zStart: number;
  zStopLine: number;
  zEnd: number;
  lightState: TrafficLightState;
  stateTimer: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  playerStoppedAtRed: boolean;
  playerPassedGreen: boolean;
  playerViolatedRed: boolean;
  gantryModel?: any;
  crossTrafficVehicles: CrossTrafficVehicle[];
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
  kioskX?: number;
  hasStopLine?: boolean;
  hasLaneArrows?: boolean;
  intersectionId?: number;
}

export interface SpriteInstance {
  type: SpriteType;
  offset: number; // -2 to 2 (0 = center of road, -1 = left edge, 1 = right edge)
  speed?: number; // for moving traffic
  zOffset?: number;
  width?: number;
  height?: number;
  collected?: boolean;
  radarChecked?: boolean;
  tag?: string; // e.g. passenger destination
  alertTimer?: number; // reaction when horn is sounded
  targetOffset?: number; // lane change target when yielding
  mesh3d?: any;
  previousOffset?: number;
  cruiseSpeed?: number;
  previousSpeed?: number;
  isOncoming?: boolean;
  oncomingWhooshed?: boolean;
  blinkerState?: 'none' | 'left' | 'right';
  blinkerTimer?: number;
  laneChangeCooldown?: number;
  isYielding?: boolean;
}

export type SpriteType =
  | 'TRAFFIC_LADA'
  | 'TRAFFIC_BAJAJ'
  | 'TRAFFIC_ISUZU'
  | 'TRAFFIC_EV'
  | 'TRAFFIC_BUS'
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
  | 'SCENERY_PALM'
  | 'SCENERY_LAMP'
  | 'SCENERY_BILLBOARD'
  | 'SCENERY_TAXI_SIGN'
  | 'SCENERY_POLICE_CONE'
  | 'SCENERY_RADAR_SIGN'
  | 'SCENERY_ZEBRA_PEDESTRIAN'
  | 'SCENERY_BUILDING_APARTMENT'
  | 'SCENERY_BUILDING_SHOP'
  | 'SCENERY_BUILDING_TOWER'
  | 'SCENERY_BUILDING_HOUSE'
  | 'CHECKPOINT_GATE'
  | 'TRAFFIC_LIGHT_GANTRY'
  | 'INTERSECTION_ARROW_STRAIGHT'
  | 'INTERSECTION_ARROW_LEFT'
  | 'INTERSECTION_ARROW_RIGHT';

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

export type TransmissionGear = 'P' | 'R' | 'N' | 'D';

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
  nitro: number; // 0..100%
  maxNitro: number;
  isNitroActive?: boolean;
  fuel: number;
  maxFuel: number;
  fareCollected: number;
  passengersOnBoard: number;
  passengersTarget: number;
  health: number;

  // Dr. Driving Transmission & Controls
  gearMode: TransmissionGear;
  gasPedal: number; // 0..1 analog throttle
  brakePedal: number; // 0..1 analog braking
  steeringWheelAngle: number; // Radians, continuous rotation

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
