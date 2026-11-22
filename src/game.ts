import { sound } from './audio';
import { ROAD, RoadManager, STAGES } from './road';
import { sprites } from './sprites';
import type { GameState, Player, ProjectedPoint, RoadSegment, RouteStage, SpriteInstance } from './types';
import { ui } from './ui';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private road: RoadManager;

  public state: GameState = 'TITLE';
  public currentStageIndex: number = 0;
  public stage: RouteStage;

  public player: Player;
  private cameraX: number = 0;
  private cameraY: number = 1000;
  private cameraZ: number = 0;

  private timeLeft: number = 75;
  private gameOverReason: string = '';

  private keys: { [key: string]: boolean } = {};
  private lastTime: number = 0;
  private screenShake: number = 0;

  // Sky parallax offset
  private skyOffset: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.road = new RoadManager();

    this.stage = STAGES[this.currentStageIndex];

    this.player = this.createInitialPlayer();

    this.initEventListeners();
    this.resize();
    sprites.init();
    this.road.buildTrack(this.stage);
  }

  private createInitialPlayer(): Player {
    return {
      x: 0,
      z: 0,
      speed: 0,
      maxSpeed: 12000,
      accel: 5200,
      decel: 7500,
      turnSpeed: 2.8,
      boostRemaining: 0,
      boostMax: 5.0,
      fuel: 100,
      maxFuel: 100,
      fareCollected: 0,
      passengersOnBoard: 0,
      passengersTarget: this.stage ? this.stage.targetPassengers : 8,
      health: 100
    };
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: 960, height: 600 };
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  private initEventListeners() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'm' || e.key === 'M') {
        sound.toggleMute();
      }

      if (e.key === 'h' || e.key === 'H' || e.code === 'Space') {
        if (this.state === 'PLAYING') {
          sound.playHorn();
          ui.addFloatingText('📢 ፒፕ ፒፕ! (PEEP!)', this.width / 2, this.height - 120, '#facc15');
        }
      }

      if (e.key === 'Enter' || e.code === 'Space') {
        if (this.state === 'TITLE') {
          this.startGame();
        } else if (this.state === 'GAMEOVER') {
          this.restartGame();
        } else if (this.state === 'STAGE_CLEAR') {
          this.nextStage();
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('click', () => {
      if (this.state === 'TITLE') {
        this.startGame();
      } else if (this.state === 'GAMEOVER') {
        this.restartGame();
      } else if (this.state === 'STAGE_CLEAR') {
        this.nextStage();
      }
    });
  }

  public get width(): number {
    return this.canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
  }

  public get height(): number {
    return this.canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
  }

  public startGame() {
    sound.init();
    sound.startMusic();
    this.state = 'PLAYING';
    this.timeLeft = this.stage.timeLimit;
  }

  public restartGame() {
    this.currentStageIndex = 0;
    this.stage = STAGES[this.currentStageIndex];
    this.player = this.createInitialPlayer();
    this.road.buildTrack(this.stage);
    this.timeLeft = this.stage.timeLimit;
    this.state = 'PLAYING';
    sound.startMusic();
  }

  public nextStage() {
    if (this.currentStageIndex < STAGES.length - 1) {
      this.currentStageIndex++;
      this.stage = STAGES[this.currentStageIndex];
      this.player.z = 0;
      this.player.speed = 0;
      this.player.passengersOnBoard = 0;
      this.player.passengersTarget = this.stage.targetPassengers;
      this.player.fuel = 100;
      this.timeLeft = this.stage.timeLimit;
      this.road.buildTrack(this.stage);
      this.state = 'PLAYING';
    } else {
      // Reached the end of all routes! Loop back with high-score pride
      this.restartGame();
    }
  }

  public start() {
    const loop = (timestamp: number) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private update(dt: number) {
    ui.update(dt);

    if (this.screenShake > 0) {
      this.screenShake -= dt * 10;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    if (this.state !== 'PLAYING') {
      sound.stopEngine();
      return;
    }

    // 1. Time & Fuel countdown
    this.timeLeft -= dt;
    this.player.fuel -= dt * 1.5;

    if (this.timeLeft <= 0) {
      this.state = 'GAMEOVER';
      this.gameOverReason = 'ጊዜው አልቋል! (Shift Time Expired!)';
      sound.playCrash();
      return;
    }

    if (this.player.fuel <= 0) {
      this.state = 'GAMEOVER';
      this.gameOverReason = 'ነዳጅ አልቋል! (Ran Out of Fuel!)';
      sound.playCrash();
      return;
    }

    // 2. Bunna Turbo Boost
    const isBoosting = this.player.boostRemaining > 0;
    if (isBoosting) {
      this.player.boostRemaining -= dt;
      if (this.player.boostRemaining < 0) this.player.boostRemaining = 0;
    }

    const maxSpeed = isBoosting ? this.player.maxSpeed * 1.45 : this.player.maxSpeed;

    // 3. User Controls & Input
    const up = this.keys['arrowup'] || this.keys['w'];
    const down = this.keys['arrowdown'] || this.keys['s'];
    const left = this.keys['arrowleft'] || this.keys['a'];
    const right = this.keys['arrowright'] || this.keys['d'];

    // Acceleration & Braking
    if (up) {
      this.player.speed += this.player.accel * dt;
    } else if (down) {
      this.player.speed -= this.player.decel * dt;
    } else {
      // Natural deceleration / engine braking
      this.player.speed -= (this.player.accel * 0.45) * dt;
    }

    // Off-road penalty
    const isOffRoad = Math.abs(this.player.x) > 1.0;
    if (isOffRoad) {
      const offRoadMax = this.player.maxSpeed * 0.45;
      if (this.player.speed > offRoadMax) {
        this.player.speed -= this.player.decel * 1.2 * dt;
      }
      this.screenShake = 1.2;
    }

    this.player.speed = Math.max(0, Math.min(this.player.speed, maxSpeed));

    // Steering
    const speedRatio = this.player.speed / this.player.maxSpeed;
    if (left) {
      this.player.x -= this.player.turnSpeed * speedRatio * dt;
    }
    if (right) {
      this.player.x += this.player.turnSpeed * speedRatio * dt;
    }

    // Centrifugal force from road curve
    const currentSegment = this.road.findSegment(this.player.z);
    this.player.x -= (currentSegment.curve * speedRatio * speedRatio * 1.8) * dt;

    // Advance player distance
    this.player.z += this.player.speed * dt;
    this.skyOffset += currentSegment.curve * speedRatio * 0.8;

    // Engine Audio update
    sound.updateEngine(speedRatio, isBoosting);

    // Update traffic vehicles along road
    this.road.updateTraffic(dt);

    // 4. Collision Detection & Item Collection
    this.checkCollisions(currentSegment);

    // 5. Stage Finish Check
    if (this.player.z >= this.road.trackLength - 20 * ROAD.SEGMENT_LENGTH) {
      this.state = 'STAGE_CLEAR';
      sound.stopEngine();
    }
  }

  private checkCollisions(playerSegment: RoadSegment) {
    // Check segments around player position
    const checkRange = 3;
    for (let offset = -1; offset <= checkRange; offset++) {
      const segIndex = (playerSegment.index + offset + this.road.totalSegments) % this.road.totalSegments;
      const seg = this.road.segments[segIndex];
      if (!seg) continue;

      for (let i = 0; i < seg.sprites.length; i++) {
        const sprite = seg.sprites[i];
        if (sprite.collected) continue;

        const spriteZ = seg.p1.z + (sprite.zOffset || 0);
        const zDist = Math.abs(spriteZ - this.player.z);

        if (zDist < ROAD.SEGMENT_LENGTH * 0.7) {
          const dx = Math.abs(this.player.x - sprite.offset);

          // Handle Traffic collisions
          if (sprite.type === 'TRAFFIC_LADA' || sprite.type === 'TRAFFIC_BAJAJ' || sprite.type === 'TRAFFIC_ISUZU') {
            if (dx < 0.45) {
              // Crash!
              this.player.speed = Math.min(this.player.speed * 0.2, 2000);
              this.screenShake = 6;
              sound.playCrash();
              ui.addFloatingText('💥 ግጭት! (CRASH!)', this.width / 2, this.height / 2 - 40, '#ef4444');
              // push traffic ahead
              sprite.zOffset = (sprite.zOffset || 0) + 400;
            }
          }

          // Handle Pothole
          else if (sprite.type === 'OBSTACLE_POTHOLE') {
            if (dx < 0.35) {
              this.player.speed = Math.max(1000, this.player.speed * 0.6);
              this.screenShake = 4;
              sound.playPothole();
              ui.addFloatingText('⚠️ ጉድጓድ! (POTHOLE)', this.width / 2, this.height / 2, '#f97316');
              sprite.collected = true;
            }
          }

          // Handle Goat / Sheep / Cow
          else if (sprite.type === 'OBSTACLE_GOAT' || sprite.type === 'OBSTACLE_COW') {
            if (dx < 0.4) {
              this.player.speed = Math.min(this.player.speed * 0.4, 2500);
              this.screenShake = 4;
              sound.playCrash();
              const animalName = sprite.type === 'OBSTACLE_COW' ? '🐄 ላም! (COW!)' : '🐐 በግ / ፍየል! (GOAT!)';
              ui.addFloatingText(`⚠️ ${animalName}`, this.width / 2, this.height / 2 - 20, '#ef4444');
              sprite.collected = true;
            }
          }

          // Handle Passenger Pickup
          else if (sprite.type === 'PASSENGER') {
            // Pick up if player pulls to the curb (offset > 0.8) and isn't speeding uncontrollably
            if (this.player.x > 0.75 && this.player.x < 1.45) {
              if (this.player.speed <= 8500) {
                sprite.collected = true;
                this.player.passengersOnBoard++;
                this.player.fareCollected += 50;
                this.timeLeft += 6;
                sound.playPassengerPickup();
                ui.addFloatingText('👥 +1 ተሳፋሪ (+50 ETB, +6s)', this.width / 2, this.height / 2 - 60, '#22c55e');
              } else {
                ui.addFloatingText('⚠️ ቀስ ይበሉ! (SLOW DOWN TO PICK UP!)', this.width / 2, this.height / 2 - 40, '#facc15');
              }
            }
          }

          // Handle Birr Coin
          else if (sprite.type === 'ITEM_BIRR') {
            if (dx < 0.35) {
              sprite.collected = true;
              this.player.fareCollected += 20;
              sound.playCoin();
              ui.addFloatingText('💵 +20 ETB', this.width / 2, this.height / 2 - 20, '#facc15');
            }
          }

          // Handle Jebena Bunna (Turbo Boost)
          else if (sprite.type === 'ITEM_BUNNA') {
            if (dx < 0.4) {
              sprite.collected = true;
              this.player.boostRemaining = this.player.boostMax;
              sound.playBunnaBoost();
              ui.addFloatingText('☕ ቡና ቱርቦ! (BUNNA NITRO BOOST!)', this.width / 2, this.height / 2 - 60, '#f97316');
            }
          }

          // Handle Fuel Can
          else if (sprite.type === 'ITEM_FUEL') {
            if (dx < 0.4) {
              sprite.collected = true;
              this.player.fuel = Math.min(100, this.player.fuel + 40);
              sound.playCoin();
              ui.addFloatingText('⛽ FUEL REFILLED!', this.width / 2, this.height / 2 - 30, '#10b981');
            }
          }
        }
      }
    }
  }

  // Pseudo-3D Projection
  private project(p: { x: number; y: number; z: number }, cameraX: number, cameraY: number, cameraZ: number): ProjectedPoint {
    const width = this.width;
    const height = this.height;
    const relativeZ = p.z - cameraZ;

    if (relativeZ <= 0) {
      return { x: 0, y: 0, scale: 0, w: 0 };
    }

    const scale = ROAD.CAMERA_DEPTH / relativeZ;
    const projectedX = Math.round((width / 2) + (scale * (p.x - cameraX) * width / 2));
    const projectedY = Math.round((height / 2) - (scale * (p.y - cameraY) * height / 2));
    const projectedW = Math.round(scale * ROAD.ROAD_WIDTH * width / 2);

    return { x: projectedX, y: projectedY, scale, w: projectedW };
  }

  private render() {
    const w = this.width;
    const h = this.height;

    this.ctx.clearRect(0, 0, w, h);

    this.ctx.save();
    // Screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 4;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 4;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Render Sky & Addis Ababa Skyline
    this.renderSky(w, h);

    // 2. Render Road Segments
    this.renderRoad(w, h);

    // 3. Render Player Taxi
    this.renderPlayer(w, h);

    this.ctx.restore();

    // 4. Render HUD / Screens
    const progress = this.player.z / this.road.trackLength;
    if (this.state === 'PLAYING') {
      ui.renderHUD(this.ctx, w, h, this.player, this.stage, this.timeLeft, progress, sound.isMuted);
    } else if (this.state === 'TITLE') {
      ui.renderTitleScreen(this.ctx, w, h);
    } else if (this.state === 'GAMEOVER') {
      ui.renderGameOver(this.ctx, w, h, this.gameOverReason, this.player.fareCollected);
    } else if (this.state === 'STAGE_CLEAR') {
      const isLast = this.currentStageIndex >= STAGES.length - 1;
      ui.renderStageClear(this.ctx, w, h, this.stage, this.player.passengersOnBoard, this.player.fareCollected, isLast);
    }
  }

  private renderSky(w: number, h: number) {
    const theme = this.stage.skyTheme;
    const horizon = h * 0.48;

    // Sky gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, horizon);
    if (theme === 'day') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    } else if (theme === 'sunset') {
      skyGrad.addColorStop(0, '#4c1d95');
      skyGrad.addColorStop(0.4, '#c026d3');
      skyGrad.addColorStop(0.7, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
    } else {
      // Night
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    }

    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, horizon);

    // Sun / Moon
    if (theme === 'day' || theme === 'sunset') {
      this.ctx.fillStyle = theme === 'sunset' ? '#fde047' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(w * 0.75, horizon * 0.45, theme === 'sunset' ? 36 : 24, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Crescent Moon
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(w * 0.8, horizon * 0.35, 18, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Distant Entoto Mountain Ridge (Parallax layer 1)
    const mtnColor = theme === 'night' ? '#091823' : theme === 'sunset' ? '#3b0764' : '#1e3a8a';
    this.ctx.fillStyle = mtnColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, horizon);

    const mtnShift = (this.skyOffset * 15) % 400;
    for (let x = -400; x < w + 400; x += 150) {
      const peakX = x - mtnShift;
      this.ctx.lineTo(peakX, horizon - 55);
      this.ctx.lineTo(peakX + 80, horizon - 15);
    }
    this.ctx.lineTo(w, horizon);
    this.ctx.closePath();
    this.ctx.fill();

    // Addis Ababa Skyline Silhouettes (CBE Tower, high-rises) (Parallax layer 2)
    const cityColor = theme === 'night' ? '#040d14' : theme === 'sunset' ? '#2e1065' : '#172554';
    this.ctx.fillStyle = cityColor;
    const cityShift = (this.skyOffset * 35) % 600;

    for (let x = -600; x < w + 600; x += 90) {
      const cx = x - cityShift;
      // CBE Tower shape (tall slender skyscraper)
      if (Math.floor(x / 90) % 5 === 0) {
        this.ctx.fillRect(cx, horizon - 95, 26, 95);
        this.ctx.beginPath();
        this.ctx.moveTo(cx, horizon - 95);
        this.ctx.lineTo(cx + 13, horizon - 118);
        this.ctx.lineTo(cx + 26, horizon - 95);
        this.ctx.fill();
      } else {
        const bh = 30 + ((Math.abs(x) % 7) * 8);
        this.ctx.fillRect(cx, horizon - bh, 35, bh);
      }
    }
  }

  private renderRoad(w: number, h: number) {
    const baseSegment = this.road.findSegment(this.player.z);
    const basePercent = (this.player.z % ROAD.SEGMENT_LENGTH) / ROAD.SEGMENT_LENGTH;

    const playerSegmentY = baseSegment.p1.y + (baseSegment.p2.y - baseSegment.p1.y) * basePercent;
    this.cameraY = ROAD.CAMERA_HEIGHT + playerSegmentY;
    this.cameraX = this.player.x * ROAD.ROAD_WIDTH;
    this.cameraZ = this.player.z;

    let maxy = h;
    let x = 0;
    let dx = -(baseSegment.curve * basePercent);

    // Collect visible segments & sprites to render back-to-front
    const visibleSprites: { sprite: SpriteInstance; seg: RoadSegment; scale: number; sx: number; sy: number }[] = [];

    // Front-to-back pass for road polygon rendering
    for (let n = 0; n < ROAD.DRAW_DISTANCE; n++) {
      const segmentIndex = (baseSegment.index + n) % this.road.totalSegments;
      const segment = this.road.segments[segmentIndex];
      const looped = segment.index < baseSegment.index;

      const p1Z = segment.p1.z + (looped ? this.road.trackLength : 0);
      const p2Z = segment.p2.z + (looped ? this.road.trackLength : 0);

      // Curve accumulation
      segment.clip = maxy;

      const p1 = this.project({ x: segment.p1.x - x, y: segment.p1.y, z: p1Z }, this.cameraX, this.cameraY, this.cameraZ);
      const p2 = this.project({ x: segment.p2.x - x - dx, y: segment.p2.y, z: p2Z }, this.cameraX, this.cameraY, this.cameraZ);

      x += dx;
      dx += segment.curve;

      if (p1.y >= maxy || p2.y >= p1.y) continue;

      // Render Grass
      this.ctx.fillStyle = segment.color.grass;
      this.ctx.fillRect(0, p2.y, w, p1.y - p2.y);

      // Render Kerbs (Red & Yellow)
      this.renderPoly(
        p1.x - p1.w * 1.15, p1.y,
        p1.x - p1.w, p1.y,
        p2.x - p2.w, p2.y,
        p2.x - p2.w * 1.15, p2.y,
        segment.color.kerb
      );
      this.renderPoly(
        p1.x + p1.w, p1.y,
        p1.x + p1.w * 1.15, p1.y,
        p2.x + p2.w * 1.15, p2.y,
        p2.x + p2.w, p2.y,
        segment.color.kerb
      );

      // Render Road Asphalt
      this.renderPoly(
        p1.x - p1.w, p1.y,
        p1.x + p1.w, p1.y,
        p2.x + p2.w, p2.y,
        p2.x - p2.w, p2.y,
        segment.color.road
      );

      // Render Lane Line Stripes
      if (segment.color.lane) {
        const laneW1 = (p1.w * 2) / ROAD.LANES;
        const laneW2 = (p2.w * 2) / ROAD.LANES;
        let laneX1 = p1.x - p1.w + laneW1;
        let laneX2 = p2.x - p2.w + laneW2;

        for (let l = 1; l < ROAD.LANES; l++) {
          this.renderPoly(
            laneX1 - 3, p1.y,
            laneX1 + 3, p1.y,
            laneX2 + 3, p2.y,
            laneX2 - 3, p2.y,
            segment.color.lane
          );
          laneX1 += laneW1;
          laneX2 += laneW2;
        }
      }

      maxy = p1.y;

      // Queue sprites on this segment for drawing
      if (segment.sprites.length > 0) {
        for (const sprite of segment.sprites) {
          if (sprite.collected) continue;
          const spriteZ = p1Z + (sprite.zOffset || 0);
          const sprProj = this.project({ x: segment.p1.x - x + sprite.offset * ROAD.ROAD_WIDTH, y: segment.p1.y, z: spriteZ }, this.cameraX, this.cameraY, this.cameraZ);
          visibleSprites.push({
            sprite,
            seg: segment,
            scale: sprProj.scale,
            sx: sprProj.x,
            sy: sprProj.y
          });
        }
      }
    }

    // Render sprites Back-to-Front (lower scale / farther away first)
    visibleSprites.sort((a, b) => a.scale - b.scale);

    for (const item of visibleSprites) {
      if (item.sy > item.seg.clip) {
        // Sprite is below hill crest clip line
        this.renderSprite(item.sprite, item.sx, item.sy, item.scale);
      }
    }
  }

  private renderPoly(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.lineTo(x4, y4);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderSprite(spriteInstance: SpriteInstance, sx: number, sy: number, scale: number) {
    const spriteKey = spriteInstance.type;
    const spr = sprites.get(spriteKey);
    if (!spr) return;

    // Sprite scale multiplier
    const destW = spr.width * scale * (this.width / 2) * 0.003;
    const destH = spr.height * scale * (this.width / 2) * 0.003;

    if (destW < 2 || destH < 2) return;

    const destX = sx - destW * spr.anchorX;
    const destY = sy - destH * spr.anchorY;

    this.ctx.drawImage(spr.canvas, destX, destY, destW, destH);
  }

  private renderPlayer(w: number, h: number) {
    const isBoosting = this.player.boostRemaining > 0;
    const left = this.keys['arrowleft'] || this.keys['a'];
    const right = this.keys['arrowright'] || this.keys['d'];

    const dir = left ? 'LEFT' : right ? 'RIGHT' : 'STRAIGHT';
    const key = `PLAYER_TAXI_${dir}${isBoosting ? '_BOOST' : ''}`;
    const spr = sprites.get(key) || sprites.get('PLAYER_TAXI_STRAIGHT');
    if (!spr) return;

    // Dynamic car bounce based on speed & road rumble
    const bounce = this.player.speed > 500 ? (Math.sin(Date.now() / 45) * (this.player.speed / this.player.maxSpeed) * 3) : 0;

    const carScale = (w / 900) * 0.85;
    const carW = spr.width * carScale;
    const carH = spr.height * carScale;
    const carX = w / 2 - carW / 2;
    const carY = h - carH - 12 + bounce;

    this.ctx.drawImage(spr.canvas, carX, carY, carW, carH);
  }
}
