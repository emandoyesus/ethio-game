import type { GameEngine } from './game';
import type { TransmissionGear } from './types';

export const WHEEL_LOCK = Math.PI / 2;

export interface DrDrivingLayout {
  wheel: { cx: number; cy: number; r: number; hornR: number };
  gas: { x: number; y: number; w: number; h: number };
  brake: { x: number; y: number; w: number; h: number };
  shifter: {
    x: number;
    y: number;
    w: number;
    h: number;
    slots: { gear: TransmissionGear; y: number }[];
  };
}

export class DrDrivingControls {
  private game: GameEngine;
  private canvas: HTMLCanvasElement;

  private wheelPointerId: number | null = null;
  private lastWheelPointerAngle: number | null = null;
  public isWheelDragging: boolean = false;

  private gasPointerId: number | null = null;
  public isGasHeld: boolean = false;

  private brakePointerId: number | null = null;
  public isBrakeHeld: boolean = false;

  public layout: DrDrivingLayout = {
    wheel: { cx: 95, cy: 500, r: 68, hornR: 24 },
    gas: { x: 740, y: 460, w: 38, h: 84 },
    brake: { x: 675, y: 475, w: 50, h: 65 },
    shifter: {
      x: 625,
      y: 445,
      w: 34,
      h: 110,
      slots: [
        { gear: 'P', y: 458 },
        { gear: 'R', y: 484 },
        { gear: 'N', y: 510 },
        { gear: 'D', y: 536 }
      ]
    }
  };

  constructor(game: GameEngine, canvas: HTMLCanvasElement) {
    this.game = game;
    this.canvas = canvas;
    this.initListeners();
  }

  public updateLayout(width: number, height: number) {
    const wheelR = Math.max(54, Math.min(74, width * 0.08));
    const wheelX = Math.max(wheelR + 16, 90);
    const wheelY = height - wheelR - 18;

    const gasW = Math.max(30, Math.min(42, width * 0.045));
    const gasH = Math.max(70, Math.min(92, height * 0.16));
    const gasX = width - gasW - 16;
    const gasY = height - gasH - 18;

    const brakeW = Math.max(42, Math.min(56, width * 0.06));
    const brakeH = Math.max(55, Math.min(72, height * 0.13));
    const brakeX = gasX - brakeW - 14;
    const brakeY = height - brakeH - 18;

    const shifterW = 32;
    const shifterH = 108;
    const shifterX = brakeX - shifterW - 14;
    const shifterY = height - shifterH - 18;

    const slotStep = shifterH / 4;
    const slots: { gear: TransmissionGear; y: number }[] = [
      { gear: 'P', y: shifterY + slotStep * 0.5 },
      { gear: 'R', y: shifterY + slotStep * 1.5 },
      { gear: 'N', y: shifterY + slotStep * 2.5 },
      { gear: 'D', y: shifterY + slotStep * 3.5 }
    ];

    this.layout = {
      wheel: { cx: wheelX, cy: wheelY, r: wheelR, hornR: Math.round(wheelR * 0.36) },
      gas: { x: gasX, y: gasY, w: gasW, h: gasH },
      brake: { x: brakeX, y: brakeY, w: brakeW, h: brakeH },
      shifter: { x: shifterX, y: shifterY, w: shifterW, h: shifterH, slots }
    };
  }

  private initListeners() {
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e: PointerEvent) => this.onPointerUp(e));
    this.canvas.addEventListener('lostpointercapture', (e) => this.onPointerUp(e));
    window.addEventListener('blur', () => this.releaseInputs());
    window.addEventListener('pointercancel', (e: PointerEvent) => this.onPointerUp(e));
  }

  public releaseInputs() {
    this.wheelPointerId = this.gasPointerId = this.brakePointerId = null;
    this.isWheelDragging = this.isGasHeld = this.isBrakeHeld = false;
    this.lastWheelPointerAngle = null;
  }

  private getCanvasCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.game.width / rect.width;
    const scaleY = this.game.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private onPointerDown(e: PointerEvent) {
    if (this.game.state !== 'PLAYING') return;
    if (e.pointerType === 'touch' && !this.game.showOnScreenControls) {
      this.game.showOnScreenControls = true;
    }
    if (!this.game.showOnScreenControls) return;

    const { x, y } = this.getCanvasCoords(e);
    const { wheel, gas, brake, shifter } = this.layout;

    // 1. Steering Wheel & Horn Check
    const dx = x - wheel.cx;
    const dy = y - wheel.cy;
    const distSq = dx * dx + dy * dy;

    if (distSq <= (wheel.r + 8) ** 2) {
      if (this.wheelPointerId !== null) return;
      if (distSq <= wheel.hornR * wheel.hornR) {
        // Tapped Center Horn Boss!
        this.game.triggerHorn();
        return;
      }
      this.canvas.setPointerCapture(e.pointerId);
      this.wheelPointerId = e.pointerId;
      this.isWheelDragging = true;
      this.lastWheelPointerAngle = Math.atan2(dy, dx);
      return;
    }

    // 2. Gas Pedal Check
    if (x >= gas.x && x <= gas.x + gas.w && y >= gas.y && y <= gas.y + gas.h + 10) {
      this.gasPointerId = e.pointerId;
      this.isGasHeld = true;
      return;
    }

    // 3. Brake Pedal Check
    if (x >= brake.x && x <= brake.x + brake.w && y >= brake.y && y <= brake.y + brake.h + 10) {
      this.brakePointerId = e.pointerId;
      this.isBrakeHeld = true;
      return;
    }

    // 4. Shifter Check
    if (x >= shifter.x - 6 && x <= shifter.x + shifter.w + 6 && y >= shifter.y && y <= shifter.y + shifter.h) {
      for (const slot of shifter.slots) {
        if (Math.abs(y - slot.y) <= 14) {
          this.game.shiftGear(slot.gear);
          return;
        }
      }
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (this.game.state !== 'PLAYING') return;

    if (this.isWheelDragging && e.pointerId === this.wheelPointerId) {
      const { x, y } = this.getCanvasCoords(e);
      const { wheel } = this.layout;
      if (Math.hypot(x - wheel.cx, y - wheel.cy) < wheel.hornR) {
        this.lastWheelPointerAngle = null;
        return;
      }
      const curAngle = Math.atan2(y - wheel.cy, x - wheel.cx);

      let delta = curAngle - (this.lastWheelPointerAngle ?? curAngle);
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      const player = this.game.player;
      player.steeringWheelAngle = Math.max(-WHEEL_LOCK, Math.min(WHEEL_LOCK, player.steeringWheelAngle + delta));
      this.lastWheelPointerAngle = curAngle;
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (e.pointerId === this.wheelPointerId) {
      this.wheelPointerId = null;
      this.isWheelDragging = false;
    }

    if (e.pointerId === this.gasPointerId) {
      this.gasPointerId = null;
      this.isGasHeld = false;
    }

    if (e.pointerId === this.brakePointerId) {
      this.brakePointerId = null;
      this.isBrakeHeld = false;
    }
  }
}
