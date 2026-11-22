import { sound } from './audio';
import { garage } from './garage';
import { ROAD, RoadManager, STAGES } from './road';
import { sprites } from './sprites';
import type { GameState, Particle, Player, ProjectedPoint, RoadSegment, RouteStage, SpriteInstance, VehicleId } from './types';
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

  // Garage active showcase index
  public garageVehicleIndex: number = 0;

  private keys: { [key: string]: boolean } = {};
  private lastTime: number = 0;
  private screenShake: number = 0;

  // Particle System
  private particles: Particle[] = [];

  // Sky parallax offset
  private skyOffset: number = 0;

  // Near miss tracker
  private nearMissCooldown: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.road = new RoadManager();

    this.stage = STAGES[this.currentStageIndex];

    this.player = this.createInitialPlayer();
    garage.applyToPlayer(this.player);

    this.initEventListeners();
    this.resize();
    sprites.init();
    this.road.buildTrack(this.stage);
  }

  private createInitialPlayer(): Player {
    return {
      vehicleId: garage.selectedVehicleId,
      x: 0,
      z: 0,
      speed: 0,
      maxSpeed: 12500,
      accel: 5400,
      decel: 7800,
      turnSpeed: 2.9,
      boostRemaining: 0,
      boostMax: 5.0,
      fuel: 100,
      maxFuel: 100,
      fareCollected: 0,
      passengersOnBoard: 0,
      passengersTarget: this.stage ? this.stage.targetPassengers : 8,
      health: 100,
      driftAngle: 0,
      isDrifting: false,
      comboCount: 0,
      comboTimer: 0,
      comboMultiplier: 1
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

      // Open / Close Garage
      if (e.key === 'g' || e.key === 'G') {
        if (this.state === 'TITLE' || this.state === 'PAUSED' || this.state === 'GAMEOVER' || this.state === 'STAGE_CLEAR') {
          this.openGarage();
        } else if (this.state === 'GARAGE') {
          this.state = 'TITLE';
        }
      }

      // Garage Navigation
      if (this.state === 'GARAGE') {
        const vehicleKeys = Object.keys(garage.vehicles);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.garageVehicleIndex = (this.garageVehicleIndex + 1) % vehicleKeys.length;
          sound.playClick(0);
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.garageVehicleIndex = (this.garageVehicleIndex - 1 + vehicleKeys.length) % vehicleKeys.length;
          sound.playClick(0);
        } else if (e.key === 'Escape') {
          this.state = 'TITLE';
        }
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'PLAYING') {
          this.state = 'PAUSED';
          sound.stopEngine();
        } else if (this.state === 'PAUSED') {
          this.state = 'PLAYING';
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
          this.restartGame();
        }
      }

      if (e.key === 'h' || e.key === 'H' || e.code === 'Space') {
        if (this.state === 'PLAYING') {
          this.triggerHorn();
        }
      }

      if (e.key === 'Enter' || (e.code === 'Space' && this.state !== 'PLAYING')) {
        if (this.state === 'TITLE' || this.state === 'GARAGE') {
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

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.state === 'GARAGE') {
        this.handleGarageClick(clickX, clickY);
      } else if (this.state === 'TITLE') {
        // Check if clicked the Garage button
        const midX = this.width / 2;
        const midY = this.height / 2 - 25;
        if (clickX >= midX + 10 && clickX <= midX + 240 && clickY >= midY + 215 && clickY <= midY + 261) {
          this.openGarage();
        } else {
          this.startGame();
        }
      } else if (this.state === 'GAMEOVER') {
        this.restartGame();
      } else if (this.state === 'STAGE_CLEAR') {
        this.nextStage();
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
      }
    });
  }

  public openGarage() {
    this.state = 'GARAGE';
    const vehicleKeys = Object.keys(garage.vehicles) as VehicleId[];
    const idx = vehicleKeys.indexOf(garage.selectedVehicleId);
    this.garageVehicleIndex = idx >= 0 ? idx : 0;
    sound.init();
    sound.stopEngine();
  }

  private handleGarageClick(clickX: number, clickY: number) {
    const vehicleKeys = Object.keys(garage.vehicles) as VehicleId[];

    for (const hb of ui.garageHitboxes) {
      if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
        if (hb.id.startsWith('tab_')) {
          const vKey = hb.id.replace('tab_', '') as VehicleId;
          const idx = vehicleKeys.indexOf(vKey);
          if (idx >= 0) this.garageVehicleIndex = idx;
          sound.playCoin();
        } else if (hb.id === 'btn_back') {
          this.state = 'TITLE';
        } else if (hb.id === 'btn_drive') {
          this.startGame();
        } else {
          hb.action();
        }
        return;
      }
    }
  }

  public triggerHorn() {
    sound.playHorn();
    const result = this.road.honkHorn(this.player.z, this.player.x);
    if (result.clearedAnimals) {
      sound.playGoatBleat();
      ui.addFloatingText('📢 መንገድ ተለቀቀ! (ROAD CLEARED!)', this.width / 2, this.height - 130, '#22c55e');
    } else {
      ui.addFloatingText('📢 ፒፕ ፒፕ! (PEEP!)', this.width / 2, this.height - 120, '#facc15');
    }
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
    garage.applyToPlayer(this.player);
    this.state = 'PLAYING';
    this.timeLeft = this.stage.timeLimit;
  }

  public restartGame() {
    if (this.player.fareCollected > 0) {
      garage.addEarnings(this.player.fareCollected);
    }
    this.currentStageIndex = 0;
    this.stage = STAGES[this.currentStageIndex];
    this.player = this.createInitialPlayer();
    garage.applyToPlayer(this.player);
    this.road.buildTrack(this.stage);
    this.timeLeft = this.stage.timeLimit;
    this.particles = [];
    this.state = 'PLAYING';
    sound.startMusic();
  }

  public nextStage() {
    if (this.player.fareCollected > 0) {
      garage.addEarnings(this.player.fareCollected);
    }
    if (this.currentStageIndex < STAGES.length - 1) {
      this.currentStageIndex++;
      this.stage = STAGES[this.currentStageIndex];
      this.player.z = 0;
      this.player.speed = 0;
      this.player.passengersOnBoard = 0;
      this.player.passengersTarget = this.stage.targetPassengers;
      this.player.fuel = this.player.maxFuel;
      this.timeLeft = this.stage.timeLimit;
      this.particles = [];
      this.road.buildTrack(this.stage);
      this.state = 'PLAYING';
    } else {
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
    this.updateParticles(dt);

    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= dt;
    }

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
    this.player.fuel -= dt * 1.35;

    // Combo timer decay
    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.comboCount = 0;
      }
    }

    if (this.timeLeft <= 0) {
      if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
      this.state = 'GAMEOVER';
      this.gameOverReason = 'ጊዜው አልቋል! (Shift Time Expired!)';
      sound.playCrash();
      return;
    }

    if (this.player.fuel <= 0) {
      if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
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
      this.spawnBoostFlames();
    }

    const maxSpeed = isBoosting ? this.player.maxSpeed * 1.48 : this.player.maxSpeed;

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
      if (this.player.speed > 2500) {
        this.spawnTireSmoke();
        sound.startTireScreech();
      } else {
        sound.stopTireScreech();
      }
    } else {
      this.player.speed -= (this.player.accel * 0.42) * dt;
      sound.stopTireScreech();
    }

    // Off-road penalty
    const isOffRoad = Math.abs(this.player.x) > 1.0;
    if (isOffRoad) {
      const offRoadMax = this.player.maxSpeed * 0.45;
      if (this.player.speed > offRoadMax) {
        this.player.speed -= this.player.decel * 1.3 * dt;
      }
      this.screenShake = 1.2;
      this.spawnDust();
    }

    this.player.speed = Math.max(0, Math.min(this.player.speed, maxSpeed));

    // Steering & Drifting
    const speedRatio = this.player.speed / this.player.maxSpeed;
    if (left) {
      this.player.x -= this.player.turnSpeed * speedRatio * dt;
    }
    if (right) {
      this.player.x += this.player.turnSpeed * speedRatio * dt;
    }

    if ((left || right) && speedRatio > 0.72) {
      this.player.isDrifting = true;
      this.spawnTireSmoke();
      sound.startTireScreech();
    } else if (!down) {
      this.player.isDrifting = false;
      sound.stopTireScreech();
    }

    // Centrifugal curve drift
    const currentSegment = this.road.findSegment(this.player.z);
    this.player.x -= (currentSegment.curve * speedRatio * speedRatio * 1.75) * dt;

    // Advance distance
    this.player.z += this.player.speed * dt;
    this.skyOffset += currentSegment.curve * speedRatio * 0.8;

    if (speedRatio > 0.82) {
      this.spawnSpeedLines();
    }

    sound.updateEngine(speedRatio, isBoosting);
    this.road.updateTraffic(dt);

    // 4. Collisions, Pickups & Combos
    this.checkCollisions(currentSegment);

    // 5. Stage Finish Check
    if (this.player.z >= this.road.trackLength - 20 * ROAD.SEGMENT_LENGTH) {
      if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
      this.state = 'STAGE_CLEAR';
      sound.stopEngine();
    }
  }

  private checkCollisions(playerSegment: RoadSegment) {
    const isPlow = !!garage.selectedVehicle.isPlow;
    const hitboxW = garage.selectedVehicle.hitboxWidth;
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

        // Near-Miss Combo check with traffic
        if (sprite.type === 'TRAFFIC_LADA' || sprite.type === 'TRAFFIC_BAJAJ' || sprite.type === 'TRAFFIC_ISUZU') {
          const dx = Math.abs(this.player.x - sprite.offset);
          if (zDist < ROAD.SEGMENT_LENGTH * 0.8 && dx > hitboxW * 0.8 && dx < hitboxW * 1.6 && this.player.speed > 5400 && this.nearMissCooldown <= 0) {
            this.nearMissCooldown = 0.6;
            this.player.comboCount++;
            this.player.comboTimer = 4.2;

            const multiplier = this.player.vehicleId === 'BAJAJ' ? 1.5 : 1.0;
            const comboBonus = Math.round(15 * this.player.comboCount * multiplier);
            this.player.fareCollected += comboBonus;
            sound.playNearMiss();
            ui.addFloatingText(`🔥 NEAR MISS! +${comboBonus} ETB`, this.width / 2, this.height / 2 - 50, '#f97316');
          }
        }

        if (zDist < ROAD.SEGMENT_LENGTH * 0.72) {
          const dx = Math.abs(this.player.x - sprite.offset);

          // Traffic Collisions
          if (sprite.type === 'TRAFFIC_LADA' || sprite.type === 'TRAFFIC_BAJAJ' || sprite.type === 'TRAFFIC_ISUZU') {
            if (dx < hitboxW) {
              if (isPlow && sprite.type !== 'TRAFFIC_ISUZU') {
                // Isuzu plow shoves aside smaller vehicles!
                this.screenShake = 4.0;
                sound.playCrash();
                ui.addFloatingText('🚛 ገፍቶ አለፈ! (PLOWED THROUGH!)', this.width / 2, this.height / 2 - 40, '#facc15');
                sprite.offset += sprite.offset < 0 ? -0.8 : 0.8;
                sprite.zOffset = (sprite.zOffset || 0) + 300;
              } else {
                this.player.speed = Math.min(this.player.speed * 0.22, 2200);
                this.player.comboCount = 0;
                this.screenShake = 6.5;
                this.spawnSparks(this.width / 2, this.height - 60);
                sound.playCrash();
                ui.addFloatingText('💥 ግጭት! (CRASH!)', this.width / 2, this.height / 2 - 40, '#ef4444');
                sprite.zOffset = (sprite.zOffset || 0) + 450;
              }
            }
          }

          // Pothole
          else if (sprite.type === 'OBSTACLE_POTHOLE') {
            if (dx < hitboxW * 0.8) {
              if (isPlow) {
                // Heavy truck rolls straight through potholes!
                this.screenShake = 2.0;
                ui.addFloatingText('💪 ጉድጓዱን ረገጠው! (OVER RUN!)', this.width / 2, this.height / 2, '#22c55e');
              } else {
                this.player.speed = Math.max(1000, this.player.speed * 0.58);
                this.player.comboCount = 0;
                this.screenShake = 4.5;
                sound.playPothole();
                ui.addFloatingText('⚠️ ጉድጓድ! (POTHOLE)', this.width / 2, this.height / 2, '#f97316');
              }
              sprite.collected = true;
            }
          }

          // Animal collision
          else if (sprite.type === 'OBSTACLE_GOAT' || sprite.type === 'OBSTACLE_COW') {
            if (dx < hitboxW) {
              this.player.speed = Math.min(this.player.speed * 0.38, 2400);
              this.player.comboCount = 0;
              this.screenShake = 4.5;
              sound.playCrash();
              if (sprite.type === 'OBSTACLE_COW') {
                sound.playCowMoo();
                ui.addFloatingText('🐄 ላም! (COW!)', this.width / 2, this.height / 2 - 20, '#ef4444');
              } else {
                sound.playGoatBleat();
                ui.addFloatingText('🐐 በግ / ፍየል! (GOAT!)', this.width / 2, this.height / 2 - 20, '#ef4444');
              }
              sprite.collected = true;
            }
          }

          // Passenger Pickup
          else if (typeof sprite.type === 'string' && sprite.type.startsWith('PASSENGER')) {
            if (this.player.x > 0.68 && this.player.x < 1.48) {
              if (this.player.speed <= 8800) {
                sprite.collected = true;
                this.player.passengersOnBoard++;
                const baseFare = garage.selectedVehicle.farePerPassenger;
                const fareGain = baseFare + this.player.comboCount * 12;
                this.player.fareCollected += fareGain;
                this.timeLeft += 6.5;
                sound.playPassengerPickup();
                ui.addFloatingText(`👥 +1 ተሳፋሪ (+${fareGain} ETB, +6.5s)`, this.width / 2, this.height / 2 - 60, '#22c55e');
              } else {
                ui.addFloatingText('⚠️ ቀስ ይበሉ! (SLOW DOWN TO PICK UP!)', this.width / 2, this.height / 2 - 40, '#facc15');
              }
            }
          }

          // Birr Coin
          else if (sprite.type === 'ITEM_BIRR') {
            if (dx < 0.35) {
              sprite.collected = true;
              this.player.fareCollected += 20;
              sound.playCoin();
              ui.addFloatingText('💵 +20 ETB', this.width / 2, this.height / 2 - 20, '#facc15');
            }
          }

          // Bunna Turbo Boost
          else if (sprite.type === 'ITEM_BUNNA') {
            if (dx < 0.4) {
              sprite.collected = true;
              this.player.boostRemaining = this.player.boostMax;
              sound.playBunnaBoost();
              ui.addFloatingText('☕ ቡና ቱርቦ! (BUNNA NITRO BOOST!)', this.width / 2, this.height / 2 - 60, '#f97316');
            }
          }

          // Fuel Can
          else if (sprite.type === 'ITEM_FUEL') {
            if (dx < 0.4) {
              sprite.collected = true;
              this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + this.player.maxFuel * 0.45);
              sound.playCoin();
              ui.addFloatingText('⛽ FUEL REFILLED!', this.width / 2, this.height / 2 - 30, '#10b981');
            }
          }
        }
      }
    }
  }

  // Particle System
  private spawnTireSmoke() {
    const w = this.width;
    const h = this.height;
    const carW = (w / 900) * 0.85 * 240;
    const carX = w / 2;
    const carY = h - 35;

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: carX + (i === 0 ? -carW * 0.32 : carW * 0.32) + (Math.random() - 0.5) * 8,
        y: carY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 40,
        vy: -15 - Math.random() * 20,
        size: 8 + Math.random() * 8,
        color: 'rgba(200, 210, 220, 0.6)',
        alpha: 0.7,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        type: 'smoke'
      });
    }
  }

  private spawnDust() {
    const w = this.width;
    const h = this.height;
    this.particles.push({
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h - 30,
      vx: (Math.random() - 0.5) * 60,
      vy: -25 - Math.random() * 30,
      size: 10 + Math.random() * 10,
      color: 'rgba(160, 110, 60, 0.55)',
      alpha: 0.6,
      life: 0,
      maxLife: 0.4,
      type: 'dust'
    });
  }

  private spawnBoostFlames() {
    const w = this.width;
    const h = this.height;
    const carW = (w / 900) * 0.85 * 240;
    const carX = w / 2;
    const carY = h - 25;

    [-carW * 0.18, carW * 0.18].forEach(offsetX => {
      this.particles.push({
        x: carX + offsetX,
        y: carY,
        vx: (Math.random() - 0.5) * 20,
        vy: 30 + Math.random() * 40,
        size: 6 + Math.random() * 6,
        color: Math.random() > 0.4 ? '#ff3b00' : '#ffea00',
        alpha: 0.9,
        life: 0,
        maxLife: 0.2,
        type: 'flame'
      });
    });
  }

  private spawnSparks(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2,
        color: '#facc15',
        alpha: 1.0,
        life: 0,
        maxLife: 0.28,
        type: 'spark'
      });
    }
  }

  private spawnSpeedLines() {
    const w = this.width;
    const h = this.height;
    if (Math.random() < 0.4) {
      const side = Math.random() > 0.5 ? 1 : -1;
      this.particles.push({
        x: side === 1 ? w + 20 : -20,
        y: Math.random() * h,
        vx: -side * (300 + Math.random() * 300),
        vy: (Math.random() - 0.5) * 40,
        size: 2 + Math.random() * 2,
        color: 'rgba(255, 255, 255, 0.4)',
        alpha: 0.8,
        life: 0,
        maxLife: 0.15,
        type: 'speedline'
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += (p.type === 'smoke' || p.type === 'dust' ? 14 : -3) * dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.size <= 0) {
        this.particles.splice(i, 1);
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

    if (this.state === 'GARAGE') {
      ui.renderGarageScreen(this.ctx, w, h, this.garageVehicleIndex);
      return;
    }

    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 4;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 4;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Sky & Horizon
    this.renderSky(w, h);

    // 2. Road & Sprites
    this.renderRoad(w, h);

    // 3. Night Headlights
    if (this.stage.skyTheme === 'night') {
      this.renderHeadlights(w, h);
    }

    // 4. Player Vehicle
    this.renderPlayer(w, h);

    // 5. Particles
    this.renderParticles();

    this.ctx.restore();

    // 6. UI HUD & Screens
    const progress = this.player.z / this.road.trackLength;
    if (this.state === 'PLAYING') {
      ui.renderHUD(this.ctx, w, h, this.player, this.stage, this.timeLeft, progress, sound.isMuted, garage.highScore, garage.walletBalance);
    } else if (this.state === 'TITLE') {
      ui.renderTitleScreen(this.ctx, w, h, garage.highScore, garage.walletBalance);
    } else if (this.state === 'PAUSED') {
      ui.renderPauseScreen(this.ctx, w, h);
    } else if (this.state === 'GAMEOVER') {
      ui.renderGameOver(this.ctx, w, h, this.gameOverReason, this.player.fareCollected, garage.highScore);
    } else if (this.state === 'STAGE_CLEAR') {
      const isLast = this.currentStageIndex >= STAGES.length - 1;
      ui.renderStageClear(this.ctx, w, h, this.stage, this.player.passengersOnBoard, this.player.fareCollected, isLast);
    }
  }

  private renderSky(w: number, h: number) {
    const theme = this.stage.skyTheme;
    const horizon = h * 0.48;

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
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    }

    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, horizon);

    if (theme === 'day' || theme === 'sunset') {
      this.ctx.fillStyle = theme === 'sunset' ? '#fde047' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(w * 0.75, horizon * 0.45, theme === 'sunset' ? 36 : 24, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.fillStyle = '#fef08a';
      this.ctx.beginPath();
      this.ctx.arc(w * 0.8, horizon * 0.35, 18, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Mountain Layer 1
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

    // Skyline Layer 2
    const cityColor = theme === 'night' ? '#040d14' : theme === 'sunset' ? '#2e1065' : '#172554';
    this.ctx.fillStyle = cityColor;
    const cityShift = (this.skyOffset * 35) % 600;

    for (let x = -600; x < w + 600; x += 90) {
      const cx = x - cityShift;
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

    const visibleSprites: { sprite: SpriteInstance; seg: RoadSegment; scale: number; sx: number; sy: number }[] = [];

    for (let n = 0; n < ROAD.DRAW_DISTANCE; n++) {
      const segmentIndex = (baseSegment.index + n) % this.road.totalSegments;
      const segment = this.road.segments[segmentIndex];
      const looped = segment.index < baseSegment.index;

      const p1Z = segment.p1.z + (looped ? this.road.trackLength : 0);
      const p2Z = segment.p2.z + (looped ? this.road.trackLength : 0);

      segment.clip = maxy;

      const segmentX = segment.p1.x - x;
      const p1 = this.project({ x: segmentX, y: segment.p1.y, z: p1Z }, this.cameraX, this.cameraY, this.cameraZ);
      const p2 = this.project({ x: segment.p1.x - x - dx, y: segment.p2.y, z: p2Z }, this.cameraX, this.cameraY, this.cameraZ);

      x += dx;
      dx += segment.curve;

      if (p1.y >= maxy || p2.y >= p1.y) continue;

      // Grass
      this.ctx.fillStyle = segment.color.grass;
      this.ctx.fillRect(0, p2.y, w, p1.y - p2.y);

      // Kerbs
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

      // Road Asphalt
      this.renderPoly(
        p1.x - p1.w, p1.y,
        p1.x + p1.w, p1.y,
        p2.x + p2.w, p2.y,
        p2.x - p2.w, p2.y,
        segment.color.road
      );

      // Lane Lines
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

      if (segment.sprites.length > 0) {
        for (const sprite of segment.sprites) {
          if (sprite.collected) continue;
          const spriteZ = p1Z + (sprite.zOffset || 0);
          const sprProj = this.project(
            { x: segmentX + sprite.offset * ROAD.ROAD_WIDTH, y: segment.p1.y, z: spriteZ },
            this.cameraX,
            this.cameraY,
            this.cameraZ
          );
          if (sprProj.scale > 0) {
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
    }

    visibleSprites.sort((a, b) => a.scale - b.scale);

    for (const item of visibleSprites) {
      this.renderSprite(item.sprite, item.sx, item.sy, item.scale);
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
    const spr = sprites.get(spriteKey) || (typeof spriteKey === 'string' && spriteKey.startsWith('PASSENGER') ? sprites.get('PASSENGER') : undefined);
    if (!spr) return;

    const scaleFactor = spriteKey === 'CHECKPOINT_GATE' ? 4.2 : 2.8;
    const destW = Math.round(spr.width * scale * (this.width / 2) * scaleFactor);
    const destH = Math.round(spr.height * scale * (this.width / 2) * scaleFactor);

    if (destW < 2 || destH < 2) return;

    const destX = Math.round(sx - destW * spr.anchorX);
    const destY = Math.round(sy - destH * spr.anchorY);

    this.ctx.drawImage(spr.canvas, destX, destY, destW, destH);
  }

  private renderHeadlights(w: number, h: number) {
    this.ctx.save();
    const carX = w / 2;
    const carY = h - 60;

    const grad = this.ctx.createLinearGradient(0, h * 0.5, 0, carY);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.0)');
    grad.addColorStop(0.5, 'rgba(254, 240, 138, 0.12)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0.35)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(carX - 50, carY);
    this.ctx.lineTo(carX - 220, h * 0.52);
    this.ctx.lineTo(carX + 220, h * 0.52);
    this.ctx.lineTo(carX + 50, carY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderPlayer(w: number, h: number) {
    const isBoosting = this.player.boostRemaining > 0;
    const down = this.keys['arrowdown'] || this.keys['s'];
    const left = this.keys['arrowleft'] || this.keys['a'];
    const right = this.keys['arrowright'] || this.keys['d'];

    const dir = left ? 'LEFT' : right ? 'RIGHT' : 'STRAIGHT';
    const vId = this.player.vehicleId || 'MINIBUS';
    const key = `PLAYER_${vId}_${dir}${isBoosting ? '_BOOST' : ''}${down ? '_BRAKE' : ''}`;
    const spr = sprites.get(key) || sprites.get(`PLAYER_${vId}_STRAIGHT`) || sprites.get('PLAYER_TAXI_STRAIGHT');
    if (!spr) return;

    const bounce = this.player.speed > 500 ? (Math.sin(Date.now() / 45) * (this.player.speed / this.player.maxSpeed) * 3) : 0;

    const carScale = (w / 900) * 0.85;
    const carW = spr.width * carScale;
    const carH = spr.height * carScale;
    const carX = w / 2 - carW / 2;
    const carY = h - carH - 12 + bounce;

    this.ctx.drawImage(spr.canvas, carX, carY, carW, carH);
  }

  private renderParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;

      if (p.type === 'speedline') {
        this.ctx.fillRect(p.x, p.y, 40, p.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }
}
