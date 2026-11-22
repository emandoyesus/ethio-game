import type { RoadSegment, RouteStage, SpriteType } from './types';

export const ROAD = {
  SEGMENT_LENGTH: 200,
  RUMBLE_LENGTH: 3,
  LANES: 3,
  ROAD_WIDTH: 2000,
  CAMERA_HEIGHT: 1000,
  CAMERA_DEPTH: 0.84,
  DRAW_DISTANCE: 280
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
    skyTheme: 'day',
    fogColor: '#7ba6d4'
  },
  {
    id: 2,
    name: 'Bole to Meskel Square',
    nameAmharic: 'ቦሌ ➔ መስቀል አደባባይ',
    subtitle: 'Wide Boulevards & High Speed Runs',
    trackLength: 2200,
    targetPassengers: 12,
    timeLimit: 85,
    skyTheme: 'sunset',
    fogColor: '#8a4066'
  },
  {
    id: 3,
    name: 'Merkato to Entoto Mountain',
    nameAmharic: 'መርካቶ ➔ እንጦጦ ተራራ',
    subtitle: 'Steep Mountain Climb & Wandering Herds',
    trackLength: 2600,
    targetPassengers: 14,
    timeLimit: 95,
    skyTheme: 'night',
    fogColor: '#0b1322'
  }
];

export class RoadManager {
  public segments: RoadSegment[] = [];
  public trackLength: number = 0;
  public totalSegments: number = 0;

