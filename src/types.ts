export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'STAGE_CLEAR';

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
  kerb: string;
  lane: string;
}

export interface SpriteInstance {
  type: SpriteType;
  offset: number; // -2 to 2 (0 = center of road, -1 = left edge, 1 = right edge)
  speed?: number; // for moving traffic
  zOffset?: number;
  width?: number;
  height?: number;
  collected?: boolean;
  tag?: string; // e.g. passenger name/destination
}

export type SpriteType =
  | 'TRAFFIC_LADA'
  | 'TRAFFIC_BAJAJ'
  | 'TRAFFIC_ISUZU'
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
  | 'CHECKPOINT_GATE';

export interface RoadSegment {
  index: number;
  p1: Point3D;
  p2: Point3D;
  curve: number;
  color: RoadSegmentColor;
  sprites: SpriteInstance[];
  clip: number; // for hill rendering occlusions
}

export interface Player {
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
}
