import * as THREE from 'three';
import { sound } from './audio';
import { DrDrivingControls } from './controls';
import { garage } from './garage';
import { createVehicleMeshById, materials, type Vehicle3DModel } from './models3d';
import { Renderer3D, type CameraMode } from './renderer3d';
import { ROAD, RoadManager, STAGES } from './road';
import { sprites } from './sprites';
import { Track3D } from './track3d';
import type { GameState, Particle, Player, ProjectedPoint, RainDrop, RoadSegment, RouteStage, SkidMark, SpriteInstance, TransmissionGear, VehicleId } from './types';
import { ui } from './ui';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private canvas3d: HTMLCanvasElement;
  private canvasHud: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private road: RoadManager;
  public renderer3d: Renderer3D;
  public track3d: Track3D;
  public playerModel: Vehicle3DModel;
  private currentVehicleId: VehicleId;
  public controls: DrDrivingControls;

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
  private screenFlashRed: number = 0;

  // Particle & Skidmark Systems
  private particles: Particle[] = [];
  private skidmarks: SkidMark[] = [];

  // Weather System
  private rainDrops: RainDrop[] = [];
  private lightningFlash: number = 0;
  private thunderTimer: number = 8;

  // Sky parallax offset
  private skyOffset: number = 0;

  // Near miss tracker
  private nearMissCooldown: number = 0;

  constructor(canvas3d: HTMLCanvasElement, canvasHud: HTMLCanvasElement) {
    this.canvas3d = canvas3d;
    this.canvasHud = canvasHud;
    this.canvas = canvasHud;
    this.ctx = canvasHud.getContext('2d')!;
    this.road = new RoadManager();

    this.renderer3d = new Renderer3D(this.canvas3d);
    this.track3d = new Track3D(this.renderer3d.scene);
    this.stage = STAGES[this.currentStageIndex];

    this.player = this.createInitialPlayer();
    this.currentVehicleId = this.player.vehicleId;
    garage.applyToPlayer(this.player);

    this.playerModel = createVehicleMeshById(this.player.vehicleId);
    this.renderer3d.scene.add(this.playerModel.group);

    this.initEventListeners();
    this.controls = new DrDrivingControls(this, this.canvasHud);
    this.resize();
    sprites.init();
    this.road.buildTrack(this.stage);
    this.renderer3d.setupStageEnvironment(this.stage);
    this.track3d.build(this.road, this.stage);

    const initPt = this.track3d.getPointAtZ(0);
    this.playerModel.group.position.copy(initPt.pos);
    this.playerModel.group.position.y += 0.05;
  }

  public updatePlayer3DModel() {
    this.renderer3d.scene.remove(this.playerModel.group);
    this.playerModel = createVehicleMeshById(this.player.vehicleId);
    this.renderer3d.scene.add(this.playerModel.group);
    this.currentVehicleId = this.player.vehicleId;
  }

  public checkVehicleModelUpdate() {
    if (this.currentVehicleId !== this.player.vehicleId) {
      this.updatePlayer3DModel();
    }
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

      // Dr. Driving Transmission & Controls
      gearMode: 'D',
      gasPedal: 0,
      brakePedal: 0,
      steeringWheelAngle: 0,

      gear: 1,
      rpm: 1000,
      pitch: 0,
      roll: 0,
      bounce: 0,
      bounceVelocity: 0,
      steerAngle: 0,
      skidding: false,
      turnSignal: 'none',
      turnSignalTimer: 0,

      engineTemp: 88,
      alignmentBias: 0,
      hazardFlashers: false,

      driftAngle: 0,
      isDrifting: false,
      comboCount: 0,
      comboTimer: 0,
      comboMultiplier: 1
    };
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvasHud.parentElement?.getBoundingClientRect() || { width: 960, height: 600 };
    this.canvasHud.width = rect.width * dpr;
    this.canvasHud.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.canvas3d.width = rect.width * dpr;
    this.canvas3d.height = rect.height * dpr;
    this.renderer3d.resize(this.canvas3d.width, this.canvas3d.height);
    if (this.controls) {
      this.controls.updateLayout(rect.width, rect.height);
    }
  }

  public cycleCameraView(): CameraMode {
    const mode = this.renderer3d.cycleCamera();
    const nameAmh = mode === 'CHASE' ? 'የኋላ ካሜራ (CHASE CAM)' : mode === 'HOOD' ? 'የኮክፒት ካሜራ (HOOD CAM)' : 'የላይ ካሜራ (TOP DOWN)';
    ui.showToast(`🎥 ${nameAmh}`, '🎥', '#38bdf8');
    return mode;
  }

  private initEventListeners() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'c' || e.key === 'C') {
        this.cycleCameraView();
      }

      if (e.key === 'm' || e.key === 'M') {
        sound.toggleMute();
      }

      if (e.key === 'g' || e.key === 'G') {
        if (this.state === 'TITLE' || this.state === 'PAUSED' || this.state === 'GAMEOVER' || this.state === 'STAGE_CLEAR') {
          this.openGarage();
        } else if (this.state === 'GARAGE') {
          this.state = 'TITLE';
        }
      }

      if (this.state === 'GARAGE') {
        const vehicleKeys = Object.keys(garage.vehicles);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.garageVehicleIndex = (this.garageVehicleIndex + 1) % vehicleKeys.length;
          sound.playClick();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.garageVehicleIndex = (this.garageVehicleIndex - 1 + vehicleKeys.length) % vehicleKeys.length;
          sound.playClick();
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
        if (this.state === 'PLAYING') {
          const station = sound.nextRadioStation();
          ui.showToast(`${station.nameAmharic} (${station.genre})`, '📻', '#facc15');
        } else if (this.state === 'PAUSED' || this.state === 'GAMEOVER') {
          this.restartGame();
        }
      }

      if (e.key === 'h' || e.key === 'H' || e.code === 'Space') {
        if (this.state === 'PLAYING') {
          this.triggerHorn();
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        if (this.state === 'PLAYING') {
          this.player.hazardFlashers = !this.player.hazardFlashers;
          sound.playTurnSignalClick();
          ui.showToast(this.player.hazardFlashers ? '🚨 ድንገተኛ መብራት በራ (HAZARDS ON)' : '🚨 HAZARDS OFF', '🚨', '#facc15');
        }
      }

      // Dr. Driving Gear Shifter Keys
      if (e.key === 'q' || e.key === 'Q') {
        if (this.state === 'PLAYING') this.shiftPrevGear();
      }
      if (e.key === 'e' || e.key === 'E') {
        if (this.state === 'PLAYING') this.shiftNextGear();
      }
      if (e.key === '1') this.shiftGear('P');
      if (e.key === '2') this.shiftGear('R');
      if (e.key === '3') this.shiftGear('N');
      if (e.key === '4') this.shiftGear('D');

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

  public toggleHazards() {
    this.player.hazardFlashers = !this.player.hazardFlashers;
    sound.playTurnSignalClick();
    ui.showToast(this.player.hazardFlashers ? '🚨 ድንገተኛ መብራት በራ (HAZARDS ON)' : '🚨 HAZARDS OFF', '🚨', '#facc15');
  }

  public shiftGear(target: TransmissionGear) {
    if (this.player.gearMode === target) return;
    this.player.gearMode = target;
    sound.playTurnSignalClick();
    const amhName =
      target === 'P'
        ? 'ፓርኪንግ (P - PARK)'
        : target === 'R'
        ? 'የኋላ ማርሽ (R - REVERSE)'
        : target === 'N'
        ? 'ሞተረኛ ነፃ (N - NEUTRAL)'
        : 'መንዳት (D - DRIVE)';
    ui.showToast(`⚙️ ማርሽ: ${amhName}`, '⚙️', target === 'R' ? '#ef4444' : target === 'P' ? '#f59e0b' : '#38bdf8');
  }

  public shiftNextGear() {
    const gears: TransmissionGear[] = ['P', 'R', 'N', 'D'];
    const idx = gears.indexOf(this.player.gearMode);
    if (idx < gears.length - 1) {
      this.shiftGear(gears[idx + 1]);
    }
  }

  public shiftPrevGear() {
    const gears: TransmissionGear[] = ['P', 'R', 'N', 'D'];
    const idx = gears.indexOf(this.player.gearMode);
    if (idx > 0) {
      this.shiftGear(gears[idx - 1]);
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
    this.checkVehicleModelUpdate();
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
    this.checkVehicleModelUpdate();
    this.road.buildTrack(this.stage);
    this.renderer3d.setupStageEnvironment(this.stage);
    this.track3d.build(this.road, this.stage);
    this.timeLeft = this.stage.timeLimit;
    this.particles = [];
    this.skidmarks = [];
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
      this.skidmarks = [];
      this.road.buildTrack(this.stage);
      this.renderer3d.setupStageEnvironment(this.stage);
      this.track3d.build(this.road, this.stage);
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
    this.updateSkidmarks(dt);
    this.updateWeather(dt);

    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= dt;
    }

    if (this.screenShake > 0) {
      this.screenShake -= dt * 10;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    if (this.screenFlashRed > 0) {
      this.screenFlashRed -= dt * 2.2;
      if (this.screenFlashRed < 0) this.screenFlashRed = 0;
    }

    if (this.state !== 'PLAYING') {
      sound.stopEngine();
      this.road.updateIntersections(dt);
      this.track3d.updateEntities(this.road, dt, 0);
      const initPt = this.track3d.getPointAtZ(0);
      this.renderer3d.update(initPt.pos, initPt.tangent, initPt.normal, 0, 0, 0, dt);
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

    // 3. User Controls & Analog Pedal Input
    const up = !!(this.keys['arrowup'] || this.keys['w'] || this.controls?.isGasHeld);
    const down = !!(this.keys['arrowdown'] || this.keys['s'] || this.controls?.isBrakeHeld);
    const left = !!(this.keys['arrowleft'] || this.keys['a']);
    const right = !!(this.keys['arrowright'] || this.keys['d']);

    if (up) {
      this.player.gasPedal = Math.min(1.0, this.player.gasPedal + dt * 5.5);
    } else {
      this.player.gasPedal = Math.max(0.0, this.player.gasPedal - dt * 6.5);
    }

    if (down) {
      this.player.brakePedal = Math.min(1.0, this.player.brakePedal + dt * 6.5);
    } else {
      this.player.brakePedal = Math.max(0.0, this.player.brakePedal - dt * 7.5);
    }

    // Dr. Driving PRND Transmission Physics
    if (this.player.gearMode === 'P') {
      this.player.speed = 0;
      this.player.pitch *= 0.85;
      sound.stopTireScreech();
    } else if (this.player.gearMode === 'N') {
      this.player.speed = Math.max(0, this.player.speed - (this.player.accel * 0.45 + this.player.decel * this.player.brakePedal) * dt);
      this.player.pitch *= 0.85;
      sound.stopTireScreech();
    } else if (this.player.gearMode === 'R') {
      const maxReverse = -3600;
      if (this.player.gasPedal > 0.05) {
        this.player.speed = Math.max(maxReverse, this.player.speed - (this.player.accel * 0.72 * this.player.gasPedal) * dt);
        this.player.pitch = Math.max(-0.05, this.player.pitch - dt * 0.3 * this.player.gasPedal);
      } else if (this.player.brakePedal > 0.05) {
        this.player.speed = Math.min(0, this.player.speed + (this.player.decel * this.player.brakePedal) * dt);
        this.player.pitch = Math.min(0.07, this.player.pitch + dt * 0.45 * this.player.brakePedal);
      } else {
        this.player.speed = Math.min(0, this.player.speed + (this.player.accel * 0.45) * dt);
        this.player.pitch *= 0.85;
      }
      sound.stopTireScreech();
    } else {
      // 'D' (Drive Forward)
      if (this.player.gasPedal > 0.05) {
        this.player.speed = Math.min(maxSpeed, this.player.speed + (this.player.accel * this.player.gasPedal) * dt);
        this.player.pitch = Math.max(-0.06, this.player.pitch - dt * 0.4 * this.player.gasPedal);
      } else if (this.player.brakePedal > 0.05) {
        this.player.speed = Math.max(0, this.player.speed - (this.player.decel * this.player.brakePedal) * dt);
        this.player.pitch = Math.min(0.09, this.player.pitch + dt * 0.6 * this.player.brakePedal);
        if (this.player.speed > 2500) {
          this.spawnTireSmoke();
          this.addSkidMark();
          sound.startTireScreech();
        } else {
          sound.stopTireScreech();
        }
      } else {
        this.player.speed = Math.max(0, this.player.speed - (this.player.accel * 0.42) * dt);
        this.player.pitch *= 0.85;
        sound.stopTireScreech();
      }
    }

    // Off-road penalty & Gravel vibration
    const isOffRoad = Math.abs(this.player.x) > 1.0;
    if (isOffRoad && this.player.gearMode === 'D') {
      const offRoadMax = this.player.maxSpeed * 0.45;
      if (this.player.speed > offRoadMax) {
        this.player.speed -= this.player.decel * 1.3 * dt;
      }
      this.screenShake = 1.2;
      this.player.bounceVelocity += (Math.random() - 0.5) * 8;
      this.spawnDust();
    }

    // Dr. Driving Continuous Steering Wheel Dynamics
    if (left) {
      this.player.steeringWheelAngle = Math.max(-Math.PI * 2.2, this.player.steeringWheelAngle - dt * 8.5);
      this.player.turnSignal = 'left';
    } else if (right) {
      this.player.steeringWheelAngle = Math.min(Math.PI * 2.2, this.player.steeringWheelAngle + dt * 8.5);
      this.player.turnSignal = 'right';
    } else if (!this.controls?.isWheelDragging) {
      // Natural caster auto-centering when not actively being dragged or steered
      this.player.steeringWheelAngle *= Math.pow(0.04, dt);
      if (Math.abs(this.player.steeringWheelAngle) < 0.01) this.player.steeringWheelAngle = 0;
      this.player.turnSignal = 'none';
    }

    // Steer angle normalized (-1.0 to 1.0)
    this.player.steerAngle = Math.max(-1.0, Math.min(1.0, this.player.steeringWheelAngle / (Math.PI * 2.0)));

    // Lateral displacement along road
    const speedRatio = Math.abs(this.player.speed) / this.player.maxSpeed;
    const dirSign = this.player.gearMode === 'R' ? -1 : 1;
    this.player.x += (dirSign * this.player.turnSpeed * this.player.steerAngle * speedRatio) * dt;

    // Pothole alignment bias drift (damaged suspension pulls to side)
    if (Math.abs(this.player.alignmentBias) > 0.01) {
      this.player.x += this.player.alignmentBias * speedRatio * 0.45 * dt;
    }

    // Engine thermal physics & radiator steam
    if (isBoosting || this.player.rpm > 5800) {
      this.player.engineTemp = Math.min(128, this.player.engineTemp + dt * 3.6);
      if (this.player.engineTemp > 116 && Math.random() < 0.3) {
        this.spawnRadiatorSteam();
      }
    } else {
      this.player.engineTemp = Math.max(88, this.player.engineTemp - dt * 1.5);
    }

    // Turn signal flasher sound
    if (this.player.turnSignal !== 'none') {
      this.player.turnSignalTimer += dt;
      if (this.player.turnSignalTimer >= 0.35) {
        this.player.turnSignalTimer = 0;
        sound.playTurnSignalClick();
      }
    }

    // Chassis body roll (leaning into / against centrifugal g-force)
    const targetRoll = this.player.steerAngle * speedRatio * 0.14;
    this.player.roll += (targetRoll - this.player.roll) * dt * 8;

    // Suspension spring oscillation (Hooke's law with damping)
    this.player.bounceVelocity += (-38 * this.player.bounce - 7 * this.player.bounceVelocity) * dt;
    this.player.bounce += this.player.bounceVelocity * dt;

    // Centrifugal curve drift
    const currentSegment = this.road.findSegment(this.player.z);
    this.player.x -= (currentSegment.curve * speedRatio * speedRatio * 1.75) * dt;

    // High speed hard drift
    if ((left || right) && speedRatio > 0.72) {
      this.player.isDrifting = true;
      this.spawnTireSmoke();
      this.addSkidMark();
      sound.startTireScreech();
    } else if (!down) {
      this.player.isDrifting = false;
      sound.stopTireScreech();
    }

    // Advance distance
    this.player.z += this.player.speed * dt;
    this.skyOffset += currentSegment.curve * speedRatio * 0.8;

    // Realistic multi-gear calculation
    this.updateRealisticGears(dt);

    if (speedRatio > 0.82) {
      this.spawnSpeedLines();
    }

    // Wet asphalt water spray
    if (this.stage.isWetRoad && this.player.speed > 2200) {
      this.spawnWaterSpray();
    }

    // Update traffic
    this.road.updateTraffic(dt);
    this.road.updateIntersections(dt);
    this.track3d.updateEntities(this.road, dt, this.player.z);

    // Sync 3D player mesh, wheels, headlights, and camera
    const { pos, tangent, normal } = this.track3d.getPointAtZ(this.player.z);
    const player3DPos = pos.clone().addScaledVector(normal, this.player.x * 9.0);
    player3DPos.y += 0.05 + this.player.bounce * 0.03;
    this.playerModel.group.position.copy(player3DPos);

    this.playerModel.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    this.playerModel.group.rotateZ(-this.player.roll - this.player.steerAngle * 0.08);
    this.playerModel.group.rotateX(this.player.pitch);

    for (const w of this.playerModel.wheels) {
      w.rotation.x += dt * (this.player.speed * 0.005);
    }

    if (this.playerModel.wheels.length >= 2) {
      this.playerModel.wheels[0].rotation.y = this.player.steerAngle * 0.45;
      this.playerModel.wheels[1].rotation.y = this.player.steerAngle * 0.45;
    }

    if (this.playerModel.taillights) {
      const isReverse = this.player.gearMode === 'R';
      const isBraking = this.player.brakePedal > 0.08;
      const targetMat = isReverse ? materials.reverseLight : isBraking ? materials.taillightBraking : materials.taillight;
      for (const tl of this.playerModel.taillights) {
        tl.material = targetMat;
      }
    }

    this.renderer3d.update(player3DPos, tangent, normal, speedRatio, this.player.steerAngle, this.player.bounce, dt);

    // 4. Collisions, Pickups & Combos
    this.checkCollisions(currentSegment);
    this.checkIntersectionRules();

    // 5. Stage Finish Check
    if (this.player.z >= this.road.trackLength - 20 * ROAD.SEGMENT_LENGTH) {
      if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
      const finishedContracts = garage.checkContractCompletion(this.stage.id, this.player.passengersOnBoard, this.timeLeft);
      finishedContracts.forEach(c => {
        ui.showToast(`🎉 ${c.titleAmharic} (+${c.rewardETB} ETB REWARD!)`, '🎉', '#22c55e');
      });
      this.state = 'STAGE_CLEAR';
      sound.stopEngine();
    }
  }

  // Realistic Gear Transmission & RPM Curve (Dr. Driving PRND Engine)
  private updateRealisticGears(dt: number) {
    if (this.player.gearMode === 'P') {
      this.player.gear = 1;
      const targetRpm = 950 + this.player.gasPedal * 4800; // Throttle revving in Park
      this.player.rpm += (targetRpm - this.player.rpm) * dt * 12;
      sound.updateEngineRealistic(this.player.rpm, 1, false);
      return;
    }

    if (this.player.gearMode === 'N') {
      this.player.gear = 1;
      const targetRpm = 950 + this.player.gasPedal * 5800; // Free revving in Neutral
      this.player.rpm += (targetRpm - this.player.rpm) * dt * 14;
      sound.updateEngineRealistic(this.player.rpm, 1, false);
      return;
    }

    if (this.player.gearMode === 'R') {
      this.player.gear = 1;
      const reverseRatio = Math.abs(this.player.speed) / 3600;
      const targetRpm = Math.min(5200, 1050 + reverseRatio * 3200 + this.player.gasPedal * 1200);
      this.player.rpm += (targetRpm - this.player.rpm) * dt * 10;
      sound.updateEngineRealistic(this.player.rpm, 1, false);
      return;
    }

    const kmh = (this.player.speed / this.player.maxSpeed) * 165;
    let targetGear = 1;

    if (kmh < 35) targetGear = 1;
    else if (kmh < 70) targetGear = 2;
    else if (kmh < 105) targetGear = 3;
    else if (kmh < 140) targetGear = 4;
    else targetGear = 5;

    this.player.gear = targetGear;

    // Compute RPM curve within current gear
    const gearRatios = [1, 3.4, 2.1, 1.4, 1.0, 0.75];
    const baseGearSpeed = [0, 0, 35, 70, 105, 140][targetGear];
    const speedInGear = kmh - baseGearSpeed;

    const targetRpm = Math.min(7400, Math.max(900, 1100 + speedInGear * (gearRatios[targetGear] * 80)));
    this.player.rpm += (targetRpm - this.player.rpm) * dt * 10;

    const isBoosting = this.player.boostRemaining > 0;
    sound.updateEngineRealistic(this.player.rpm, this.player.gear, isBoosting);
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
            if (this.player.comboCount >= 3 && Math.random() < 0.6) {
              sound.speakWeyala('PRAISE');
            }
            ui.addFloatingText(`🔥 NEAR MISS! +${comboBonus} ETB`, this.width / 2, this.height / 2 - 50, '#f97316');
          }
        }

        if (zDist < ROAD.SEGMENT_LENGTH * 0.72) {
          const dx = Math.abs(this.player.x - sprite.offset);

          // Traffic Collisions
          if (sprite.type === 'TRAFFIC_LADA' || sprite.type === 'TRAFFIC_BAJAJ' || sprite.type === 'TRAFFIC_ISUZU') {
            if (dx < hitboxW) {
              if (isPlow && sprite.type !== 'TRAFFIC_ISUZU') {
                this.screenShake = 4.0;
                sound.playCrash();
                this.player.bounceVelocity += 14;
                ui.addFloatingText('🚛 ገፍቶ አለፈ! (PLOWED THROUGH!)', this.width / 2, this.height / 2 - 40, '#facc15');
                sprite.offset += sprite.offset < 0 ? -0.8 : 0.8;
                sprite.zOffset = (sprite.zOffset || 0) + 300;
              } else {
                this.player.speed = Math.min(this.player.speed * 0.22, 2200);
                this.player.comboCount = 0;
                this.screenShake = 6.5;
                this.player.bounceVelocity += 22;
                this.spawnSparks(this.width / 2, this.height - 60);
                sound.playCrash();
                ui.addFloatingText('💥 ግጭት! (CRASH!)', this.width / 2, this.height / 2 - 40, '#ef4444');
                sprite.zOffset = (sprite.zOffset || 0) + 450;
              }
            }
          }

          // Pothole Impact (Suspension jolt!)
          else if (sprite.type === 'OBSTACLE_POTHOLE') {
            if (dx < hitboxW * 0.8) {
              sound.playSuspensionThud();
              this.player.bounceVelocity += 18; // Suspension jolt!

              if (isPlow) {
                this.screenShake = 2.0;
                ui.addFloatingText('💪 ጉድጓዱን ረገጠው! (OVER RUN!)', this.width / 2, this.height / 2, '#22c55e');
              } else {
                this.player.speed = Math.max(1000, this.player.speed * 0.58);
                this.player.comboCount = 0;
                this.screenShake = 4.5;
                sound.playPothole();
                // Severe impact causes wheel alignment damage
                this.player.alignmentBias = Math.max(-0.25, Math.min(0.25, this.player.alignmentBias + (Math.random() > 0.5 ? 0.08 : -0.08)));
                if (Math.random() < 0.45) {
                  sound.speakWeyala('POTHOLE_SCARE');
                }
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
              this.player.bounceVelocity += 12;
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
                sound.speakWeyala('BOARDING');
                ui.addFloatingText(`👥 +1 ተሳፋሪ (+${fareGain} ETB, +6.5s)`, this.width / 2, this.height / 2 - 60, '#22c55e');
              } else {
                sound.speakWeyala('SLOW_DOWN');
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

          // Federal Traffic Police Checkpoint Radar Check
          else if (sprite.type === 'TRAFFIC_POLICE') {
            if (!sprite.collected) {
              sprite.collected = true;
              const kmh = (this.player.speed / this.player.maxSpeed) * 165;
              if (kmh > 58) {
                sound.playPoliceSiren();
                this.screenShake = 3.5;
                const fine = Math.min(50, this.player.fareCollected);
                this.player.fareCollected = Math.max(0, this.player.fareCollected - 50);
                ui.addFloatingText(`🚨 የፍጥነት ቅጣት! (-${fine} ETB SPEEDING FINE!)`, this.width / 2, this.height / 2 - 30, '#ef4444');
              } else {
                this.player.fareCollected += 30;
                sound.playCoin();
                ui.addFloatingText('👮‍♂️ ፖሊስ ኬላ አለፉ! (+30 ETB SAFE DRIVING!)', this.width / 2, this.height / 2 - 30, '#22c55e');
              }
            }
          }
        }
      }
    }
  }

  // Dr. Driving Traffic Light Enforcement & Lawful Driver Rewards
  private checkIntersectionRules() {
    const pz = this.player.z;

    for (const inter of this.road.intersections) {
      const stopZ = inter.zStopLine;

      // 1. Approaching Red Light: Detect Lawful Driver Stop (within 1600 track units before line)
      const distToStop = stopZ - pz;
      if (distToStop > 0 && distToStop < 1600) {
        if (inter.lightState === 'RED' && this.player.speed < 250) {
          inter.playerStoppedAtRed = true;
        }
      }

      // 2. Crossing Stop Line check
      if (pz >= stopZ && pz <= inter.zEnd) {
        if (inter.lightState === 'RED' && !inter.playerViolatedRed) {
          // Traffic Infraction: Blew through red light stop line!
          inter.playerViolatedRed = true;
          inter.playerStoppedAtRed = false;
          this.screenFlashRed = 1.0;
          this.screenShake = 4.0;
          sound.playPoliceWhistle();
          sound.speakWeyala('POLICE_RED');
          this.player.comboCount = 0;
          this.player.fareCollected = Math.max(0, this.player.fareCollected - 100);
          ui.showToast('🚨 ቀይ መብራት ጥሰዋል! (-100 ETB RED LIGHT VIOLATION!)', '🚨', '#ef4444');
          ui.addFloatingText('🚨 ቀይ መብራት ጥሰት! -100 ETB', this.width / 2, this.height / 2 - 50, '#ef4444');
        } else if (inter.lightState === 'GREEN' && inter.playerStoppedAtRed && !inter.playerPassedGreen) {
          // Lawful Driver Bonus: Stopped at red and waited for green light!
          inter.playerPassedGreen = true;
          inter.playerStoppedAtRed = false;
          this.player.fareCollected += 75;
          sound.playCoin();
          sound.speakWeyala('LAWFUL');
          ui.showToast('✅ ሕጋዊ አሽከርካሪ! (+75 ETB LAWFUL DRIVER BONUS)', '✅', '#22c55e');
          ui.addFloatingText('✅ ሕጋዊ አሽከርካሪ! +75 ETB', this.width / 2, this.height / 2 - 50, '#22c55e');
        }
      }

      // 3. Autonomous Cross-Traffic Collision Detection in the Junction Box
      if (pz >= inter.zStart && pz <= inter.zEnd) {
        const now = Date.now();
        const playerX_Meters = this.player.x * 9.0;

        for (const cv of inter.crossTrafficVehicles) {
          const cvTrackZ = (inter.zStopLine + ROAD.SEGMENT_LENGTH * 2) + cv.laneZ * (ROAD.SEGMENT_LENGTH / 6.0);
          const dz = Math.abs(pz - cvTrackZ);
          const dx = Math.abs(playerX_Meters - cv.crossX);

          // Check AABB collision inside intersection grid
          if (dz < 190 && dx < 2.5) {
            if (!cv.lastCollisionTime || now - cv.lastCollisionTime > 1500) {
              cv.lastCollisionTime = now;

              // T-Bone Collision Physics & Acoustic Response
              sound.playCrash();
              this.screenShake = 9.5;
              this.player.bounceVelocity += 26;
              this.player.roll = cv.direction * 0.42; // Side-impact rollover tilt
              this.player.speed = Math.max(0, this.player.speed * 0.12 - 400);
              this.player.comboCount = 0;

              // Displace cross vehicle to prevent multi-hit sticking
              cv.crossX += cv.direction * 6.5;

              // Visual FX: sparks & tire smoke
              this.spawnSparks(this.width / 2 + this.player.x * 120, this.height - 70);
              this.spawnTireSmoke();
              sound.speakWeyala('POTHOLE_SCARE');

              const penalty = Math.min(60, this.player.fareCollected);
              this.player.fareCollected = Math.max(0, this.player.fareCollected - 60);

              ui.showToast(`💥 የመስቀለኛ መንገድ ግጭት! (-${penalty} ETB T-BONE IMPACT!)`, '💥', '#ef4444');
              ui.addFloatingText(`💥 T-BONE IMPACT! -${penalty} ETB`, this.width / 2, this.height / 2 - 40, '#ef4444');
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
    const carY = h - 35 + this.player.bounce;

    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: carX + (i === 0 ? -carW * 0.32 : carW * 0.32) + (Math.random() - 0.5) * 8,
        y: carY + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 40,
        vy: -15 - Math.random() * 20,
        size: 8 + Math.random() * 8,
        color: 'rgba(210, 218, 226, 0.65)',
        alpha: 0.7,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        type: 'smoke'
      });
    }
  }

  private addSkidMark() {
    const w = this.width;
    const h = this.height;
    const carW = (w / 900) * 0.85 * 240;
    const carX = w / 2;
    const carY = h - 30;

    [-carW * 0.3, carW * 0.3].forEach(offset => {
      this.skidmarks.push({
        x1: carX + offset - 4,
        y1: carY,
        x2: carX + offset + 4,
        y2: carY + 8,
        alpha: 0.6
      });
    });

    if (this.skidmarks.length > 50) {
      this.skidmarks.shift();
    }
  }

  private updateSkidmarks(dt: number) {
    for (let i = this.skidmarks.length - 1; i >= 0; i--) {
      const sm = this.skidmarks[i];
      sm.y1 += (this.player.speed * 0.04) * dt;
      sm.y2 += (this.player.speed * 0.04) * dt;
      sm.alpha -= dt * 0.5;
      if (sm.alpha <= 0 || sm.y1 > this.height) {
        this.skidmarks.splice(i, 1);
      }
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
    const carY = h - 25 + this.player.bounce;

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
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 140;
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

  private spawnRadiatorSteam() {
    const w = this.width;
    const h = this.height;
    const carX = w / 2;
    const carY = h - 60 + this.player.bounce;

    this.particles.push({
      x: carX + (Math.random() - 0.5) * 40,
      y: carY,
      vx: (Math.random() - 0.5) * 20,
      vy: -40 - Math.random() * 30,
      size: 10 + Math.random() * 8,
      color: 'rgba(255, 255, 255, 0.65)',
      alpha: 0.75,
      life: 0,
      maxLife: 0.45,
      type: 'smoke'
    });
  }

  private spawnWaterSpray() {
    const w = this.width;
    const h = this.height;
    const carW = (w / 900) * 0.85 * 240;
    const carX = w / 2;
    const carY = h - 28 + this.player.bounce;

    [-carW * 0.3, carW * 0.3].forEach(offset => {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: carX + offset + (Math.random() - 0.5) * 8,
          y: carY + 8 + (Math.random() - 0.5) * 4,
          vx: (offset > 0 ? 35 : -35) + (Math.random() - 0.5) * 45,
          vy: -25 - Math.random() * 35,
          size: 7 + Math.random() * 8,
          color: 'rgba(224, 242, 254, 0.45)',
          alpha: 0.6,
          life: 0,
          maxLife: 0.28,
          type: 'spray'
        });
      }
    });
  }

  private updateWeather(dt: number) {
    const weather = this.stage.weather;
    if (this.state === 'PLAYING' && (weather === 'rain' || weather === 'sunshower')) {
      const targetCount = weather === 'rain' ? 220 : 90;
      sound.startRainAudio(weather === 'rain' ? 0.7 : 0.35);

      // Thunder in heavy mountain rain
      if (weather === 'rain') {
        this.thunderTimer -= dt;
        if (this.thunderTimer <= 0) {
          this.thunderTimer = 14 + Math.random() * 18;
          sound.playThunder();
          this.lightningFlash = 0.65;
        }
      }

      while (this.rainDrops.length < targetCount) {
        this.rainDrops.push({
          x: Math.random() * this.width,
          y: -20 - Math.random() * 100,
          length: 14 + Math.random() * 16,
          vy: 680 + Math.random() * 260,
          vx: -120 - Math.random() * 60,
          alpha: 0.35 + Math.random() * 0.4
        });
      }

      for (let i = this.rainDrops.length - 1; i >= 0; i--) {
        const drop = this.rainDrops[i];
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        if (drop.y > this.height) {
          this.rainDrops.splice(i, 1);
        }
      }
    } else {
      sound.stopRainAudio();
      this.rainDrops = [];
    }

    if (this.lightningFlash > 0) {
      this.lightningFlash -= dt * 3.5;
      if (this.lightningFlash < 0) this.lightningFlash = 0;
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += (p.type === 'smoke' || p.type === 'dust' || p.type === 'spray' ? 14 : -3) * dt;
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

    // 1. Render 3D WebGL scene
    this.renderer3d.render();

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

    // 2. Road & Sprites with atmospheric perspective
    this.renderRoad(w, h);

    // 3. Skidmarks
    this.renderSkidmarks();

    // 4. Night Headlights
    if (this.stage.skyTheme === 'night') {
      this.renderHeadlights(w, h);
    }

    // 5. Player Vehicle with realistic pitch, roll & bounce
    this.renderPlayer(w, h);

    // 6. Particles
    this.renderParticles();

    // 7. Dynamic Rain & Weather Overlay
    this.renderRain(w, h);

    this.ctx.restore();

    // Red Light Infraction Screen Flash
    if (this.screenFlashRed > 0) {
      this.ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.55, this.screenFlashRed * 0.5)})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // 7. UI HUD
    const progress = this.player.z / this.road.trackLength;
    if (this.state === 'PLAYING') {
      ui.renderHUD(this.ctx, w, h, this.player, this.stage, this.timeLeft, progress, sound.isMuted, garage.highScore, garage.walletBalance, this.controls?.layout);
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

    // 1. Authentic Highland Atmosphere Gradient
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, horizon);
    if (theme === 'day') {
      skyGrad.addColorStop(0, '#1d4ed8'); // High-altitude Ethiopian deep azure
      skyGrad.addColorStop(0.4, '#3b82f6');
      skyGrad.addColorStop(0.75, '#93c5fd');
      skyGrad.addColorStop(1, '#dbeafe'); // Pale horizon haze
    } else if (theme === 'sunset') {
      skyGrad.addColorStop(0, '#1e1b4b'); // Deep indigo twilight zenith
      skyGrad.addColorStop(0.3, '#701a75'); // Dusky plum
      skyGrad.addColorStop(0.6, '#c2410c'); // African golden hour amber
      skyGrad.addColorStop(0.85, '#f97316'); // Warm orange glow
      skyGrad.addColorStop(1, '#fef08a'); // Radiant horizon gold
    } else {
      skyGrad.addColorStop(0, '#020617'); // Pitch highland night
      skyGrad.addColorStop(0.6, '#0b1329');
      skyGrad.addColorStop(1, '#111827');
    }

    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, horizon);

    // 2. Stars & Celestial Bodies
    if (theme === 'night') {
      // Twinkling stars
      this.ctx.fillStyle = '#ffffff';
      const starShift = (this.skyOffset * 5) % 800;
      for (let s = 0; s < 45; s++) {
        const sx = ((s * 47 - starShift) % w + w) % w;
        const sy = (s * 31) % (horizon - 25);
        const sSize = (s % 3 === 0) ? 2 : 1.2;
        const sAlpha = 0.4 + 0.6 * Math.sin(Date.now() / 400 + s);
        this.ctx.globalAlpha = sAlpha;
        this.ctx.fillRect(sx, sy, sSize, sSize);
      }
      this.ctx.globalAlpha = 1.0;

      // Crescent Moon with soft lunar halo
      const moonX = w * 0.82;
      const moonY = horizon * 0.28;

      const moonGlow = this.ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 45);
      moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      this.ctx.fillStyle = moonGlow;
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, 45, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fef9c3';
      this.ctx.beginPath();
      this.ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#0b1329';
      this.ctx.beginPath();
      this.ctx.arc(moonX + 6, moonY - 3, 13, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Realistic Highland Sun with Atmospheric Flare
      const sunX = w * 0.76;
      const sunY = theme === 'sunset' ? horizon * 0.65 : horizon * 0.38;
      const sunRadius = theme === 'sunset' ? 32 : 24;

      // Outer Corona
      const corona = this.ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 3.8);
      corona.addColorStop(0, theme === 'sunset' ? 'rgba(254, 215, 170, 0.45)' : 'rgba(255, 255, 255, 0.45)');
      corona.addColorStop(0.5, theme === 'sunset' ? 'rgba(249, 115, 22, 0.18)' : 'rgba(254, 240, 138, 0.18)');
      corona.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = corona;
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, sunRadius * 3.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Sun Disc
      this.ctx.fillStyle = theme === 'sunset' ? '#fef08a' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 3. Realistic Drifting Highland Clouds (Cumulus)
    if (theme === 'day' || theme === 'sunset') {
      const cloudShift = ((this.skyOffset * 12 + Date.now() * 0.008) % 1200);
      const cloudColor = theme === 'sunset' ? 'rgba(254, 215, 170, 0.35)' : 'rgba(255, 255, 255, 0.55)';
      const cloudShade = theme === 'sunset' ? 'rgba(194, 65, 12, 0.25)' : 'rgba(186, 230, 253, 0.35)';

      this.ctx.fillStyle = cloudColor;
      for (let c = 0; c < 5; c++) {
        const cx = (((c * 260 - cloudShift) % (w + 300)) + w + 300) % (w + 300) - 150;
        const cy = 20 + (c * 24) % 65;
        const cw = 110 + (c * 20);

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        this.ctx.arc(cx + 25, cy - 8, 28, 0, Math.PI * 2);
        this.ctx.arc(cx + 55, cy - 4, 22, 0, Math.PI * 2);
        this.ctx.arc(cx + 80, cy + 2, 18, 0, Math.PI * 2);
        this.ctx.fill();

        // Cloud base shadow
        this.ctx.fillStyle = cloudShade;
        this.ctx.beginPath();
        this.ctx.roundRect(cx - 10, cy + 8, cw * 0.8, 10, 5);
        this.ctx.fill();
        this.ctx.fillStyle = cloudColor;
      }
    }

    // 4. Distant Mountain Ridge 1 (Entoto Mountain Silhouette with organic rolling peaks)
    const mtnColor1 = theme === 'night' ? '#091424' : theme === 'sunset' ? '#3b1236' : '#2b517e';
    this.ctx.fillStyle = mtnColor1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, horizon);

    const mtnShift1 = (this.skyOffset * 10) % 500;
    for (let x = -500; x < w + 500; x += 120) {
      const peakX = x - mtnShift1;
      const peakH = 35 + ((Math.abs(x) * 17) % 30);
      this.ctx.quadraticCurveTo(peakX + 40, horizon - peakH - 20, peakX + 80, horizon - peakH + 5);
      this.ctx.quadraticCurveTo(peakX + 100, horizon - 15, peakX + 120, horizon);
    }
    this.ctx.lineTo(w, horizon);
    this.ctx.closePath();
    this.ctx.fill();

    // 5. Mid Mountain Ridge 2 (Forested Eucalyptus foothills with tree silhouettes)
    const mtnColor2 = theme === 'night' ? '#060e19' : theme === 'sunset' ? '#250c22' : '#1e3a5f';
    this.ctx.fillStyle = mtnColor2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, horizon);

    const mtnShift2 = (this.skyOffset * 22) % 400;
    for (let x = -400; x < w + 400; x += 90) {
      const hillX = x - mtnShift2;
      const hillH = 22 + ((Math.abs(x) * 13) % 24);
      this.ctx.quadraticCurveTo(hillX + 35, horizon - hillH, hillX + 70, horizon - 8);
      this.ctx.lineTo(hillX + 90, horizon);
    }
    this.ctx.lineTo(w, horizon);
    this.ctx.closePath();
    this.ctx.fill();

    // 6. ADDIS ABABA ICONIC SKYLINE: Commercial Bank of Ethiopia (CBE) Tower, Light Rail, and High-Rises
    const cityColor = theme === 'night' ? '#040913' : theme === 'sunset' ? '#1b0918' : '#142742';
    this.ctx.fillStyle = cityColor;
    const cityShift = (this.skyOffset * 38) % 650;

    for (let x = -650; x < w + 650; x += 110) {
      const cx = x - cityShift;
      const bIndex = Math.floor(x / 110);

      // CBE Headquarters Tower (Iconic 209m skyscraper with tapering curved spire and illuminated crown)
      if (bIndex % 6 === 0) {
        const cbeH = 118;
        const cbeX = cx;
        const cbeY = horizon - cbeH;

        // Curved main tower body
        this.ctx.beginPath();
        this.ctx.moveTo(cbeX + 4, horizon);
        this.ctx.lineTo(cbeX + 6, cbeY + 22);
        this.ctx.lineTo(cbeX + 17, cbeY); // Crown diamond apex
        this.ctx.lineTo(cbeX + 28, cbeY + 22);
        this.ctx.lineTo(cbeX + 30, horizon);
        this.ctx.closePath();
        this.ctx.fill();

        // Distinctive illuminated glass spire & diamond crown
        const crownColor = theme === 'night' || theme === 'sunset' ? '#38bdf8' : '#e0f2fe';
        this.ctx.fillStyle = crownColor;
        this.ctx.beginPath();
        this.ctx.moveTo(cbeX + 17, cbeY + 2);
        this.ctx.lineTo(cbeX + 12, cbeY + 16);
        this.ctx.lineTo(cbeX + 22, cbeY + 16);
        this.ctx.closePath();
        this.ctx.fill();

        // Red aviation beacon light on tower apex
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(cbeX + 17, cbeY - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Windows lighting on CBE tower
        if (theme === 'night' || theme === 'sunset') {
          this.ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
          for (let f = 0; f < 6; f++) {
            this.ctx.fillRect(cbeX + 10, cbeY + 26 + f * 14, 14, 2);
          }
        }

        this.ctx.fillStyle = cityColor;
      }
      // Addis Light Rail Transit Viaduct Pillar & High-Rise
      else if (bIndex % 6 === 3) {
        // High-rise
        const bh = 58 + ((Math.abs(x) % 5) * 10);
        this.ctx.fillRect(cx, horizon - bh, 36, bh);

        // Windows
        if (theme === 'night' || theme === 'sunset') {
          this.ctx.fillStyle = 'rgba(253, 224, 71, 0.65)';
          this.ctx.fillRect(cx + 6, horizon - bh + 8, 4, 4);
          this.ctx.fillRect(cx + 16, horizon - bh + 8, 4, 4);
          this.ctx.fillRect(cx + 26, horizon - bh + 8, 4, 4);
          this.ctx.fillRect(cx + 6, horizon - bh + 22, 4, 4);
          this.ctx.fillRect(cx + 26, horizon - bh + 22, 4, 4);
          this.ctx.fillStyle = cityColor;
        }

        // Elevated Light Rail viaduct beam
        this.ctx.fillRect(cx - 35, horizon - 16, 75, 4);
        this.ctx.fillRect(cx + 12, horizon - 16, 8, 16); // Concrete pillar
      }
      // Standard commercial building with antennas
      else {
        const bh = 34 + ((Math.abs(x) % 7) * 9);
        this.ctx.fillRect(cx, horizon - bh, 38, bh);

        // Communication antenna mast
        if (bIndex % 2 === 0) {
          this.ctx.fillRect(cx + 18, horizon - bh - 16, 2, 16);
          this.ctx.fillStyle = '#ef4444';
          this.ctx.fillRect(cx + 17, horizon - bh - 18, 4, 2);
          this.ctx.fillStyle = cityColor;
        }

        // Night illuminated windows
        if (theme === 'night' || theme === 'sunset') {
          this.ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
          this.ctx.fillRect(cx + 8, horizon - bh + 6, 6, 3);
          this.ctx.fillRect(cx + 22, horizon - bh + 6, 6, 3);
          this.ctx.fillStyle = cityColor;
        }
      }
    }

    // 7. Addis Ababa Light Rail Transit (LRT) Viaduct & Train (ቀላል ባቡር)
    if (this.stage.id === 1 || this.stage.id === 2) {
      const viaductY = horizon - 16;
      this.ctx.fillStyle = theme === 'night' ? '#0f172a' : '#334155';
      this.ctx.fillRect(0, viaductY, w, 4);

      const pierShift = (this.skyOffset * 38) % 120;
      for (let px = -120; px < w + 120; px += 120) {
        this.ctx.fillRect(px - pierShift + 55, viaductY, 10, 16);
      }

      this.ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, viaductY - 14);
      this.ctx.lineTo(w, viaductY - 14);
      this.ctx.stroke();

      const trainCycle = (Date.now() * 0.045 + this.skyOffset * 15) % (w + 350);
      const trainX = trainCycle - 180;
      const trainY = viaductY - 11;
      const trainW = 120;
      const trainH = 11;

      const carW = 36;
      for (let c = 0; c < 3; c++) {
        const cx = trainX + c * 40;
        if (cx + carW < 0 || cx > w) continue;

        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(cx, trainY, carW, trainH);

        this.ctx.fillStyle = '#15803d';
        this.ctx.fillRect(cx, trainY, carW, 2.5);
        this.ctx.fillRect(cx, trainY + trainH - 2.5, carW, 2.5);

        this.ctx.fillStyle = (theme === 'night' || theme === 'sunset') ? '#fef08a' : '#0284c7';
        for (let win = 0; win < 3; win++) {
          this.ctx.fillRect(cx + 4 + win * 10, trainY + 3.5, 7, 4);
        }

        if (c < 2) {
          this.ctx.fillStyle = '#1e293b';
          this.ctx.fillRect(cx + carW, trainY + 2, 4, trainH - 3);
        }
      }

      if (trainX + trainW >= 0 && trainX + trainW <= w) {
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(trainX + trainW, trainY + trainH - 4, 2, 0, Math.PI * 2);
        this.ctx.fill();

        const beamGrad = this.ctx.createLinearGradient(trainX + trainW, trainY + trainH - 4, trainX + trainW + 35, trainY + trainH - 4);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        this.ctx.fillStyle = beamGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(trainX + trainW, trainY + trainH - 6);
        this.ctx.lineTo(trainX + trainW + 35, trainY + trainH - 12);
        this.ctx.lineTo(trainX + trainW + 35, trainY + trainH + 4);
        this.ctx.lineTo(trainX + trainW, trainY + trainH - 2);
        this.ctx.closePath();
        this.ctx.fill();
      }

      const pantoX = trainX + 58;
      if (pantoX >= 0 && pantoX <= w) {
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(pantoX, trainY);
        this.ctx.lineTo(pantoX + 3, trainY - 5);
        this.ctx.lineTo(pantoX - 2, viaductY - 14);
        this.ctx.stroke();
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

      // 1. Grass
      this.ctx.fillStyle = segment.color.grass;
      this.ctx.fillRect(0, p2.y, w, p1.y - p2.y);

      // 2. Earthy Gravel Road Shoulder (Realistic verge)
      this.renderPoly(
        p1.x - p1.w * 1.35, p1.y,
        p1.x - p1.w * 1.15, p1.y,
        p2.x - p2.w * 1.15, p2.y,
        p2.x - p2.w * 1.35, p2.y,
        segment.color.shoulder
      );
      this.renderPoly(
        p1.x + p1.w * 1.15, p1.y,
        p1.x + p1.w * 1.35, p1.y,
        p2.x + p2.w * 1.35, p2.y,
        p2.x + p2.w * 1.15, p2.y,
        segment.color.shoulder
      );

      // 3. Weathered Kerbs
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

      // 4. Road Asphalt Surface
      this.renderPoly(
        p1.x - p1.w, p1.y,
        p1.x + p1.w, p1.y,
        p2.x + p2.w, p2.y,
        p2.x - p2.w, p2.y,
        segment.color.road
      );

      // 5. Realistic Dark Tire Groove Tracks (Rubber wear from traffic)
      const laneW1 = (p1.w * 2) / ROAD.LANES;
      const laneW2 = (p2.w * 2) / ROAD.LANES;
      for (let l = 0; l < ROAD.LANES; l++) {
        const laneMid1 = p1.x - p1.w + laneW1 * (l + 0.5);
        const laneMid2 = p2.x - p2.w + laneW2 * (l + 0.5);

        // Left & right tire tracks within each lane
        [-laneW1 * 0.28, laneW1 * 0.28].forEach(trackOff1 => {
          const trackOff2 = (trackOff1 / laneW1) * laneW2;
          this.renderPoly(
            laneMid1 + trackOff1 - 3, p1.y,
            laneMid1 + trackOff1 + 3, p1.y,
            laneMid2 + trackOff2 + 3, p2.y,
            laneMid2 + trackOff2 - 3, p2.y,
            'rgba(18, 20, 24, 0.45)'
          );
        });
      }

      // Wet road specular sheen (highland rain / sunshower reflection)
      if (this.stage.isWetRoad) {
        this.renderPoly(
          p1.x - p1.w * 0.8, p1.y,
          p1.x + p1.w * 0.8, p1.y,
          p2.x + p2.w * 0.8, p2.y,
          p2.x - p2.w * 0.8, p2.y,
          this.stage.weather === 'sunshower' ? 'rgba(253, 224, 71, 0.08)' : 'rgba(186, 230, 253, 0.07)'
        );
      }

      // 6. Dash Lane Line Stripes (Reflective highway paint)
      if (segment.color.lane && segment.color.lane !== 'transparent') {
        let laneX1 = p1.x - p1.w + laneW1;
        let laneX2 = p2.x - p2.w + laneW2;

        for (let l = 1; l < ROAD.LANES; l++) {
          this.renderPoly(
            laneX1 - 2.5, p1.y,
            laneX1 + 2.5, p1.y,
            laneX2 + 2.5, p2.y,
            laneX2 - 2.5, p2.y,
            segment.color.lane
          );
          laneX1 += laneW1;
          laneX2 += laneW2;
        }
      }

      // Pedestrian Zebra Crosswalk Markings ("የእግረኛ ማቋረጫ")
      if (segment.hasZebraCrossing) {
        const numBars = 12;
        const totalW1 = p1.w * 1.84;
        const totalW2 = p2.w * 1.84;
        const startX1 = p1.x - p1.w * 0.92;
        const startX2 = p2.x - p2.w * 0.92;

        for (let b = 0; b < numBars; b++) {
          const fracL = (b + 0.18) / numBars;
          const fracR = (b + 0.82) / numBars;
          const bx1L = startX1 + totalW1 * fracL;
          const bx1R = startX1 + totalW1 * fracR;
          const bx2L = startX2 + totalW2 * fracL;
          const bx2R = startX2 + totalW2 * fracR;

          this.renderPoly(
            bx1L, p1.y,
            bx1R, p1.y,
            bx2R, p2.y,
            bx2L, p2.y,
            '#f8fafc'
          );
        }
      }

      // 7. Distance Atmospheric Fog Haze
      const fogRatio = Math.min(1, Math.max(0, (n - 60) / (ROAD.DRAW_DISTANCE - 70)));
      if (fogRatio > 0) {
        this.ctx.fillStyle = this.stage.fogColor;
        this.ctx.globalAlpha = fogRatio * 0.85;
        this.ctx.fillRect(0, p2.y, w, p1.y - p2.y + 1);
        this.ctx.globalAlpha = 1.0;
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

    // Render sprites Back-to-Front
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
    const carY = h - 60 + this.player.bounce;

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

  private renderSkidmarks() {
    this.ctx.save();
    for (const sm of this.skidmarks) {
      this.ctx.strokeStyle = `rgba(10, 10, 12, ${sm.alpha})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(sm.x1, sm.y1);
      this.ctx.lineTo(sm.x2, sm.y2);
      this.ctx.stroke();
    }
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

    this.ctx.save();

    // Scale calculation
    const carScale = (w / 900) * 0.85;
    const carW = spr.width * carScale;
    const carH = spr.height * carScale;
    const carX = w / 2;
    const carY = h - 28 + this.player.bounce;

    this.ctx.translate(carX, carY);

    // Realistic Chassis Roll (leaning when steering) & Pitch (dive/squat)
    this.ctx.rotate(this.player.roll);
    this.ctx.scale(1.0, 1.0 + this.player.pitch);

    // Dynamic Brake Light Glow cast onto the road surface behind the vehicle
    if (down && this.player.speed > 50) {
      const brakeGlow = this.ctx.createRadialGradient(0, 8, 10, 0, 16, 90);
      brakeGlow.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      brakeGlow.addColorStop(0.6, 'rgba(220, 38, 38, 0.2)');
      brakeGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
      this.ctx.fillStyle = brakeGlow;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 14, 90, 24, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.drawImage(spr.canvas, -carW / 2, -carH, carW, carH);
    this.ctx.restore();
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

  private renderRain(w: number, h: number) {
    if (this.rainDrops.length === 0 && this.lightningFlash <= 0) return;

    this.ctx.save();

    // Lightning Flash illumination
    if (this.lightningFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.55})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Slanted rain drop streaks
    this.ctx.strokeStyle = this.stage.weather === 'sunshower' ? 'rgba(254, 240, 138, 0.45)' : 'rgba(224, 242, 254, 0.55)';
    this.ctx.lineWidth = 1.25;
    this.ctx.beginPath();
    for (const drop of this.rainDrops) {
      this.ctx.moveTo(drop.x, drop.y);
      this.ctx.lineTo(drop.x + (drop.vx * 0.022), drop.y + drop.length);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }
}
