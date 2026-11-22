import type { RoadSegment, RouteStage, SpriteType } from './types';

export const ROAD = {
  SEGMENT_LENGTH: 200,
  RUMBLE_LENGTH: 3,
  LANES: 3,
  ROAD_WIDTH: 2000,
  CAMERA_HEIGHT: 1000,
  CAMERA_DEPTH: 0.84, // FOV factor
  DRAW_DISTANCE: 260
};

export const STAGES: RouteStage[] = [
  {
    id: 1,
    name: 'Megenagna to Piazza',
    nameAmharic: 'መገናኛ ➔ ፒያሳ',
    subtitle: 'Morning Rush & Passenger Picking',
    trackLength: 1600,
    targetPassengers: 8,
    timeLimit: 75,
    skyTheme: 'day'
  },
  {
    id: 2,
    name: 'Bole to Meskel Square',
    nameAmharic: 'ቦሌ ➔ መስቀል አደባባይ',
    subtitle: 'Wide Boulevards & Speed Runs',
    trackLength: 2200,
    targetPassengers: 12,
    timeLimit: 85,
    skyTheme: 'sunset'
  },
  {
    id: 3,
    name: 'Merkato to Entoto Mountain',
    nameAmharic: 'መርካቶ ➔ እንጦጦ ተራራ',
    subtitle: 'Steep Mountain Climb & Wandering Herds',
    trackLength: 2600,
    targetPassengers: 14,
    timeLimit: 95,
    skyTheme: 'night'
  }
];

export class RoadManager {
  public segments: RoadSegment[] = [];
  public trackLength: number = 0;
  public totalSegments: number = 0;

  public buildTrack(stage: RouteStage) {
    this.segments = [];

    // Track building blocks
    const addSegment = (curve: number, y: number) => {
      const n = this.segments.length;
      const isRumble = Math.floor(n / ROAD.RUMBLE_LENGTH) % 2 === 0;

      // Color scheme: Addis asphalt + vibrant Ethiopian kerbs
      const color = {
        road: isRumble ? '#374151' : '#333b47',
        grass: stage.skyTheme === 'night' ? (isRumble ? '#064e3b' : '#022c22') : (isRumble ? '#15803d' : '#166534'),
        kerb: isRumble ? '#dc2626' : '#facc15', // Red & Yellow Ethiopian curbs
        lane: isRumble ? '#f8fafc' : '#374151'
      };

      const prevY = n > 0 ? this.segments[n - 1].p2.y : 0;

      this.segments.push({
        index: n,
        p1: { x: 0, y: prevY, z: n * ROAD.SEGMENT_LENGTH },
        p2: { x: 0, y, z: (n + 1) * ROAD.SEGMENT_LENGTH },
        curve,
        color,
        sprites: [],
        clip: 0
      });
    };

    const addRoad = (enter: number, hold: number, leave: number, curve: number, y: number) => {
      const startY = this.segments.length > 0 ? this.segments[this.segments.length - 1].p2.y : 0;
      const endY = startY + y * ROAD.SEGMENT_LENGTH;
      const total = enter + hold + leave;

      for (let i = 0; i < enter; i++) {
        const ease = this.easeInOut(0, 1, i / enter);
        addSegment(curve * ease, this.easeInOut(startY, endY, i / total));
      }
      for (let i = 0; i < hold; i++) {
        addSegment(curve, this.easeInOut(startY, endY, (enter + i) / total));
      }
      for (let i = 0; i < leave; i++) {
        const ease = this.easeInOut(1, 0, i / leave);
        addSegment(curve * ease, this.easeInOut(startY, endY, (enter + hold + i) / total));
      }
    };

    const addStraight = (num: number = 50) => {
      addRoad(num / 4, num / 2, num / 4, 0, 0);
    };

    const addCurve = (num: number = 50, curve: number = 2, height: number = 0) => {
      addRoad(num / 4, num / 2, num / 4, curve, height);
    };

    const addHill = (num: number = 60, height: number = 30) => {
      addRoad(num / 4, num / 2, num / 4, 0, height);
    };

    // Procedural track construction based on stage
    addStraight(40); // Starting grid

    if (stage.id === 1) {
      // Megenagna -> Piazza
      addStraight(40);
      addCurve(60, 2, 5);
      addStraight(50);
      addHill(60, 20);
      addCurve(70, -2.5, -15);
      addStraight(60);
      addCurve(60, 1.8, 10);
      addHill(70, -25);
      addStraight(70);
      addCurve(80, -3, 0);
      addStraight(60);
    } else if (stage.id === 2) {
      // Bole -> Meskel Square
      addStraight(80);
      addCurve(60, 1.2, 0);
      addStraight(70);
      addCurve(80, -1.8, 10);
      addStraight(90);
      addHill(80, 15);
      addCurve(90, 2.2, -15);
      addStraight(100);
      addCurve(70, -2.5, 0);
      addStraight(80);
    } else {
      // Merkato -> Entoto Mountain (Steep & curvy)
      addHill(60, 35);
      addCurve(70, 3.2, 40);
      addHill(70, 45);
      addCurve(80, -3.8, 30);
      addHill(80, 50);
      addCurve(90, 3.5, 30);
      addHill(90, 40);
      addStraight(50);
    }

    // Finish stretch
    addStraight(60);

    this.totalSegments = this.segments.length;
    this.trackLength = this.totalSegments * ROAD.SEGMENT_LENGTH;

    // Decorate road with roadside scenery, traffic, passengers & collectibles
    this.populateTrack(stage);
  }