  public buildTrack(stage: RouteStage) {
    this.segments = [];

    const addSegment = (curve: number, y: number) => {
      const n = this.segments.length;
      const isRumble = Math.floor(n / ROAD.RUMBLE_LENGTH) % 2 === 0;

      // Realistic asphalt, gravel shoulder, concrete/weathered curb, and grass
      const isNight = stage.skyTheme === 'night';
      const isSunset = stage.skyTheme === 'sunset';

      const color = {
        road: isRumble ? '#2b2e35' : '#25282f', // Realistic worn dark asphalt
        shoulder: isSunset ? '#62412e' : isNight ? '#2a2018' : '#7d593f', // Earthy gravel/red Ethiopian soil shoulder
        grass: isNight
          ? (isRumble ? '#063a24' : '#042b1a')
          : isSunset
          ? (isRumble ? '#2a4c28' : '#1e381c')
          : (isRumble ? '#1f7032' : '#195c29'),
        kerb: isRumble ? '#c22828' : '#d49e15', // Weathered road kerbs
        lane: isRumble ? 'rgba(255, 255, 255, 0.85)' : 'transparent' // Reflective dashed road stripes
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

    addStraight(40);

    if (stage.id === 1) {
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
      addHill(60, 35);
      addCurve(70, 3.2, 40);
      addHill(70, 45);
      addCurve(80, -3.8, 30);
      addHill(80, 50);
      addCurve(90, 3.5, 30);
      addHill(90, 40);
      addStraight(50);
    }

    addStraight(60);

    this.totalSegments = this.segments.length;
    this.trackLength = this.totalSegments * ROAD.SEGMENT_LENGTH;

    this.populateTrack(stage);
  }

  private easeInOut(a: number, b: number, percent: number): number {
    return a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + 0.5);
  }

  private populateTrack(stage: RouteStage) {
    const total = this.totalSegments;

    // Checkpoint gate at finish
    const finishSeg = this.segments[total - 20];
    if (finishSeg) {
      finishSeg.sprites.push({
        type: 'CHECKPOINT_GATE',
        offset: 0,
        zOffset: 0
      });
    }

    // Roadside Scenery (Trees, Lights, Billboards)
    for (let i = 10; i < total - 30; i += 4) {
      const seg = this.segments[i];
      const isLeft = (i / 4) % 2 === 0;
      const side = isLeft ? -1.8 - Math.random() * 1.2 : 1.8 + Math.random() * 1.2;

      let sceneryType: SpriteType;
      const roll = Math.random();
      if (stage.id === 3) {
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

    // Passengers waiting at Taxi Stops on right shoulder
    const passengerDests: SpriteType[] = [
      'PASSENGER',
      'PASSENGER_BOLE' as SpriteType,
      'PASSENGER_MERKATO' as SpriteType,
      'PASSENGER_PIAZZA' as SpriteType,
      'PASSENGER_SARIS' as SpriteType,
      'PASSENGER_KAZANCHIS' as SpriteType
    ];

    const passengerStep = Math.floor((total - 100) / (stage.targetPassengers + 6));
    let destCounter = 0;
    for (let i = 60; i < total - 50; i += passengerStep) {
      const signSeg = this.segments[i - 2];
      if (signSeg) {
        signSeg.sprites.push({
          type: 'SCENERY_TAXI_SIGN',
          offset: 1.35
        });
      }

      const seg = this.segments[i];
      if (seg) {
        const pType = passengerDests[destCounter % passengerDests.length];
        destCounter++;
        seg.sprites.push({
          type: pType,
          offset: 1.15 + (Math.random() * 0.12),
          collected: false
        });
      }
    }

    // Collectibles (Birr Coins, Bunna Jebena, Fuel)
    for (let i = 40; i < total - 40; i += 18) {
      const seg = this.segments[i];
      if (!seg) continue;

      const roll = Math.random();
      const lane = [-0.6, 0, 0.6][Math.floor(Math.random() * 3)];

      if (roll < 0.45) {
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
        seg.sprites.push({
          type: 'ITEM_BUNNA',
          offset: lane,
          collected: false
        });
      } else {
        seg.sprites.push({
          type: 'ITEM_FUEL',
          offset: lane,
          collected: false
        });
      }
    }

    // Traffic Vehicles
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
        speed = 2200 + Math.random() * 1200;
      } else if (roll < 0.75) {
        vType = 'TRAFFIC_BAJAJ';
        speed = 1500 + Math.random() * 900;
      } else {
        vType = 'TRAFFIC_ISUZU';
        speed = 1000 + Math.random() * 800;
      }

      seg.sprites.push({
        type: vType,
        offset: lane,
        targetOffset: lane,
        speed,
        zOffset: 0
      });
    }

    // Hazards: Potholes & Animals
    for (let i = 50; i < total - 50; i += 22) {
      const seg = this.segments[i];
      if (!seg) continue;

      const roll = Math.random();
      if (roll < 0.35) {
        const lane = (Math.random() - 0.5) * 1.5;
        seg.sprites.push({
          type: 'OBSTACLE_POTHOLE',
          offset: lane
        });
      } else if (roll < 0.65) {
        const offset = (Math.random() - 0.5) * 1.5;
        seg.sprites.push({
          type: 'OBSTACLE_GOAT',
          offset,
          targetOffset: offset
        });
      } else if (stage.id === 3 && roll < 0.85) {
        const offset = (Math.random() - 0.5) * 1.3;
        seg.sprites.push({
          type: 'OBSTACLE_COW',
          offset,
          targetOffset: offset
        });
      }
    }
  }

  public findSegment(z: number): RoadSegment {
    return this.segments[Math.floor(z / ROAD.SEGMENT_LENGTH) % this.segments.length];
  }

  public honkHorn(playerZ: number, playerX: number): { scariedCount: number; clearedAnimals: boolean } {
    let scariedCount = 0;
    let clearedAnimals = false;

    const startIdx = Math.floor(playerZ / ROAD.SEGMENT_LENGTH);
    const lookAhead = 14;

    for (let n = 0; n < lookAhead; n++) {
      const seg = this.segments[(startIdx + n) % this.totalSegments];
      if (!seg) continue;

      for (const spr of seg.sprites) {
        if (spr.collected) continue;

        if (spr.type === 'OBSTACLE_GOAT' || spr.type === 'OBSTACLE_COW') {
          spr.targetOffset = spr.offset < 0 ? -1.65 : 1.65;
          clearedAnimals = true;
          scariedCount++;
        } else if (spr.type === 'TRAFFIC_BAJAJ' || spr.type === 'TRAFFIC_LADA') {
          if (Math.abs(spr.offset - playerX) < 0.55) {
            spr.targetOffset = spr.offset < 0 ? 0.65 : -0.65;
            spr.alertTimer = 1.8;
            scariedCount++;
          }
        }
      }
    }

    return { scariedCount, clearedAnimals };
  }

  public updateTraffic(dt: number) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      for (let j = seg.sprites.length - 1; j >= 0; j--) {
        const sprite = seg.sprites[j];

        if (sprite.targetOffset !== undefined && Math.abs(sprite.offset - sprite.targetOffset) > 0.02) {
          const shiftSpeed = (sprite.type === 'OBSTACLE_GOAT' || sprite.type === 'OBSTACLE_COW') ? 3.5 : 1.8;
          sprite.offset += Math.sign(sprite.targetOffset - sprite.offset) * shiftSpeed * dt;
        }

        if (sprite.speed && sprite.speed > 0) {
          const moveDist = sprite.speed * dt;
          const currentZ = seg.p1.z + (sprite.zOffset || 0);
          const newZ = (currentZ + moveDist) % this.trackLength;
          const newSeg = this.findSegment(newZ);

          if (newSeg.index !== seg.index) {
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
