import * as THREE from 'three';
import { spriteFootprints, sweepContact, vehicleCentreZ, vehicleFootprints } from './collisions';
import { sound } from './audio';
import { DrDrivingControls, WHEEL_LOCK } from './controls';
import { garage } from './garage';
import { createVehicleMeshById, materials, type Vehicle3DModel } from './models3d';
import { Renderer3D, type CameraMode } from './renderer3d';
import { ROAD, RoadManager, STAGES } from './road';
import { sprites } from './sprites';
import { Track3D } from './track3d';
import type { GameState, Particle, Player, RacingLimitsGameMode, RoadSegment, SpriteInstance, RouteStage, TrafficFlow, TransmissionGear, VehicleId } from './types';
import { ui } from './ui';

// Leave two road segments behind the starting position for reversing.
const START_Z = 2 * ROAD.SEGMENT_LENGTH;

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
  public showOnScreenControls: boolean =
    typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);

  public state: GameState = 'TITLE';
  public gameMode: RacingLimitsGameMode = 'CAREER';
  public trafficFlow: TrafficFlow = 'ONE_WAY';
  public currentStageIndex: number = 0;
  public stage: RouteStage;

  public player: Player;

  private timeLeft: number = 75;
  private gameOverReason: string = '';

  // Garage active showcase index
  public garageVehicleIndex: number = 0;

  private keys: { [key: string]: boolean } = {};
  private lastTime: number = 0;
  private screenShake: number = 0;
  private screenFlashRed: number = 0;

  // Particle System
  private particles: Particle[] = [];

  // Weather System
  private lightningFlash: number = 0;
  private thunderTimer: number = 8;

  // Near miss tracker
  private nearMissCooldown: number = 0;
  private driftDuration: number = 0;
  private driftEarnedETB: number = 0;
  private driftBlend: number = 0;
  private oncomingLaneTimer: number = 0;
  private lastImpact = new WeakMap<object, number>();
  private keyboardReverse = false;
  private lateralVelocity: number = 0;

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

    this.playerModel = createVehicleMeshById(this.player.vehicleId, true);
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
    this.renderer3d.camera.position.set(initPt.pos.x, initPt.pos.y + 3.6, initPt.pos.z - 8.5);
    this.renderer3d.camera.lookAt(initPt.pos.x, initPt.pos.y + 1.4, initPt.pos.z + 18.0);
  }

  public updatePlayer3DModel() {
    this.renderer3d.scene.remove(this.playerModel.group);
    this.playerModel = createVehicleMeshById(this.player.vehicleId, true);
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
      z: START_Z,
      speed: 0,
      maxSpeed: 5400,
      accel: 2400,
      decel: 4200,
      turnSpeed: 2.9,
      boostRemaining: 0,
      boostMax: 5.0,
      nitro: 60,
      maxNitro: 100,
      isNitroActive: false,
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

    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      if (e.key === 'c' || e.key === 'C') {
        this.cycleCameraView();
      }

      if (e.key === 'o' || e.key === 'O') {
        const isPerf = this.renderer3d.togglePerformanceMode();
        ui.showToast(
          isPerf ? '⚡ PERFORMANCE MODE: 60 FPS (Shadows OFF)' : '✨ HIGH QUALITY (Shadows ON)',
          isPerf ? '⚡' : '✨',
          isPerf ? '#22c55e' : '#38bdf8'
        );
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

      if (e.code === 'Space' && this.state === 'PLAYING') {
        e.preventDefault();
      }

      if (e.key === 'h' || e.key === 'H') {
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

    this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      ui.setHover(e.clientX - rect.left, e.clientY - rect.top);
    });
    this.canvas.addEventListener('mouseleave', () => {
      ui.setHover(-1, -1);
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.state === 'GARAGE') {
        this.handleGarageClick(clickX, clickY);
      } else if (this.state === 'TITLE') {
        for (const hb of ui.titleHitboxes) {
          if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
            if (hb.id.startsWith('mode_')) {
              this.gameMode = hb.id.replace('mode_', '') as RacingLimitsGameMode;
              sound.playClick();
            } else if (hb.id.startsWith('flow_')) {
              this.trafficFlow = hb.id.replace('flow_', '') as TrafficFlow;
              sound.playClick();
            } else if (hb.id === 'btn_start') {
              this.startGame();
            } else if (hb.id === 'btn_garage') {
              this.openGarage();
            }
            break;
          }
        }
      } else if (this.state === 'GAMEOVER' || this.state === 'STAGE_CLEAR' || this.state === 'PAUSED') {
        for (const hb of ui.overlayHitboxes) {
          if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
            sound.playClick();
            if (hb.id === 'btn_resume') {
              this.state = 'PLAYING';
            } else if (hb.id === 'btn_restart') {
              this.restartGame();
            } else if (hb.id === 'btn_next') {
              this.nextStage();
            } else if (hb.id === 'btn_garage') {
              this.openGarage();
            } else if (hb.id === 'btn_menu') {
              sound.stopEngine();
              this.state = 'TITLE';
            }
            return;
          }
        }
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
    } else if (result.scariedCount > 0) {
      ui.addFloatingText('📢 መኪኖች መንገድ ለቀቁ! (TRAFFIC YIELDED!)', this.width / 2, this.height - 130, '#38bdf8');
      if (Math.random() < 0.6) sound.speakWeyala('HORN_YIELD');
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
    this.keyboardReverse = false;
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

    if (this.gameMode === 'INFINITE') {
      this.timeLeft = 999999;
      this.stage = {
        id: 99,
        name: 'Addis - Adama Expressway (Endless)',
        nameAmharic: 'አዲስ - አዳማ የፍጥነት መንገድ (ማለቂያ የሌለው)',
        subtitle: 'High-Speed Infinite Highway Slalom',
        trackLength: 16000,
        targetPassengers: 0,
        timeLimit: 999999,
        skyTheme: 'day',
        fogColor: '#93c5fd',
        weather: 'clear',
        isWetRoad: false
      };
    } else if (this.gameMode === 'TIME_ATTACK') {
      this.timeLeft = 60.0;
      this.stage = {
        id: 98,
        name: 'Bole Airport Expressway (Time Attack)',
        nameAmharic: 'ቦሌ ኤርፖርት የፍጥነት መንገድ (የጊዜ ውድድር)',
        subtitle: '60s Countdown • Near Misses Add +2.5s!',
        trackLength: 14000,
        targetPassengers: 0,
        timeLimit: 60,
        skyTheme: 'sunset',
        fogColor: '#f97316',
        weather: 'clear',
        isWetRoad: false
      };
    } else if (this.gameMode === 'FREE_RIDE') {
      this.timeLeft = 999999;
      this.stage = {
        id: 97,
        name: 'Entoto Panoramic Highway (Free Ride)',
        nameAmharic: 'እንጦጦ ፓኖራሚክ መንገድ (ነፃ ጉዞ)',
        subtitle: 'Zero Pressure • Pure Scenic Driving',
        trackLength: 12000,
        targetPassengers: 0,
        timeLimit: 999999,
        skyTheme: 'day',
        fogColor: '#93c5fd',
        weather: 'clear',
        isWetRoad: false
      };
    } else {
      this.stage = STAGES[this.currentStageIndex];
      this.timeLeft = this.stage.timeLimit;
    }

    this.player.z = START_Z;
    this.player.speed = 0;
    this.lateralVelocity = 0;
    this.player.fuel = this.player.maxFuel;
    this.player.passengersOnBoard = 0;
    this.road.buildTrack(this.stage, this.trafficFlow);
    this.renderer3d.setupStageEnvironment(this.stage);
    this.track3d.build(this.road, this.stage);
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
    this.road.buildTrack(this.stage, this.trafficFlow);
    this.renderer3d.setupStageEnvironment(this.stage);
    this.track3d.build(this.road, this.stage);
    this.timeLeft = this.stage.timeLimit;
    this.particles = [];
    this.lateralVelocity = 0;
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
      this.player.z = START_Z;
      this.player.speed = 0;
      this.lateralVelocity = 0;
      this.player.passengersOnBoard = 0;
      this.player.passengersTarget = this.stage.targetPassengers;
      this.player.fuel = this.player.maxFuel;
      this.timeLeft = this.stage.timeLimit;
      this.particles = [];
      this.road.buildTrack(this.stage, this.trafficFlow);
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
    if (this.gameMode !== 'FREE_RIDE' && this.gameMode !== 'INFINITE') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
        this.state = 'GAMEOVER';
        this.gameOverReason = this.gameMode === 'TIME_ATTACK' ? '⏱️ ጊዜው አልቋል! (Time Expired!)' : 'ጊዜው አልቋል! (Shift Time Expired!)';
        sound.playCrash();
        return;
      }
    }

    if (this.gameMode !== 'FREE_RIDE') {
      this.player.fuel -= dt * 1.35;
      if (this.player.fuel <= 0) {
        if (this.player.fareCollected > 0) garage.addEarnings(this.player.fareCollected);
        this.state = 'GAMEOVER';
        this.gameOverReason = 'ነዳጅ አልቋል! (Ran Out of Fuel!)';
        sound.playCrash();
        return;
      }
    }

    // Infinite Highway Seamless Wrapping
    if (this.gameMode === 'INFINITE' && this.player.z >= this.road.trackLength - 2500) {
      this.player.z -= (this.road.trackLength - 5000);
    }

    // Combo timer decay
    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.comboCount = 0;
      }
    }

    // Racing Limits: Nitrous Oxide (N2O) Boost System ([N] or [Shift])
    const wantsNitro = !!(this.keys['n'] || this.keys['shift'] || this.keys['shiftleft'] || this.keys['shiftright']);
    const canNitro = this.player.nitro > 0 && this.player.gearMode === 'D' && this.player.speed > 600;
    const wasNitroActive = !!this.player.isNitroActive;

    if (wantsNitro && canNitro) {
      this.player.isNitroActive = true;
      this.player.nitro = Math.max(0, this.player.nitro - dt * 26);
      if (!wasNitroActive) {
        sound.playNitroSpool();
      }
    } else {
      this.player.isNitroActive = false;
      if (wasNitroActive) {
        sound.playWastegateFlutter();
      }
    }

    // 2. Bunna Turbo Boost & Nitrous Jet
    const isBoosting = (this.player.boostRemaining > 0) || !!this.player.isNitroActive;
    if (this.player.boostRemaining > 0) {
      this.player.boostRemaining -= dt;
      if (this.player.boostRemaining < 0) this.player.boostRemaining = 0;
    }

    if (isBoosting) {
      this.spawnBoostFlames(!!this.player.isNitroActive);
    }

    // Racing Limits: Two-Way Oncoming Lane Continuous Score & Risk Multiplier
    if (this.trafficFlow === 'TWO_WAY') {
      const inOncomingLane = this.player.x < -0.32;
      const atHighSpeed = this.player.speed > 3600; // > ~75 km/h

      if (inOncomingLane && atHighSpeed) {
        this.oncomingLaneTimer += dt;
        const reward = Math.round(dt * 24);
        this.player.fareCollected += reward;
        // Oncoming lane continuous driving recharges nitro
        this.player.nitro = Math.min(this.player.maxNitro, this.player.nitro + dt * 14);

        // Periodic floating toast notification
        if (Math.floor(this.oncomingLaneTimer * 3.5) !== Math.floor((this.oncomingLaneTimer - dt) * 3.5)) {
          ui.addFloatingText('⚠️ በተቃራኒ መስመር! +20 ETB/s', this.width / 2, this.height / 2 - 80, '#ef4444');
        }
      } else {
        this.oncomingLaneTimer = 0;
      }
    }

    const maxSpeed = this.player.isNitroActive ? this.player.maxSpeed * 1.55 : isBoosting ? this.player.maxSpeed * 1.48 : this.player.maxSpeed;

    // 3. User Controls & Analog Pedal Input
    const forward = !!this.keys['w'];
    const backward = !!this.keys['s'];
    const pedalBrake = !!(this.keys['arrowdown'] || this.controls?.isBrakeHeld);
    if (this.player.speed === 0 && !pedalBrake) {
      if (backward && !forward && this.player.gearMode === 'D') {
        this.shiftGear('R');
        this.keyboardReverse = true;
      } else if (forward && !backward && this.keyboardReverse && this.player.gearMode === 'R') {
        this.shiftGear('D');
      }
    }
    const reversing = this.player.gearMode === 'R';
    const forwardBrakes = reversing && this.keyboardReverse;
    const handbrake = !!this.keys['Space'];
    const up = !handbrake && !!(this.keys['arrowup'] || this.controls?.isGasHeld ||
      (forward && !forwardBrakes) || (backward && reversing));
    const down = handbrake || pedalBrake || (backward && !reversing) || (forward && forwardBrakes) || (forward && backward);
    const left = !!(this.keys['arrowleft'] || this.keys['a']);
    const right = !!(this.keys['arrowright'] || this.keys['d']);

    if (up) {
      this.player.gasPedal = Math.min(1.0, this.player.gasPedal + dt * 4.2);
    } else {
      this.player.gasPedal = Math.max(0.0, this.player.gasPedal - dt * 5.8);
    }

    if (down) {
      this.player.brakePedal = Math.min(1.0, this.player.brakePedal + dt * 5.2);
    } else {
      this.player.brakePedal = Math.max(0.0, this.player.brakePedal - dt * 6.8);
    }

    const currentSegment = this.road.findSegment(this.player.z);
    const startX = this.player.x * 9;
    const startZ = this.player.z;
    const prevSpeed = this.player.speed;
    const speedRatioPre = Math.min(1.5, Math.abs(this.player.speed) / this.player.maxSpeed);

    // Road slope resistance / gravity assist
    const segSlope = Math.max(-0.15, Math.min(0.15, (currentSegment.p2.y - currentSegment.p1.y) / ROAD.SEGMENT_LENGTH));
    const slopeForce = segSlope * this.player.accel * 0.55;

    // Dr. Driving PRND Transmission & Realistic Longitudinal Physics
    if (this.player.gearMode === 'P') {
      this.player.speed = 0;
      this.player.pitch *= 0.85;
      sound.stopTireScreech();
    } else if (this.player.gearMode === 'N') {
      const coastDrag = this.player.accel * (0.12 + 0.25 * speedRatioPre * speedRatioPre);
      const brakeForce = this.player.decel * this.player.brakePedal;
      this.player.speed = Math.max(0, this.player.speed - (coastDrag + brakeForce + slopeForce * 0.5) * dt);
      this.player.pitch *= 0.85;
      sound.stopTireScreech();
    } else if (this.player.gearMode === 'R') {
      const maxReverse = -1800;
      if (this.player.brakePedal > 0.05) {
        this.player.speed = Math.min(0, this.player.speed + (this.player.decel * this.player.brakePedal) * dt);
      } else if (this.player.gasPedal > 0.05) {
        this.player.speed = Math.max(maxReverse, this.player.speed - (this.player.accel * 0.65 * this.player.gasPedal) * dt);
      } else {
        this.player.speed = Math.min(0, this.player.speed + (this.player.accel * 0.35) * dt);
      }
      const revAccel = (this.player.speed - prevSpeed) / Math.max(0.001, dt);
      const targetPitch = Math.max(-0.06, Math.min(0.08, revAccel / 120000));
      this.player.pitch += (targetPitch - this.player.pitch) * Math.min(1, dt * 8);
      sound.stopTireScreech();
    } else {
      // 'D' (Drive Forward) — Torque curve + aerodynamic drag + progressive braking
      const aeroDrag = this.player.accel * (0.07 + 0.28 * speedRatioPre * speedRatioPre);

      if (this.player.brakePedal > 0.05) {
        // Braking overrides throttle; handbrake (Space) applies 1.75x rear-lock bite
        const brakeGrip = this.stage.isWetRoad ? 0.84 : 1.0;
        const handbrakeBoost = handbrake ? 1.75 : 1.0;
        const brakeForce = this.player.decel * (0.75 + 0.35 * this.player.brakePedal) * this.player.brakePedal * brakeGrip * handbrakeBoost;
        this.player.speed = Math.max(0, this.player.speed - (brakeForce + aeroDrag + slopeForce) * dt);
        if ((handbrake || this.player.brakePedal > 0.65) && speedRatioPre > 0.32) {
          this.spawnTireSmoke();
          sound.startTireScreech();
        } else {
          sound.stopTireScreech();
        }
      } else if (this.player.gasPedal > 0.05) {
        const accelMultiplier = this.player.isNitroActive ? 2.1 : isBoosting ? 1.55 : 1.0;
        // Stronger low-end torque in lower gears, tapering smoothly at top speed
        const torqueCurve = Math.max(0.45, 1.18 - 0.52 * Math.min(1.0, speedRatioPre));
        const driveForce = this.player.accel * accelMultiplier * torqueCurve * this.player.gasPedal;
        this.player.speed = Math.max(0, Math.min(maxSpeed, this.player.speed + (driveForce - aeroDrag - slopeForce) * dt));
        sound.stopTireScreech();
      } else {
        // Engine braking + aerodynamic coast-down
        const engineBrake = this.player.speed > 200 ? this.player.accel * 0.16 : this.player.accel * 0.25;
        this.player.speed = Math.max(0, this.player.speed - (engineBrake + aeroDrag + slopeForce) * dt);
        sound.stopTireScreech();
      }

      // Weight transfer pitch (squat under acceleration, nose-dive under braking)
      const longAccel = (this.player.speed - prevSpeed) / Math.max(0.001, dt);
      const targetPitch = Math.max(-0.07, Math.min(0.09, -longAccel / 110000));
      this.player.pitch += (targetPitch - this.player.pitch) * Math.min(1, dt * 8.5);
    }

    // Off-road penalty & Gravel vibration
    const isOffRoad = Math.abs(this.player.x) > 1.0;
    if (isOffRoad && this.player.gearMode === 'D') {
      const offRoadMax = this.player.maxSpeed * 0.45;
      if (this.player.speed > offRoadMax) {
        this.player.speed -= this.player.decel * 1.1 * dt;
      }
      this.screenShake = 1.1;
      this.player.bounceVelocity += (Math.random() - 0.5) * 7;
      this.spawnDust();
    }

    // Dr. Driving Continuous Steering Wheel Dynamics
    const speedRatio = Math.abs(this.player.speed) / this.player.maxSpeed;
    if (!this.controls.isWheelDragging) {
      const direction = Number(right) - Number(left);
      const target = direction * WHEEL_LOCK;
      const angle = this.player.steeringWheelAngle;
      const rate = direction === 0 ? 4.5 + speedRatio * 2 : angle * direction < 0 ? 6 : 3.2;
      const travel = WHEEL_LOCK * rate * dt;
      this.player.steeringWheelAngle += Math.sign(target - angle) * Math.min(travel, Math.abs(target - angle));
    }
    this.player.steerAngle = this.player.steeringWheelAngle / WHEEL_LOCK;
    this.player.turnSignal = this.player.steerAngle < -0.12 ? 'left' : this.player.steerAngle > 0.12 ? 'right' : 'none';

    // Speed-sensitive steering authority + lateral tire grip (smooth drift blend)
    const dirSign = this.player.gearMode === 'R' ? -1 : 1;
    const lowSpeedAuthority = Math.min(1.0, speedRatio * 2.8);
    const highSpeedStability = 1.0 - 0.36 * Math.min(1.0, speedRatio);
    const isDriftInput =
      (handbrake && speedRatio > 0.22 && Math.abs(this.player.steerAngle) > 0.12) ||
      (Math.abs(this.player.steerAngle) > 0.45 && speedRatio > 0.55);
    const targetBlend = isDriftInput && this.player.gearMode === 'D' ? 1.0 : 0.0;
    this.driftBlend += (targetBlend - this.driftBlend) * (1 - Math.exp(-(targetBlend > this.driftBlend ? 5.5 : 4.5) * dt));
    const driftLatMult = 1.0 + 0.3 * this.driftBlend;
    const targetLatVel = dirSign * this.player.turnSpeed * this.player.steerAngle * lowSpeedAuthority * highSpeedStability * driftLatMult;
    const baseGrip = isOffRoad ? 4.2 : this.stage.isWetRoad ? 6.8 : 10.5;
    const tireGrip = baseGrip + (3.4 - baseGrip) * this.driftBlend;
    this.lateralVelocity += (targetLatVel - this.lateralVelocity) * (1 - Math.exp(-tireGrip * dt));

    this.player.x += this.lateralVelocity * dt;
    this.player.x = Math.max(-3.4, Math.min(3.4, this.player.x));

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

    // Chassis body roll (frame-rate independent exponential smoothing)
    const targetRoll = this.player.steerAngle * speedRatio * 0.14;
    this.player.roll += (targetRoll - this.player.roll) * (1 - Math.exp(-8.5 * dt));
    this.player.roll = Math.max(-0.6, Math.min(0.6, this.player.roll));

    // Suspension spring oscillation (Hooke's law with damping & safety bounds)
    this.player.bounceVelocity = Math.max(-25, Math.min(25, this.player.bounceVelocity + (-38 * this.player.bounce - 7 * this.player.bounceVelocity) * dt));
    this.player.bounce = Math.max(-3.5, Math.min(3.5, this.player.bounce + this.player.bounceVelocity * dt));

    // Minimal centrifugal push only at extreme overspeed (> 92% max speed) on sharp curves
    if (speedRatio > 0.92) {
      const excess = speedRatio - 0.92;
      this.player.x -= (currentSegment.curve * excess * 0.6) * dt;
    }

    // Drift slip angle, tire smoke, Nitro refill & ETB drift bonus
    if (isDriftInput && this.player.gearMode === 'D') {
      this.player.isDrifting = true;
      const targetDrift = -this.player.steerAngle * (handbrake ? 0.50 : 0.32);
      this.player.driftAngle += (targetDrift - this.player.driftAngle) * (1 - Math.exp(-7.0 * dt));
      this.driftDuration += dt;
      this.driftEarnedETB += dt * 25;
      this.player.nitro = Math.min(this.player.maxNitro, this.player.nitro + dt * 10);
      this.spawnTireSmoke();
      if (Math.random() < 0.65) this.spawnTireSmoke();
      sound.startTireScreech();
    } else {
      if (this.player.isDrifting && this.driftDuration >= 0.6) {
        const bonus = Math.max(10, Math.round(this.driftEarnedETB * (this.player.vehicleId === 'BAJAJ' ? 1.5 : 1.0)));
        this.player.fareCollected += bonus;
        ui.addFloatingText(`🔥 DRIFT! +${bonus} ETB`, this.width / 2 - 55, this.height / 2 - 70, '#facc15');
      }
      this.player.isDrifting = false;
      this.driftDuration = 0;
      this.driftEarnedETB = 0;
      this.player.driftAngle += (0 - this.player.driftAngle) * (1 - Math.exp(-7.5 * dt));
      if (!down) sound.stopTireScreech();
    }

    // Advance distance
    this.player.z = Math.max(0, this.player.z + this.player.speed * dt);
    if (this.player.z === 0 && this.player.speed < 0) this.player.speed = 0;

    // Realistic multi-gear calculation
    this.updateRealisticGears(dt);

    if (speedRatio > 0.82) {
      this.spawnSpeedLines();
    }

    // Wet asphalt water spray
    if (this.stage.isWetRoad && this.player.speed > 1000) {
      this.spawnWaterSpray();
    }

    // Update traffic
    this.road.updateTraffic(dt);
    this.road.updateIntersections(dt);
    this.resolveSolidContacts(startX, startZ, dt);
    this.track3d.updateEntities(this.road, dt, this.player.z);

    // Sync 3D player mesh, wheels, headlights, and camera
    const { pos, tangent, normal } = this.track3d.getPointAtZ(this.player.z);
    const player3DPos = pos.clone().addScaledVector(normal, this.player.x * 9.0);
    player3DPos.y += 0.05 + this.player.bounce * 0.03;
    this.playerModel.group.position.copy(player3DPos);

    this.playerModel.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    const clampedRoll = Math.max(-0.35, Math.min(0.35, this.player.roll));
    const clampedPitch = Math.max(-0.25, Math.min(0.25, this.player.pitch));
    // Yaw chassis into turn + dramatic drift slip angle
    const bodyYaw = -this.player.steerAngle * 0.1 * Math.min(1, speedRatio * 1.5) + this.player.driftAngle;
    this.playerModel.group.rotateY(bodyYaw);
    this.playerModel.group.rotateZ(-clampedRoll - this.player.steerAngle * 0.06);
    this.playerModel.group.rotateX(clampedPitch);

    for (let wi = 0; wi < this.playerModel.wheels.length; wi++) {
      const w = this.playerModel.wheels[wi];
      w.rotation.order = 'YXZ';
      w.rotation.x += dt * (this.player.speed * 0.005);
      // Front wheels steer in the actual turn direction (-steerAngle in Three.js +Y-up)
      if (wi < 2 && (this.player.vehicleId !== 'BAJAJ' || wi === 0)) {
        w.rotation.y = -this.player.steerAngle * 0.45;
      } else {
        w.rotation.y = 0;
      }
    }

    if (this.playerModel.taillights) {
      const isReverse = this.player.gearMode === 'R';
      const isBraking = this.player.brakePedal > 0.08;
      const targetMat = isReverse ? materials.reverseLight : isBraking ? materials.taillightBraking : materials.taillight;
      for (const tl of this.playerModel.taillights) {
        tl.material = targetMat;
      }
    }

    // Dynamic 3D Boost Flame Jets (attached to rear exhaust pipes)
    if (this.playerModel.boostFlameJets) {
      const isBoostingNow = isBoosting && this.player.speed > 400 && this.player.gearMode === 'D';
      for (const jet of this.playerModel.boostFlameJets) {
        jet.visible = isBoostingNow;
        if (isBoostingNow) {
          jet.material = this.player.isNitroActive ? materials.flameBlue : materials.flameOrange;
          const s = 0.85 + Math.random() * 0.35;
          jet.scale.set(s, s * (this.player.isNitroActive ? 1.4 : 1.0), s);
        }
      }
    }

    this.renderer3d.update(player3DPos, tangent, normal, speedRatio, this.player.steerAngle, this.player.bounce, dt, isBoosting);

    // 4. Collisions, Pickups & Combos
    this.checkCollisions(this.road.findSegment(this.player.z));
    this.checkIntersectionRules();

    // 5. Stage Finish Check (CAREER mode only)
    if (this.gameMode === 'CAREER' && this.player.z >= this.road.trackLength - 20 * ROAD.SEGMENT_LENGTH) {
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

  private resolveSolidContacts(startX: number, startZ: number, dt: number) {
    if (dt <= 0) return;
    const [halfWidth, halfLength] = vehicleFootprints[this.player.vehicleId];
    const segment = this.road.findSegment(startZ);
    const metresPerUnit = 6 / (ROAD.SEGMENT_LENGTH * Math.max(0.01, Math.abs(this.track3d.spineTangents[segment.index].z)));
    type Body = { key: object; x: number; z: number; dx: number; dz: number; w: number; l: number; car?: SpriteInstance; crossing?: boolean };
    const bodies: Body[] = [];
    // Include vehicles that moved past the taxi within this frame.
    const margin = 500 + 4000 * dt;
    const first = Math.floor((Math.min(startZ, this.player.z) - margin) / ROAD.SEGMENT_LENGTH);
    const last = Math.ceil((Math.max(startZ, this.player.z) + margin) / ROAD.SEGMENT_LENGTH);
    for (let i = first; i <= last; i++) {
      const count = this.road.totalSegments;
      const seg = this.road.segments[((i % count) + count) % count];
      const z = i * ROAD.SEGMENT_LENGTH;
      if (seg.kioskX !== undefined) bodies.push({ key: seg, x: seg.kioskX, z, dx: 0, dz: 0, w: 1.7, l: 3.9 });
      for (const sprite of seg.sprites) {
        const size = spriteFootprints[sprite.type];
        if (!size || sprite.collected) continue;
        const dx = (sprite.offset - (sprite.previousOffset ?? sprite.offset)) * 9;
        const dz = (sprite.previousSpeed ?? 0) * dt;
        const centre = sprite.type === 'TRAFFIC_BAJAJ' ? vehicleCentreZ.BAJAJ :
          sprite.type === 'TRAFFIC_ISUZU' ? vehicleCentreZ.ISUZU : 0;
        const centreOffset = (sprite.isOncoming ? -centre : centre) / metresPerUnit;
        if (sprite.type === 'SCENERY_BUILDING_HOUSE') {
          bodies.push({ key: sprite, x: sprite.offset * 9 - Math.sign(sprite.offset) * 5, z,
            dx: 0, dz: 0, w: 0.225, l: 5.5 });
        }
        bodies.push({ key: sprite, x: sprite.offset * 9 - dx, z: z + (sprite.zOffset ?? 0) - dz + centreOffset,
          dx, dz, w: size[0], l: size[1], car: sprite.previousSpeed !== undefined ? sprite : undefined });
      }
    }
    for (const inter of this.road.intersections) {
      const centre = inter.zStopLine + 2 * ROAD.SEGMENT_LENGTH;
      if (Math.abs(centre - startZ) > margin + Math.abs(this.player.z - startZ)) continue;
      for (const car of inter.crossTrafficVehicles) {
        const [w, l] = vehicleFootprints[car.type];
        const x = car.previousX ?? car.crossX;
        bodies.push({ key: car, x: x + car.direction * vehicleCentreZ[car.type], z: centre + car.laneZ / metresPerUnit, dx: car.crossX - x, dz: 0,
          w: l, l: w, crossing: true });
      }
    }

    const playerCentre = vehicleCentreZ[this.player.vehicleId] / metresPerUnit;
    let x = startX, z = startZ + playerCentre, elapsed = 0;
    let endX = this.player.x * 9, endZ = this.player.z + playerCentre;
    for (let pass = 0; pass < 4; pass++) {
      let firstHit: ReturnType<typeof sweepContact>;
      let obstacle: Body | undefined;
      for (const body of bodies) {
        const hit = sweepContact(x - body.x - elapsed * body.dx, z - body.z - elapsed * body.dz,
          endX - x - (1 - elapsed) * body.dx, endZ - z - (1 - elapsed) * body.dz,
          halfWidth + body.w, (halfLength + body.l) / metresPerUnit);
        if (hit && (!firstHit || hit.time < firstHit.time)) { firstHit = hit; obstacle = body; }
      }
      if (!firstHit || !obstacle) break;
      const { time, lateral, sign } = firstHit;
      x += (endX - x) * time;
      z += (endZ - z) * time;
      elapsed += (1 - elapsed) * time;
      const closing = lateral ? Math.abs(this.lateralVelocity * 9 - obstacle.dx / dt) :
        Math.abs(this.player.speed - obstacle.dz / dt) * metresPerUnit;
      if (lateral) {
        x = obstacle.x + elapsed * obstacle.dx + sign * (halfWidth + obstacle.w + 0.005);
        endX = x + (1 - elapsed) * obstacle.dx;
        this.lateralVelocity = obstacle.dx / (dt * 9);
      } else {
        z = obstacle.z + elapsed * obstacle.dz + sign * (halfLength + obstacle.l + 0.005) / metresPerUnit;
        endZ = z + (1 - elapsed) * obstacle.dz;
        const car = obstacle.car;
        if (car) {
          const trafficSpeed = car.speed ?? 0;
          car.cruiseSpeed ??= trafficSpeed;
          const share = this.player.vehicleId === 'ISUZU' ? 0.72 : (car.type === 'TRAFFIC_ISUZU' || car.type === 'TRAFFIC_BUS') ? 0.2 : 0.45;
          const common = trafficSpeed + (this.player.speed - trafficSpeed) * share;
          car.speed = this.player.speed = car.isOncoming ? 0 : common;
        } else this.player.speed = 0;
      }
      const now = performance.now();
      const previous = this.lastImpact.get(obstacle.key) ?? -Infinity;
      this.lastImpact.set(obstacle.key, now);
      if (closing > 1.2 && now - previous > 550) {
        const force = Math.min(1, closing / 32);
        this.screenShake = Math.max(this.screenShake, 1 + 5 * force);
        this.player.bounceVelocity += 2 + 10 * force;
        if (lateral) this.player.roll += sign * force * 0.18;
        else this.player.pitch += sign * force * 0.08;
        this.player.comboCount = 0;
        if (closing > 5) {
          sound.playCrash();
          this.spawnSparks(this.width / 2, this.height - 60);
          if (obstacle.crossing) this.player.fareCollected = Math.max(0, this.player.fareCollected - 60);
        } else sound.playSuspensionThud();
      }
    }
    this.player.x = endX / 9;
    this.player.z = Math.max(0, endZ - playerCentre);
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

        if (performance.now() - (this.lastImpact.get(sprite) ?? -Infinity) < 550 && sprite.type !== 'TRAFFIC_POLICE') continue;

        // Racing Limits: Oncoming Vehicle Doppler Pass & High-Risk Near-Miss
        if (sprite.isOncoming && zDist < 420 && !sprite.oncomingWhooshed) {
          sprite.oncomingWhooshed = true;
          sound.playOncomingWhoosh();

          const dx = Math.abs(this.player.x - sprite.offset);
          if (dx < 1.4 && dx * 9 > vehicleFootprints[this.player.vehicleId][0] + (spriteFootprints[sprite.type]?.[0] ?? 0) && this.player.speed > 2100) {
            this.player.comboCount += 2;
            this.player.comboTimer = 5.0;
            this.player.nitro = Math.min(this.player.maxNitro, this.player.nitro + 25);
            const oncomingBonus = Math.round(50 * (this.player.vehicleId === 'BAJAJ' ? 1.5 : 1.0));
            this.player.fareCollected += oncomingBonus;
            ui.showToast('⚡ ተቃራኒ ማለፍ! (+50 ETB & +25% NITRO!)', '⚡', '#ef4444');
            ui.addFloatingText('⚡ ONCOMING DAREDEVIL! +50 ETB', this.width / 2 - 80, this.height / 2 - 40, '#ef4444');
          }
        }

        // Near-Miss Combo check with traffic
        if (
          sprite.type === 'TRAFFIC_LADA' ||
          sprite.type === 'TRAFFIC_BAJAJ' ||
          sprite.type === 'TRAFFIC_ISUZU' ||
          sprite.type === 'TRAFFIC_EV' ||
          sprite.type === 'TRAFFIC_BUS'
        ) {
          const dx = Math.abs(this.player.x - sprite.offset);
          if (zDist < ROAD.SEGMENT_LENGTH * 0.8 && dx > hitboxW * 0.8 && dx < hitboxW * 1.6 && this.player.speed > 2400 && this.nearMissCooldown <= 0) {
            this.nearMissCooldown = 0.6;
            this.player.comboCount++;
            this.player.comboTimer = 4.2;
            this.player.nitro = Math.min(this.player.maxNitro, this.player.nitro + 18);

            const multiplier = this.player.vehicleId === 'BAJAJ' ? 1.5 : 1.0;
            const comboBonus = Math.round(15 * this.player.comboCount * multiplier);
            this.player.fareCollected += comboBonus;
            sound.playNearMiss();
            if (this.gameMode === 'TIME_ATTACK') {
              this.timeLeft = Math.min(120, this.timeLeft + 2.5);
              ui.showToast('⏱️ +2.5s TIME EXTENDED!', '⏱️', '#38bdf8');
            }
            if (this.player.comboCount >= 3 && Math.random() < 0.6) {
              sound.speakWeyala('PRAISE');
            }
            ui.addFloatingText(`🔥 NEAR MISS! +${comboBonus} ETB`, this.width / 2, this.height / 2 - 50, '#f97316');
          }
        }

        if (zDist < ROAD.SEGMENT_LENGTH * 0.72) {
          const dx = Math.abs(this.player.x - sprite.offset);

          if (sprite.type === 'OBSTACLE_POTHOLE') {
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
              this.player.nitro = this.player.maxNitro;
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
            if (!sprite.radarChecked) {
              sprite.radarChecked = true;
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

  private spawnBoostFlames(isNitro: boolean = false) {
    const w = this.width;
    const h = this.height;
    const carW = (w / 900) * 0.85 * 240;
    const carX = w / 2;
    const carY = h - 25 + this.player.bounce;

    const colors = isNitro
      ? ['#06b6d4', '#38bdf8', '#00f0ff', '#ffffff']
      : ['#ff3b00', '#ffea00', '#f97316', '#ff8800'];

    [-carW * 0.18, carW * 0.18].forEach(offsetX => {
      this.particles.push({
        x: carX + offsetX,
        y: carY,
        vx: (Math.random() - 0.5) * (isNitro ? 26 : 20),
        vy: (isNitro ? 45 : 30) + Math.random() * (isNitro ? 55 : 40),
        size: (isNitro ? 7 : 6) + Math.random() * (isNitro ? 8 : 6),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.95,
        life: 0,
        maxLife: isNitro ? 0.3 : 0.2,
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
      sound.startRainAudio(weather === 'rain' ? 0.7 : 0.35);

      // Thunder in heavy mountain rain
      if (weather === 'rain') {
        this.thunderTimer -= dt;
        if (this.thunderTimer <= 0) {
          this.thunderTimer = 14 + Math.random() * 18;
          sound.playThunder();
          this.lightningFlash = 0.65;
          this.renderer3d.triggerLightning();
        }
      }
    } else {
      sound.stopRainAudio();
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

    // 2. Render Screen Particles (boost flames, tire smoke, sparks)
    this.renderParticles();

    this.ctx.restore();

    // Red Light Infraction Screen Flash
    if (this.screenFlashRed > 0) {
      this.ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.55, this.screenFlashRed * 0.5)})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Lightning Flash illumination
    if (this.lightningFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.45, this.lightningFlash * 0.45)})`;
      this.ctx.fillRect(0, 0, w, h);
    }

    // 7. UI HUD
    const progress = this.player.z / this.road.trackLength;
    if (this.state === 'PLAYING') {
      // Query trailing vehicles behind player within 2600 units for Dr. Driving Rearview Mirror
      const trailingCars: { type: string; distBehind: number; laneOffset: number }[] = [];
      const pz = this.player.z;
      const totalSegs = this.road.totalSegments;
      const playerSegIdx = Math.floor(pz / ROAD.SEGMENT_LENGTH);

      for (let offset = -1; offset >= -14; offset--) {
        const sIdx = (playerSegIdx + offset + totalSegs) % totalSegs;
        const seg = this.road.segments[sIdx];
        if (!seg) continue;
        for (const sp of seg.sprites) {
          if (typeof sp.type === 'string' && sp.type.startsWith('TRAFFIC_')) {
            const spZ = seg.p1.z + (sp.zOffset || 0);
            let dist = pz - spZ;
            if (dist < 0) dist += this.road.trackLength;
            if (dist > 50 && dist < 2600) {
              trailingCars.push({
                type: sp.type,
                distBehind: dist,
                laneOffset: sp.offset
              });
            }
          }
        }
      }

      ui.renderHUD(
        this.ctx,
        w,
        h,
        this.player,
        this.stage,
        this.timeLeft,
        progress,
        sound.isMuted,
        garage.highScore,
        garage.walletBalance,
        this.showOnScreenControls ? this.controls?.layout : undefined,
        trailingCars,
        this.gameMode,
        this.trafficFlow
      );
    } else if (this.state === 'TITLE') {
      ui.renderTitleScreen(this.ctx, w, h, garage.highScore, garage.walletBalance, this.gameMode, this.trafficFlow);
    } else if (this.state === 'PAUSED') {
      ui.renderPauseScreen(this.ctx, w, h);
    } else if (this.state === 'GAMEOVER') {
      ui.renderGameOver(this.ctx, w, h, this.gameOverReason, this.player.fareCollected, garage.highScore);
    } else if (this.state === 'STAGE_CLEAR') {
      const isLast = this.currentStageIndex >= STAGES.length - 1;
      ui.renderStageClear(this.ctx, w, h, this.stage, this.player.passengersOnBoard, this.player.fareCollected, isLast);
    }
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