  private easeInOut(a: number, b: number, percent: number): number {
    return a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + 0.5);
  }

  private populateTrack(stage: RouteStage) {
    const total = this.totalSegments;

    // 1. Checkpoint gate at finish line
    const finishSeg = this.segments[total - 20];
    if (finishSeg) {
      finishSeg.sprites.push({
        type: 'CHECKPOINT_GATE',
        offset: 0,
        zOffset: 0
      });
    }

    // 2. Roadside Scenery (Acacia, Eucalyptus, Lamps, Billboards)
    for (let i = 10; i < total - 30; i += 4) {
      const seg = this.segments[i];
      // Side scenery alternates
      const isLeft = (i / 4) % 2 === 0;
      const side = isLeft ? -1.8 - Math.random() * 1.2 : 1.8 + Math.random() * 1.2;

      let sceneryType: SpriteType;
      const roll = Math.random();
      if (stage.id === 3) {
        // Entoto has dense eucalyptus & acacia trees
        sceneryType = roll > 0.4 ? 'SCENERY_EUCALYPTUS' : 'SCENERY_ACACIA';
      } else {
        if (roll < 0.4) sceneryType = 'SCENERY_LAMP';
        else if (roll < 0.7) sceneryType = 'SCENERY_ACACIA';
        else if (roll < 0.88) sceneryType = 'SCENERY_EUCALYPTUS';
        else sceneryType = 'SCENERY_BILLBOARD';
      }

      seg.sprites.push({
        type: sceneryType,
        offset: side
      });
    }

    // 3. Passengers waiting on roadside shoulder (right curb: offset 1.25)
    // Target count distributed across track
    const passengerStep = Math.floor((total - 100) / (stage.targetPassengers + 6));
    for (let i = 60; i < total - 50; i += passengerStep) {
      const seg = this.segments[i];
      if (seg) {
        seg.sprites.push({
          type: 'PASSENGER',
          offset: 1.15 + (Math.random() * 0.15),
          collected: false
        });
      }
    }

    // 4. Collectibles (Birr Coins, Bunna Jebena Turbo, Fuel Cans)
    for (let i = 40; i < total - 40; i += 18) {
      const seg = this.segments[i];
      if (!seg) continue;

      const roll = Math.random();
      // Lane choices: -0.6 (left), 0 (mid), 0.6 (right)
      const lane = [-0.6, 0, 0.6][Math.floor(Math.random() * 3)];

      if (roll < 0.45) {
        // Cluster of Birr coins
        for (let c = 0; c < 3; c++) {
          const coinSeg = this.segments[i + c];
          if (coinSeg) {
            coinSeg.sprites.push({
              type: 'ITEM_BIRR',
              offset: lane,
              collected: false
            });
          }
        }
      } else if (roll < 0.75) {
        // Jebena Bunna (Turbo Boost!)
        seg.sprites.push({
          type: 'ITEM_BUNNA',
          offset: lane,
          collected: false
        });
      } else {
        // Fuel can
        seg.sprites.push({
          type: 'ITEM_FUEL',
          offset: lane,
          collected: false
        });
      }
    }

    // 5. Traffic Vehicles (Ladas, Bajajs, Isuzu trucks)
    const trafficCount = stage.id === 1 ? 40 : stage.id === 2 ? 65 : 55;
    for (let t = 0; t < trafficCount; t++) {
      const segIndex = 50 + Math.floor(Math.random() * (total - 120));
      const seg = this.segments[segIndex];
      if (!seg) continue;

      const lane = [-0.65, 0, 0.65][Math.floor(Math.random() * 3)];
      const roll = Math.random();

      let vType: SpriteType;
      let speed: number;

      if (roll < 0.45) {
        vType = 'TRAFFIC_LADA';
        speed = 2200 + Math.random() * 1200; // medium speed
      } else if (roll < 0.75) {
        vType = 'TRAFFIC_BAJAJ';
        speed = 1500 + Math.random() * 900; // slow/agile
      } else {
        vType = 'TRAFFIC_ISUZU';
        speed = 1000 + Math.random() * 800; // slow heavy truck
      }

      seg.sprites.push({
        type: vType,
        offset: lane,
        speed,
        zOffset: 0
      });
    }

    // 6. Hazards: Potholes & Wandering Goats/Cows
    for (let i = 50; i < total - 50; i += 22) {
      const seg = this.segments[i];
      if (!seg) continue;

      const roll = Math.random();
      if (roll < 0.35) {
        // Pothole on road
        const lane = (Math.random() - 0.5) * 1.5;
        seg.sprites.push({
          type: 'OBSTACLE_POTHOLE',
          offset: lane
        });
      } else if (roll < 0.65) {
        // Goat / Sheep near or on road
        const offset = (Math.random() - 0.5) * 1.6;
        seg.sprites.push({
          type: 'OBSTACLE_GOAT',
          offset
        });
      } else if (stage.id === 3 && roll < 0.85) {
        // Cow on mountain road
        const offset = (Math.random() - 0.5) * 1.4;
        seg.sprites.push({
          type: 'OBSTACLE_COW',
          offset
        });
      }
    }
  }

  public findSegment(z: number): RoadSegment {
    return this.segments[Math.floor(z / ROAD.SEGMENT_LENGTH) % this.segments.length];
  }

  public updateTraffic(dt: number) {
    // Move traffic forward along the track
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      for (let j = seg.sprites.length - 1; j >= 0; j--) {
        const sprite = seg.sprites[j];
        if (sprite.speed && sprite.speed > 0) {
          // Calculate movement
          const moveDist = sprite.speed * dt;
          const currentZ = seg.p1.z + (sprite.zOffset || 0);
          const newZ = (currentZ + moveDist) % this.trackLength;
          const newSeg = this.findSegment(newZ);

          if (newSeg.index !== seg.index) {
            // Transfer to new segment
            seg.sprites.splice(j, 1);
            sprite.zOffset = newZ - newSeg.p1.z;
            newSeg.sprites.push(sprite);
          } else {
            sprite.zOffset = (sprite.zOffset || 0) + moveDist;
          }
        }
      }
    }
  }
}
