import type { IntersectionZone, RoadSegment, RouteStage, SpriteType, TrafficFlow } from './types';

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
    fogColor: '#93c5fd',
    weather: 'clear',
    isWetRoad: false
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
    fogColor: '#f97316',
    weather: 'sunshower',
    isWetRoad: true
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
    fogColor: '#0f172a',
    weather: 'rain',
    isWetRoad: true
  }
];

export class RoadManager {
  public segments: RoadSegment[] = [];
  public trackLength: number = 0;
  public totalSegments: number = 0;
  public intersections: IntersectionZone[] = [];

  public buildTrack(stage: RouteStage, trafficFlow: TrafficFlow = 'ONE_WAY') {
    this.segments = [];
    this.intersections = [];

    const addSegment = (curve: number, y: number) => {
      const n = this.segments.length;
      const isRumble = Math.floor(n / ROAD.RUMBLE_LENGTH) % 2 === 0;

      // Authentic Ethiopian road palettes: Asphalt, volcanic red soil shoulder, weathered concrete curbs
      const isNight = stage.skyTheme === 'night';
      const isSunset = stage.skyTheme === 'sunset';

      const color = {
        // High-grade weathered dark asphalt with subtle grain variations
        road: isRumble ? '#242831' : '#1e2229',
        // Red volcanic clay & gravel shoulder typical of Ethiopian roadsides
        shoulder: isSunset ? '#6b3c22' : isNight ? '#261b14' : '#854d27',
        // Realistic Ethiopian highland savanna & eucalyptus grass
        grass: isNight
          ? (isRumble ? '#0d2818' : '#081c10')
          : isSunset
          ? (isRumble ? '#2d471e' : '#223816')
          : (isRumble ? '#1e5e2e' : '#184d25'),
        // Concrete curb stones with black-and-white or yellow hazard markings
        kerb: isRumble ? '#e2e8f0' : '#1e293b',
        // Reflective highway lane paint with cat's eyes
        lane: isRumble ? 'rgba(255, 255, 255, 0.9)' : 'transparent'
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

    this.populateTrack(stage, trafficFlow);
    this.setupIntersections(stage);
  }

  private easeInOut(a: number, b: number, percent: number): number {
    return a + (b - a) * (-Math.cos(percent * Math.PI) / 2 + 0.5);
  }

  private populateTrack(stage: RouteStage, trafficFlow: TrafficFlow = 'ONE_WAY') {
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

    const intersectionFracs = stage.id === 1
      ? [0.28, 0.68]
      : stage.id === 2
      ? [0.24, 0.55, 0.82]
      : [0.28, 0.65];
    const intersectionSegs = intersectionFracs.map(f => Math.floor(total * f));
    const policeSegIdx = Math.floor(total * 0.52);

    const isNearSpecialZone = (segIdx: number, margin: number): boolean => {
      if (Math.abs(segIdx - policeSegIdx) <= margin) return true;
      return intersectionSegs.some(iseg => Math.abs(segIdx - iseg) <= margin);
    };

    // Roadside Scenery (Trees, Lights, Billboards)
    for (let i = 10; i < total - 30; i += 4) {
      if (isNearSpecialZone(i, 6)) continue;
      const seg = this.segments[i];
      const isLeft = ((i - 10) / 4) % 2 === 0;
      const side = isLeft ? -1.55 - Math.random() * 0.45 : 1.55 + Math.random() * 0.45;

      let sceneryType: SpriteType;
      const roll = Math.random();
      if (stage.id === 3 && i > total * 0.55) {
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

    // Roadside Buildings lining both sides of the road
    const buildingStep = stage.id === 3 ? 8 : 5;
    for (let i = 12; i < total - 32; i += buildingStep) {
      if (isNearSpecialZone(i, 8)) continue;
      // Upper Entoto mountain climb transitions from urban Merkato to mountain forest
      if (stage.id === 3 && i > total * 0.6 && Math.random() < 0.7) continue;

      const seg = this.segments[i];
      if (!seg) continue;

      const sides = [-1, 1];
      for (const dir of sides) {
        // Leave occasional gaps for natural skyline variety
        if (Math.random() < 0.14) continue;
        const offset = dir * (2.55 + Math.random() * 0.75);
        const roll = Math.random();
        let bType: SpriteType;
        if (stage.id === 2) {
          // Bole boulevard: modern towers, apartments, shops
          bType = roll < 0.35
            ? 'SCENERY_BUILDING_TOWER'
            : roll < 0.68
            ? 'SCENERY_BUILDING_APARTMENT'
            : 'SCENERY_BUILDING_SHOP';
        } else if (stage.id === 1) {
          // Megenagna to Piazza: mix of shops, apartments, houses, towers
          bType = roll < 0.35
            ? 'SCENERY_BUILDING_SHOP'
            : roll < 0.65
            ? 'SCENERY_BUILDING_APARTMENT'
            : roll < 0.85
            ? 'SCENERY_BUILDING_HOUSE'
            : 'SCENERY_BUILDING_TOWER';
        } else {
          // Merkato to Entoto: shops and neighborhood houses
          bType = roll < 0.55 ? 'SCENERY_BUILDING_SHOP' : 'SCENERY_BUILDING_HOUSE';
        }

        seg.sprites.push({
          type: bType,
          offset
        });
      }
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

    // Federal Traffic Police Checkpoint ("ትራፊክ ፖሊስ ኬላ")
    if (this.segments[policeSegIdx - 18]) {
      this.segments[policeSegIdx - 18].sprites.push({
        type: 'SCENERY_RADAR_SIGN',
        offset: 1.28
      });
    }
    for (let c = 0; c < 5; c++) {
      const coneSeg = this.segments[policeSegIdx - 10 + c * 2];
      if (coneSeg) {
        coneSeg.sprites.push({
          type: 'SCENERY_POLICE_CONE',
          offset: 0.96 - c * 0.08
        });
      }
    }
    if (this.segments[policeSegIdx]) {
      this.segments[policeSegIdx].sprites.push({
        type: 'TRAFFIC_POLICE',
        offset: 1.25,
        speed: 0
      });
    }

    // Urban Pedestrian Zebra Crossings ("የእግረኛ ማቋረጫ")
    if (stage.id === 1 || stage.id === 2) {
      const zebraLocations = [Math.floor(total * 0.16), Math.floor(total * 0.72)];
      for (const loc of zebraLocations) {
        for (let zi = 0; zi < 3; zi++) {
          const zSeg = this.segments[loc + zi];
          if (zSeg) {
            zSeg.hasZebraCrossing = true;
          }
        }
        if (this.segments[loc]) {
          this.segments[loc].sprites.push({
            type: 'SCENERY_ZEBRA_PEDESTRIAN',
            offset: 1.25
          });
        }
      }
    }

    // Traffic Vehicles (well-spaced so lanes remain navigable)
    const trafficCount = stage.id === 1 ? 18 : stage.id === 2 ? 26 : 20;
    const laneOccupied: Record<number, number[]> = { [-0.65]: [], 0: [], [0.65]: [] };
    const allTrafficSegs: number[] = [];

    for (let t = 0; t < trafficCount; t++) {
      let segIndex = -1;
      let lane = 0;
      let isOncoming = false;

      // Try up to 25 candidate positions to find a well-spaced slot
      for (let attempt = 0; attempt < 25; attempt++) {
        const candSeg = 55 + Math.floor(Math.random() * (total - 125));
        if (isNearSpecialZone(candSeg, 12)) continue;

        let candLane = [-0.65, 0, 0.65][Math.floor(Math.random() * 3)];
        let candOncoming = false;
        if (trafficFlow === 'TWO_WAY') {
          if (Math.random() < 0.4) {
            candLane = -0.65;
            candOncoming = true;
          } else {
            candLane = Math.random() < 0.5 ? 0 : 0.65;
          }
        }

        // Enforce minimum 14 segments between cars in the same lane
        const sameLaneClear = laneOccupied[candLane].every(s => Math.abs(s - candSeg) >= 14);
        if (!sameLaneClear) continue;

        // Prevent all 3 lanes from being blocked in the same 6-segment window
        const nearbyCount = allTrafficSegs.filter(s => Math.abs(s - candSeg) <= 6).length;
        if (nearbyCount >= 2) continue;

        segIndex = candSeg;
        lane = candLane;
        isOncoming = candOncoming;
        break;
      }

      if (segIndex === -1) continue;
      const seg = this.segments[segIndex];
      if (!seg) continue;

      laneOccupied[lane].push(segIndex);
      allTrafficSegs.push(segIndex);

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

      if (isOncoming) {
        // High-speed oncoming traffic hurtling towards player in left lane
        speed = -(2400 + Math.random() * 1400);
      }

      seg.sprites.push({
        type: vType,
        offset: lane,
        targetOffset: lane,
        speed,
        zOffset: 0,
        isOncoming
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
        } else if (spr.type === 'TRAFFIC_BAJAJ' || spr.type === 'TRAFFIC_LADA' || spr.type === 'TRAFFIC_ISUZU') {
          if (!spr.isOncoming && Math.abs(spr.offset - playerX) < 0.65) {
            const yieldRight = spr.offset >= 0;
            spr.targetOffset = yieldRight ? 0.75 : -0.75;
            spr.blinkerState = yieldRight ? 'right' : 'left';
            spr.blinkerTimer = 2.4;
            spr.isYielding = true;
            spr.alertTimer = 2.0;
            scariedCount++;
          }
        }
      }
    }

    return { scariedCount, clearedAnimals };
  }

  public updateTraffic(dt: number) {
    const transfers: { segment: RoadSegment; sprite: RoadSegment['sprites'][number] }[] = [];
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      for (let j = seg.sprites.length - 1; j >= 0; j--) {
        const sprite = seg.sprites[j];

        const isTrafficCar = sprite.type === 'TRAFFIC_LADA' || sprite.type === 'TRAFFIC_BAJAJ' || sprite.type === 'TRAFFIC_ISUZU';

        if (isTrafficCar) {
          sprite.previousOffset = sprite.offset;
          if (sprite.cruiseSpeed !== undefined) {
            const diff = sprite.cruiseSpeed - (sprite.speed ?? 0);
            sprite.speed = (sprite.speed ?? 0) + Math.sign(diff) * Math.min(Math.abs(diff), 360 * dt);
          }
          sprite.previousSpeed = sprite.speed;
        }

        // 1. Autonomous Lane Changing for traffic cars
        if (isTrafficCar && !sprite.isOncoming) {
          if (sprite.laneChangeCooldown === undefined) {
            sprite.laneChangeCooldown = 7 + Math.random() * 12;
          } else {
            sprite.laneChangeCooldown -= dt;
            if (sprite.laneChangeCooldown <= 0 && sprite.targetOffset === undefined) {
              const forwardLanes = [-0.65, 0, 0.65];
              const currentLaneIdx = forwardLanes.reduce((closest, lane, idx) => {
                return Math.abs(lane - sprite.offset) < Math.abs(forwardLanes[closest] - sprite.offset) ? idx : closest;
              }, 0);

              let targetIdx = currentLaneIdx;
              if (currentLaneIdx === 1) {
                targetIdx = Math.random() < 0.5 ? 0 : 2;
              } else if (currentLaneIdx === 0) {
                targetIdx = 1;
              } else {
                targetIdx = 1;
              }

              const newLane = forwardLanes[targetIdx];
              sprite.targetOffset = newLane;
              sprite.blinkerState = newLane < sprite.offset ? 'left' : 'right';
              sprite.blinkerTimer = 2.2;
              sprite.isYielding = false;
              sprite.laneChangeCooldown = 11 + Math.random() * 15;
            }
          }
        }

        // 2. Blinker timer countdown
        if (sprite.blinkerTimer !== undefined && sprite.blinkerTimer > 0) {
          sprite.blinkerTimer -= dt;
          if (sprite.blinkerTimer <= 0) {
            sprite.blinkerState = 'none';
            sprite.isYielding = false;
          }
        }

        // 3. Smooth offset lerping towards targetOffset
        if (sprite.targetOffset !== undefined) {
          const diff = sprite.targetOffset - sprite.offset;
          if (Math.abs(diff) > 0.02) {
            const shiftSpeed = (sprite.type === 'OBSTACLE_GOAT' || sprite.type === 'OBSTACLE_COW') ? 3.5 : sprite.isYielding ? 2.5 : 1.4;
            sprite.offset += Math.sign(diff) * shiftSpeed * dt;
          } else {
            sprite.offset = sprite.targetOffset;
            sprite.targetOffset = undefined;
            if (!sprite.isYielding) {
              sprite.blinkerState = 'none';
            }
          }
        }

        if (sprite.speed && sprite.speed !== 0) {
          const moveDist = sprite.speed * dt;
          const currentZ = seg.p1.z + (sprite.zOffset || 0);
          let newZ = (currentZ + moveDist) % this.trackLength;
          if (newZ < 0) newZ += this.trackLength;
          const newSeg = this.findSegment(newZ);

          if (newSeg.index !== seg.index) {
            seg.sprites.splice(j, 1);
            sprite.zOffset = newZ - newSeg.p1.z;
            transfers.push({ segment: newSeg, sprite });
          } else {
            sprite.zOffset = (sprite.zOffset || 0) + moveDist;
          }
        }
      }
    }
    for (const { segment, sprite } of transfers) segment.sprites.push(sprite);
  }

  private setupIntersections(stage: RouteStage) {
    this.intersections = [];
    const total = this.totalSegments;

    const intersectionDefs = stage.id === 1 ? [
      { name: 'Kazanchis Junction', nameAmharic: 'የካዛንቺስ መስቀለኛ መንገድ', segFrac: 0.28 },
      { name: 'Piazza Entry Crossing', nameAmharic: 'ፒያሳ መግቢያ መብራት', segFrac: 0.68 }
    ] : stage.id === 2 ? [
      { name: 'Bole Printing Junction', nameAmharic: 'ቦሌ ማተሚያ መስቀለኛ', segFrac: 0.24 },
      { name: 'Olympia Junction', nameAmharic: 'ኦሊምፒያ አደባባይ መብራት', segFrac: 0.55 },
      { name: 'Meskel Square Crossing', nameAmharic: 'መስቀል አደባባይ መግቢያ', segFrac: 0.82 }
    ] : [
      { name: 'Abanefso Crossing', nameAmharic: 'አባነፍሶ መገናኛ መብራት', segFrac: 0.28 },
      { name: 'Shiro Meda Junction', nameAmharic: 'ሽሮሜዳ ኬላ መስቀለኛ', segFrac: 0.65 }
    ];

    intersectionDefs.forEach((def, idx) => {
      const centerSeg = Math.floor(total * def.segFrac);
      const stopLineSeg = centerSeg - 1;
      const gantrySeg = centerSeg;

      // 1. Mark Stop Line on asphalt
      const sSeg = this.segments[stopLineSeg];
      if (sSeg) {
        sSeg.hasStopLine = true;
        sSeg.intersectionId = idx;
      }

      // 2. Add Directional Lane Arrows across preceding segments
      for (let a = 3; a <= 5; a++) {
        const aSeg = this.segments[centerSeg - a];
        if (aSeg) {
          aSeg.hasLaneArrows = true;
          aSeg.intersectionId = idx;
        }
      }

      // 3. Mark Zebra Pedestrian crossing at intersection mouth
      for (let z = 0; z <= 2; z++) {
        const zSeg = this.segments[centerSeg + z];
        if (zSeg) {
          zSeg.hasZebraCrossing = true;
          zSeg.intersectionId = idx;
        }
      }

      // 4. Place 3D Traffic Light Gantry sprite
      const gSeg = this.segments[gantrySeg];
      if (gSeg) {
        gSeg.sprites.push({
          type: 'TRAFFIC_LIGHT_GANTRY',
          offset: 0,
          tag: `intersection_${idx}`
        });
      }

      // 5. Register Intersection Zone
      const zStart = (centerSeg - 6) * ROAD.SEGMENT_LENGTH;
      const zStopLine = stopLineSeg * ROAD.SEGMENT_LENGTH;
      const zEnd = (centerSeg + 6) * ROAD.SEGMENT_LENGTH;

      // Initial state: staggered green/red
      const initialLight = idx % 2 === 0 ? 'GREEN' : 'RED';
      const initialTimer = idx % 2 === 0 ? 8.0 : 6.0;

      this.intersections.push({
        id: idx,
        name: def.name,
        nameAmharic: def.nameAmharic,
        segmentIndex: centerSeg,
        zStart,
        zStopLine,
        zEnd,
        lightState: initialLight,
        stateTimer: initialTimer,
        greenDuration: 13.0,
        yellowDuration: 3.0,
        redDuration: 10.0,
        playerStoppedAtRed: false,
        playerPassedGreen: false,
        playerViolatedRed: false,
        crossTrafficVehicles: [
          { id: idx * 10 + 1, type: 'LADA', crossX: -28, laneZ: -1.5, speed: 20, direction: 1 },
          { id: idx * 10 + 2, type: 'BAJAJ', crossX: 28, laneZ: 2.0, speed: 15, direction: -1 },
          { id: idx * 10 + 3, type: 'MINIBUS', crossX: -36, laneZ: 0, speed: 22, direction: 1 }
        ]
      });
    });
  }

  public updateIntersections(dt: number) {
    for (const inter of this.intersections) {
      inter.stateTimer -= dt;
      if (inter.stateTimer <= 0) {
        if (inter.lightState === 'GREEN') {
          inter.lightState = 'YELLOW';
          inter.stateTimer = inter.yellowDuration;
        } else if (inter.lightState === 'YELLOW') {
          inter.lightState = 'RED';
          inter.stateTimer = inter.redDuration;
          inter.playerStoppedAtRed = false;
          inter.playerViolatedRed = false;
        } else {
          inter.lightState = 'GREEN';
          inter.stateTimer = inter.greenDuration;
          inter.playerPassedGreen = false;
        }

        if (inter.gantryModel && inter.gantryModel.setState) {
          inter.gantryModel.setState(inter.lightState);
        }
      }

      // Update cross-traffic vehicles when cross-street is moving (i.e. when player light is RED)
      const crossMoving = inter.lightState === 'RED' || inter.lightState === 'YELLOW';
      for (const cv of inter.crossTrafficVehicles) {
        cv.previousX = cv.crossX;
        if (crossMoving) {
          cv.crossX += cv.direction * cv.speed * dt;
          if (cv.direction === 1 && cv.crossX > 32) cv.crossX = -32;
          if (cv.direction === -1 && cv.crossX < -32) cv.crossX = 32;
          if (Math.abs(cv.crossX - cv.previousX) > 32) cv.previousX = cv.crossX;
        }
      }
    }
  }
}
