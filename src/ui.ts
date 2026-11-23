import { UPGRADE_PRICES, garage } from './garage';
import { sprites } from './sprites';
import type { Player, RouteStage, VehicleDef } from './types';

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
  scale: number;
  vy: number;
}

export interface GarageButtonHitbox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: () => void;
}

export interface ToastNotification {
  id: number;
  text: string;
  icon: string;
  color: string;
  alpha: number;
  timer: number;
  maxTimer: number;
}

export interface GarageButtonHitbox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  action: () => void;
}

export class UIManager {
  private floatingTexts: FloatingText[] = [];
  private toasts: ToastNotification[] = [];
  private toastCounter: number = 0;
  public garageHitboxes: GarageButtonHitbox[] = [];

  public showToast(text: string, icon: string = '📢', color: string = '#facc15') {
    this.toasts.unshift({
      id: ++this.toastCounter,
      text,
      icon,
      color,
      alpha: 1.0,
      timer: 2.4,
      maxTimer: 2.4
    });
    if (this.toasts.length > 3) {
      this.toasts.pop();
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#facc15') {
    // If it's a major event notification, push to structured non-overlapping toast stack
    const iconMatch = text.match(/^([^\s]+)\s*(.*)$/);
    const hasEmoji = iconMatch && /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u.test(iconMatch[1]);
    
    if (hasEmoji && iconMatch) {
      this.showToast(iconMatch[2] || iconMatch[1], iconMatch[1], color);
    } else {
      this.showToast(text, '✨', color);
    }

    // Also keep subtle floating pickup effect for small coin / bonus values
    if (text.includes('ETB') || text.includes('+')) {
      this.floatingTexts.push({
        text,
        x,
        y: y - 20,
        alpha: 1.0,
        color,
        scale: 1.1,
        vy: -1.8
      });
    }
  }

  public update(dt: number) {
    // Update floating pickup numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= 0.02 * dt * 60;
      if (ft.scale > 1.0) {
        ft.scale -= 0.02 * dt * 60;
      }
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update structured toasts
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.timer -= dt;
      if (t.timer < 0.6) {
        t.alpha = Math.max(0, t.timer / 0.6);
      }
      if (t.timer <= 0) {
        this.toasts.splice(i, 1);
      }
    }
  }

  public renderHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: Player,
    stage: RouteStage,
    timeLeft: number,
    progressRatio: number,
    _isMuted: boolean,
    highScore: number,
    walletBalance: number
  ) {
    ctx.save();

    // 1. Sleek Top Status Bar
    const headerH = 50;
    const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH + 16);
    headerGrad.addColorStop(0, 'rgba(8, 12, 22, 0.95)');
    headerGrad.addColorStop(0.75, 'rgba(8, 12, 22, 0.7)');
    headerGrad.addColorStop(1, 'rgba(8, 12, 22, 0)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, width, headerH + 16);

    // Subtle Ethiopian flag hairline ribbon across top
    const ribW = width / 3;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, ribW, 2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ribW, 0, ribW, 2);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ribW * 2, 0, ribW, 2);

    // Left: Route Title & Economy Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.beginPath();
    ctx.roundRect(14, 8, 270, 38, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${stage.nameAmharic}`, 24, 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Chakra Petch", sans-serif';
    ctx.fillText(`${stage.name}  •  💼 ${walletBalance} ETB  •  👑 ${highScore}`, 24, 38);

    // Center: Modern Route Progress Bar with Kilometers Remaining
    const progW = Math.min(280, width * 0.3);
    const progX = (width - progW) / 2;
    const progY = 16;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, 9, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const fillProg = Math.max(0, Math.min(1, progressRatio));
    const progGrad = ctx.createLinearGradient(progX, 0, progX + progW, 0);
    progGrad.addColorStop(0, '#10b981');
    progGrad.addColorStop(0.5, '#facc15');
    progGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = progGrad;
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * fillProg, 9, 5);
    ctx.fill();

    // Progress Destination Pin
    const pinX = progX + progW * fillProg;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pinX, progY + 4.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Distance in Kilometers
    const totalKm = (stage.trackLength / 1000).toFixed(1);
    const currentKm = Math.min(Number(totalKm), (fillProg * Number(totalKm))).toFixed(1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUTE DISTANCE: ${currentKm} / ${totalKm} KM`, width / 2, progY + 22);

    // Right: Essential Objectives (Shift Time, Passengers, Fare)
    // Cleanly spaced on the right with NO external buttons colliding!
    const timeColor = timeLeft < 15 ? '#ef4444' : '#facc15';
    const passTargetMet = player.passengersOnBoard >= stage.targetPassengers;

    // Time Left Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(width - 275, 8, 72, 38, 6);
    ctx.fill();
    ctx.strokeStyle = timeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = timeColor;
    ctx.font = 'bold 15px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))}s`, width - 239, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('TIME LEFT', width - 239, 38);

    // Passengers Delivered Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(width - 195, 8, 92, 38, 6);
    ctx.fill();
    ctx.strokeStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`👥 ${player.passengersOnBoard}/${stage.targetPassengers}`, width - 149, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText(passTargetMet ? 'GOAL MET' : 'PASSENGERS', width - 149, 38);

    // Fare Earned Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(width - 95, 8, 82, 38, 6);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`💵 ${player.fareCollected}`, width - 54, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('ETB FARE', width - 54, 38);

    // 2. Active Speed Combo Floating Pill (If combo > 1)
    if (player.comboCount > 1) {
      ctx.save();
      const comboX = width / 2;
      const comboY = 56;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.92)';
      ctx.beginPath();
      ctx.roundRect(comboX - 110, comboY - 14, 220, 28, 14);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 SPEED COMBO x${player.comboCount}!`, comboX, comboY + 5);
      ctx.restore();
    }

    // 3. Structured Toast Alert Notifications (Stacked below progress bar, zero overlap!)
    const toastStartY = player.comboCount > 1 ? 78 : 58;
    this.toasts.forEach((toast, idx) => {
      ctx.save();
      const toastY = toastStartY + idx * 30;
      ctx.globalAlpha = Math.max(0, toast.alpha);

      // Measure text width for perfect pill size
      ctx.font = 'bold 12px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      const textW = ctx.measureText(`${toast.icon} ${toast.text}`).width;
      const pillW = Math.max(180, textW + 36);
      const pillX = (width - pillW) / 2;

      // Dark glass pill background
      ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
      ctx.beginPath();
      ctx.roundRect(pillX, toastY, pillW, 26, 13);
      ctx.fill();

      ctx.strokeStyle = toast.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Toast icon & message
      ctx.fillStyle = toast.color;
      ctx.textAlign = 'center';
      ctx.fillText(`${toast.icon} ${toast.text}`, width / 2, toastY + 17);
      ctx.restore();
    });

    // 4. Subtle Floating Pickup Numbers (+20 ETB, etc.)
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.round(18 * ft.scale)}px "Chakra Petch", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 5. TRUE AUTOMOTIVE DUAL CORNER CLUSTERS (Center is 100% CLEAR for the car!)
    this.renderDualCornerCockpit(ctx, width, height, player);

    ctx.restore();
  }

  // Realistic Automotive Dual-Cluster Cockpit HUD
  private renderDualCornerCockpit(ctx: CanvasRenderingContext2D, width: number, height: number, player: Player) {
    ctx.save();

    const speedKmh = Math.floor((player.speed / player.maxSpeed) * 165);
    const rpmRatio = Math.min(1, Math.max(0.12, player.rpm / 7500));
    const isBoosting = player.boostRemaining > 0;

    // Dimensions for corner pods
    const podW = 224;
    const podH = 88;
    const podY = height - podH - 12;

    // ----------------------------------------------------
    // LEFT POD: Vehicle Diagnostics (Fuel, Bunna Boost, Chassis)
    // ----------------------------------------------------
    const leftPodX = 14;

    // Dark brushed glass pod frame
    const leftGrad = ctx.createLinearGradient(0, podY, 0, podY + podH);
    leftGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    leftGrad.addColorStop(1, 'rgba(4, 7, 14, 0.96)');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.roundRect(leftPodX, podY, podW, podH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Specular top rim shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(leftPodX + 12, podY + 1);
    ctx.lineTo(leftPodX + podW - 12, podY + 1);
    ctx.stroke();

    // Fuel Meter
    const fuelRatio = Math.max(0, Math.min(1, player.fuel / player.maxFuel));
    const isLowFuel = fuelRatio < 0.25;
    const fuelBlink = isLowFuel && Math.floor(Date.now() / 300) % 2 === 0;

    ctx.fillStyle = fuelBlink ? '#ef4444' : '#94a3b8';
    ctx.font = 'bold 9.5px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⛽ FUEL', leftPodX + 12, podY + 18);

    ctx.fillStyle = isLowFuel ? '#ef4444' : '#38bdf8';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(player.fuel)}%`, leftPodX + podW - 12, podY + 18);

    // Fuel Segmented Bar
    const barX = leftPodX + 12;
    const barW = podW - 24;
    const barY = podY + 22;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 6, 3);
    ctx.fill();

    const fuelColor = isLowFuel ? '#ef4444' : fuelRatio < 0.5 ? '#facc15' : '#10b981';
    ctx.fillStyle = fuelColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * fuelRatio, 6, 3);
    ctx.fill();

    // Bunna Nitro Boost Meter
    const boostRatio = Math.max(0, Math.min(1, player.boostRemaining / player.boostMax));
    ctx.fillStyle = isBoosting ? '#f97316' : '#94a3b8';
    ctx.font = 'bold 9.5px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isBoosting ? '☕ NITRO ACTIVE!' : '☕ BUNNA NITRO', leftPodX + 12, podY + 44);

    ctx.fillStyle = isBoosting ? '#ff3b00' : boostRatio > 0 ? '#facc15' : '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(isBoosting ? `${player.boostRemaining.toFixed(1)}s` : boostRatio > 0 ? 'READY' : 'EMPTY', leftPodX + podW - 12, podY + 44);

    // Boost Bar
    const boostBarY = podY + 48;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, boostBarY, barW, 6, 3);
    ctx.fill();

    const boostGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    boostGrad.addColorStop(0, '#f97316');
    boostGrad.addColorStop(1, '#ff3b00');
    ctx.fillStyle = boostGrad;
    ctx.beginPath();
    ctx.roundRect(barX, boostBarY, barW * (isBoosting ? boostRatio : player.boostRemaining > 0 ? 1 : 0), 6, 3);
    ctx.fill();

    // Thermal Engine Temp & Suspension Status Row
    const isOverheating = player.engineTemp > 115;
    const tempBlink = isOverheating && Math.floor(Date.now() / 250) % 2 === 0;
    const tempColor = tempBlink ? '#ef4444' : player.engineTemp > 105 ? '#f59e0b' : '#38bdf8';

    ctx.fillStyle = tempColor;
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🌡️ TEMP: ${Math.round(player.engineTemp)}°C`, leftPodX + 12, podY + 74);

    const hasAlignmentDamage = Math.abs(player.alignmentBias) > 0.05;
    ctx.fillStyle = hasAlignmentDamage ? '#ef4444' : '#22c55e';
    ctx.textAlign = 'right';
    ctx.fillText(hasAlignmentDamage ? 'ALIGN: DAMAGED ⚠️' : 'ALIGN: OK ✓', leftPodX + podW - 12, podY + 74);

    // ----------------------------------------------------
    // RIGHT POD: Performance Telemetry (Speed, RPM, Gears, Signals)
    // ----------------------------------------------------
    const rightPodX = width - podW - 14;

    const rightGrad = ctx.createLinearGradient(0, podY, 0, podY + podH);
    rightGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    rightGrad.addColorStop(1, 'rgba(4, 7, 14, 0.96)');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.roundRect(rightPodX, podY, podW, podH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Specular shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(rightPodX + 12, podY + 1);
    ctx.lineTo(rightPodX + podW - 12, podY + 1);
    ctx.stroke();

    // Left half of right pod: Bold Digital Speedometer
    const spdBoxX = rightPodX + 48;
    const spdBoxY = podY + 42;

    // Arc sweep indicator around speed
    const spdRatio = Math.min(1, player.speed / player.maxSpeed);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(spdBoxX, spdBoxY, 28, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    const spdArcGrad = ctx.createLinearGradient(spdBoxX - 28, spdBoxY, spdBoxX + 28, spdBoxY);
    spdArcGrad.addColorStop(0, '#38bdf8');
    spdArcGrad.addColorStop(0.7, '#facc15');
    spdArcGrad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = spdArcGrad;
    ctx.beginPath();
    ctx.arc(spdBoxX, spdBoxY, 28, Math.PI * 0.8, Math.PI * (0.8 + spdRatio * 1.4));
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speedKmh}`, spdBoxX, spdBoxY + 5);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px "Chakra Petch", sans-serif';
    ctx.fillText('KM/H', spdBoxX, spdBoxY + 16);

    // Right half of right pod: RPM, Gears, Signals
    const telX = rightPodX + 104;

    // Turn Signals & Hazard Flashers (blinking green arrows)
    const isHazard = player.hazardFlashers && Math.floor(Date.now() / 320) % 2 === 0;
    const isLeftSig = isHazard || (player.turnSignal === 'left' && Math.floor(Date.now() / 320) % 2 === 0);
    const isRightSig = isHazard || (player.turnSignal === 'right' && Math.floor(Date.now() / 320) % 2 === 0);

    ctx.fillStyle = isLeftSig ? '#22c55e' : 'rgba(34, 197, 94, 0.15)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀', telX + 12, podY + 22);

    ctx.fillStyle = isRightSig ? '#22c55e' : 'rgba(34, 197, 94, 0.15)';
    ctx.fillText('▶', telX + 90, podY + 22);

    // Dr. Driving PRND Transmission Indicator: [P] [R] [N] [D]
    const prnd = ['P', 'R', 'N', 'D'] as const;
    prnd.forEach((m, idx) => {
      const gx = telX + 22 + idx * 18;
      const isCurrent = player.gearMode === m;
      if (isCurrent) {
        ctx.fillStyle = m === 'R' ? '#ef4444' : m === 'P' ? '#f59e0b' : m === 'N' ? '#38bdf8' : '#22c55e';
        ctx.font = '900 13px "Chakra Petch", monospace';
        // Subtle glow badge behind active gear
        ctx.save();
        ctx.fillStyle = m === 'R' ? 'rgba(239, 68, 68, 0.25)' : m === 'P' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(34, 197, 94, 0.25)';
        ctx.beginPath();
        ctx.roundRect(gx - 8, podY + 9, 16, 16, 3);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = 'bold 11px "Chakra Petch", monospace';
      }
      ctx.textAlign = 'center';
      const label = (m === 'D' && isCurrent) ? `D${player.gear}` : m;
      ctx.fillText(label, gx, podY + 22);
    });

    // RPM Bar & Value
    const isRedline = rpmRatio > 0.85;
    ctx.fillStyle = isRedline ? '#ef4444' : '#94a3b8';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`RPM: ${Math.round(player.rpm)}`, telX + 10, podY + 48);

    if (isRedline) {
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'right';
      ctx.fillText('SHIFT!', telX + 94, podY + 48);
    }

    const rpmBarW = 86;
    const rpmBarY = podY + 54;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(telX + 10, rpmBarY, rpmBarW, 6, 3);
    ctx.fill();

    const rpmGrad = ctx.createLinearGradient(telX + 10, 0, telX + 10 + rpmBarW, 0);
    rpmGrad.addColorStop(0, '#38bdf8');
    rpmGrad.addColorStop(0.7, '#facc15');
    rpmGrad.addColorStop(0.88, '#ef4444');
    ctx.fillStyle = rpmGrad;
    ctx.beginPath();
    ctx.roundRect(telX + 10, rpmBarY, rpmBarW * rpmRatio, 6, 3);
    ctx.fill();

    // ----------------------------------------------------
    // CENTER BOTTOM: Subtle Driving Controls Legend
    // Leaves the center 100% open so the player car is completely visible!
    // ----------------------------------------------------
    const legendW = 340;
    const legendX = (width - legendW) / 2;
    const legendY = height - 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.roundRect(legendX, legendY - 10, legendW, 16, 8);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('W/↑ GAS  •  S/↓ BRAKE  •  A/D STEER  •  SPACE HORN  •  R RADIO  •  F HAZARDS', width / 2, legendY + 2);

    ctx.restore();
  }

  public renderTitleScreen(ctx: CanvasRenderingContext2D, width: number, height: number, highScore: number, walletBalance: number) {
    ctx.save();
    this.garageHitboxes = [];

    ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2 - 25;

    // Ethiopian Flag Ribbon
    const ribW = Math.min(540, width * 0.86);
    const startRibX = midX - ribW / 2;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(startRibX, midY - 148, ribW / 3, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(startRibX + ribW / 3, midY - 148, ribW / 3, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(startRibX + (ribW / 3) * 2, midY - 148, ribW / 3, 6);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 46px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 16;
    ctx.fillText('አዲስ ታክሲ ራሽ', midX, midY - 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText('ADDIS TAXI RUSH', midX, midY - 44);

    const selV = garage.selectedVehicle;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.fillText(`CURRENT RIDE: ${selV.nameAmharic} (${selV.name})`, midX, midY - 14);

    // Instructions Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
    ctx.beginPath();
    ctx.roundRect(midX - 270, midY + 8, 540, 160, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13.5px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    const leftPad = midX - 240;
    ctx.fillText('🚕 Drive across Addis Ababa: Minibus, Lada, Bajaj, or Isuzu Truck!', leftPad, midY + 36);
    ctx.fillText('👥 Pull over to the RIGHT curb to pick up passengers ("መገናኛ!")', leftPad, midY + 62);
    ctx.fillText('📢 Press H / SPACE to honk: clears cows, goats, and traffic!', leftPad, midY + 88);
    ctx.fillText('☕ Collect steaming Bunna (ቡና) cups for extreme Turbo Boost!', leftPad, midY + 114);
    ctx.fillText('🔥 Near-miss overtakes build Speed Combos for massive fares!', leftPad, midY + 140);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💼 WALLET: ${walletBalance} ETB  |  👑 RECORD: ${highScore} ETB`, midX, midY + 195);

    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 200);

    // [START DRIVING] Button
    ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
    ctx.beginPath();
    ctx.roundRect(midX - 240, midY + 215, 230, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Chakra Petch", sans-serif';
    ctx.fillText('▶ START DRIVING (ENTER)', midX - 125, midY + 244);

    // [GARAGE & UPGRADES] Button
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(midX + 10, midY + 215, 230, 46, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🚗 GARAGE / ጋራዥ (G)', midX + 125, midY + 244);

    ctx.restore();
  }

  public renderGarageScreen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    activeVehicleIndex: number
  ) {
    ctx.save();
    this.garageHitboxes = [];

    ctx.fillStyle = 'rgba(10, 15, 30, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const vehicleKeys = Object.keys(garage.vehicles) as (keyof typeof garage.vehicles)[];
    const currentId = vehicleKeys[activeVehicleIndex % vehicleKeys.length];
    const vehicle = garage.vehicles[currentId];

    const headerH = 68;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, headerH);

    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, headerH - 4, width / 3, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(width / 3, headerH - 4, width / 3, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect((width / 3) * 2, headerH - 4, width / 3, 4);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 24px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🚗 ጋራዥ እና ማሻሻያ • ADDIS GARAGE', 24, 40);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px "Chakra Petch", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`💼 WALLET: ${garage.walletBalance} ETB`, width - 24, 40);

    // Vehicle Selector Tabs
    const tabW = Math.min(180, (width - 48) / vehicleKeys.length - 10);
    const tabsStartX = (width - (tabW + 10) * vehicleKeys.length) / 2;
    const tabsY = headerH + 16;

    vehicleKeys.forEach((key, idx) => {
      const tabX = tabsStartX + idx * (tabW + 10);
      const isCurrent = key === currentId;
      const isSelected = key === garage.selectedVehicleId;
      const isUnlocked = garage.vehicles[key].unlocked;

      ctx.fillStyle = isCurrent ? '#0284c7' : 'rgba(30, 41, 59, 0.85)';
      ctx.beginPath();
      ctx.roundRect(tabX, tabsY, tabW, 36, 6);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#facc15' : isCurrent ? '#38bdf8' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      ctx.fillStyle = isUnlocked ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 12px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      const label = garage.vehicles[key].name;
      ctx.fillText(label, tabX + tabW / 2, tabsY + 22);

      this.garageHitboxes.push({
        id: `tab_${key}`,
        x: tabX,
        y: tabsY,
        w: tabW,
        h: 36,
        action: () => {}
      });
    });

    const mainY = tabsY + 52;
    const mainH = height - mainY - 68;
    const colW = (width - 60) / 2;

    // LEFT CARD: Vehicle Showcase
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(24, mainY, colW, mainH, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${vehicle.nameAmharic}`, 44, mainY + 36);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px "Chakra Petch", sans-serif';
    ctx.fillText(`${vehicle.name}`, 44, mainY + 56);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Chakra Petch", sans-serif';
    ctx.fillText(vehicle.tagline, 44, mainY + 76);

    const previewSprite = sprites.get(`PLAYER_${vehicle.id}_STRAIGHT`);
    if (previewSprite) {
      const prevScale = Math.min(1.4, (colW - 80) / previewSprite.width);
      const pw = previewSprite.width * prevScale;
      const ph = previewSprite.height * prevScale;
      const px = 24 + colW / 2 - pw / 2;
      const py = mainY + 85;
      ctx.drawImage(previewSprite.canvas, px, py, pw, ph);
    }

    const statY = mainY + mainH - 120;
    this.renderStatBar(ctx, 44, statY, colW - 88, 'SPEED (ፍጥነት)', vehicle.baseMaxSpeed / 16000, '#38bdf8');
    this.renderStatBar(ctx, 44, statY + 28, colW - 88, 'HANDLING (መሪ)', vehicle.baseTurnSpeed / 4.2, '#22c55e');
    this.renderStatBar(ctx, 44, statY + 56, colW - 88, 'FUEL CAPACITY (ታንከር)', vehicle.baseMaxFuel / 160, '#facc15');

    const actBtnY = mainY + mainH - 42;
    const isSelected = vehicle.id === garage.selectedVehicleId;
    const isUnlocked = vehicle.unlocked;

    if (isSelected) {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.roundRect(44, actBtnY, colW - 88, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✔️ CURRENTLY SELECTED', 44 + (colW - 88) / 2, actBtnY + 21);
    } else if (isUnlocked) {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(44, actBtnY, colW - 88, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SELECT THIS VEHICLE', 44 + (colW - 88) / 2, actBtnY + 21);

      this.garageHitboxes.push({
        id: 'btn_select',
        x: 44,
        y: actBtnY,
        w: colW - 88,
        h: 32,
        action: () => garage.selectVehicle(vehicle.id)
      });
    } else {
      const canAfford = garage.walletBalance >= vehicle.unlockPrice;
      ctx.fillStyle = canAfford ? '#ea580c' : '#475569';
      ctx.beginPath();
      ctx.roundRect(44, actBtnY, colW - 88, 32, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔓 UNLOCK FOR ${vehicle.unlockPrice} ETB`, 44 + (colW - 88) / 2, actBtnY + 21);

      this.garageHitboxes.push({
        id: 'btn_unlock',
        x: 44,
        y: actBtnY,
        w: colW - 88,
        h: 32,
        action: () => garage.unlockVehicle(vehicle.id)
      });
    }

    // RIGHT CARD: Upgrades Workshop
    const rightX = 36 + colW;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(rightX, mainY, colW, mainH, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ማሻሻያዎች • PERFORMANCE UPGRADES', rightX + 24, mainY + 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Chakra Petch", sans-serif';
    ctx.fillText('Tune this ride to dominate the Addis highways and hills', rightX + 24, mainY + 56);

    const upgrades: { key: 'engine' | 'steering' | 'fuel' | 'turbo'; name: string; nameAmh: string; icon: string; desc: string }[] = [
      { key: 'engine', name: 'Engine Tuning', nameAmh: 'ሞተር ማሻሻያ', icon: '⚡', desc: '+12% Top Speed & Acceleration per level' },
      { key: 'steering', name: 'Power Steering', nameAmh: 'ሃይል መሪ', icon: '🕹️', desc: '+14% Cornering Agility & Drift Control' },
      { key: 'fuel', name: 'Extended Fuel Tank', nameAmh: 'ትልቅ ነዳጅ ታንከር', icon: '⛽', desc: '+20% Maximum Fuel Reserves' },
      { key: 'turbo', name: 'Bunna Turbo Kit', nameAmh: 'ቡና ቱርቦ ኪት', icon: '☕', desc: '+1.5s Boost Duration & Explosive Thrust' }
    ];

    let upY = mainY + 80;
    upgrades.forEach(u => {
      this.renderUpgradeRow(ctx, rightX + 24, upY, colW - 48, vehicle, u);
      upY += 68;
    });

    // Bottom Navigation Bar
    const btmY = height - 52;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, btmY, width, 52);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◀ / ▶ : Switch Vehicle  |  G / ESC : Close Garage', 24, btmY + 30);

    const btnW = 160;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(width - btnW * 2 - 32, btmY + 8, btnW, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← BACK (ESC)', width - btnW * 2 - 32 + btnW / 2, btmY + 30);

    this.garageHitboxes.push({
      id: 'btn_back',
      x: width - btnW * 2 - 32,
      y: btmY + 8,
      w: btnW,
      h: 36,
      action: () => {}
    });

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(width - btnW - 16, btmY + 8, btnW, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('▶ DRIVE (ENTER)', width - btnW - 16 + btnW / 2, btmY + 30);

    this.garageHitboxes.push({
      id: 'btn_drive',
      x: width - btnW - 16,
      y: btmY + 8,
      w: btnW,
      h: 36,
      action: () => {}
    });

    ctx.restore();
  }

  private renderStatBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, ratio: number, color: string) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y + 10);

    const barX = x + 130;
    const barW = w - 130;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, y + 2, barW, 10);

    ctx.fillStyle = color;
    ctx.fillRect(barX, y + 2, barW * Math.min(1, Math.max(0.1, ratio)), 10);
  }

  private renderUpgradeRow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    vehicle: VehicleDef,
    u: { key: 'engine' | 'steering' | 'fuel' | 'turbo'; name: string; nameAmh: string; icon: string; desc: string }
  ) {
    const level = vehicle.upgrades[u.key];
    const isMax = level >= 3;
    const price = isMax ? 0 : UPGRADE_PRICES[level];
    const canAfford = !isMax && vehicle.unlocked && garage.walletBalance >= price;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 56, 8);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${u.icon} ${u.nameAmh} (${u.name})`, x + 12, y + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.fillText(u.desc, x + 12, y + 42);

    const stars = ['★', '★', '★'].map((_, i) => (i < level ? '★' : '☆')).join(' ');
    ctx.fillStyle = '#facc15';
    ctx.font = '16px monospace';
    ctx.fillText(stars, x + w - 195, y + 34);

    const btnW = 105;
    const btnX = x + w - btnW - 12;
    const btnY = y + 12;
    const btnH = 32;

    if (isMax) {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MAXED ✔️', btnX + btnW / 2, btnY + 20);
    } else if (!vehicle.unlocked) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED 🔒', btnX + btnW / 2, btnY + 20);
    } else {
      ctx.fillStyle = canAfford ? '#16a34a' : '#475569';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`+ ${price} ETB`, btnX + btnW / 2, btnY + 20);

      this.garageHitboxes.push({
        id: `up_${u.key}`,
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        action: () => garage.upgradeVehicle(vehicle.id, u.key)
      });
    }
  }

  public renderPauseScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 36px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ ጨዋታው ቆሟል • PAUSED', midX, midY - 50);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px "Chakra Petch", sans-serif';
    ctx.fillText('Press P, ESC, or CLICK to Resume', midX, midY + 10);
    ctx.fillText('Press G to Open Garage & Upgrades', midX, midY + 40);
    ctx.fillText('Press R to Restart Route', midX, midY + 70);

    ctx.restore();
  }

  public renderGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, reason: string, score: number, highScore: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#ef4444';
    ctx.font = '900 38px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ጨዋታው አልቋል! • SHIFT OVER', midX, midY - 65);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '18px "Chakra Petch", sans-serif';
    ctx.fillText(reason, midX, midY - 20);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px "Chakra Petch", sans-serif';
    ctx.fillText(`SHIFT FARES EARNED: +${score} ETB`, midX, midY + 30);

    if (score >= highScore && score > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.fillText('🏆 NEW HIGH SCORE RECORD! 🏆', midX, midY + 65);
    }

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.fillText('PRESS SPACE TO TRY AGAIN  |  PRESS G FOR GARAGE', midX, midY + 115);

    ctx.restore();
  }

  public renderStageClear(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    stage: RouteStage,
    passengers: number,
    fare: number,
    isLastStage: boolean
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#22c55e';
    ctx.font = '900 36px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isLastStage ? 'እንኳን ደስ አለዎት! • GRAND TOUR COMPLETE!' : 'ጣቢያው ደርሰዋል! • STAGE COMPLETE!', midX, midY - 70);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '20px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.fillText(`Completed Route: ${stage.nameAmharic} (${stage.name})`, midX, midY - 20);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.fillText(`👥 Passengers Delivered: ${passengers}`, midX, midY + 25);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`💵 Fares Earned: +${fare} ETB (Saved to Wallet!)`, midX, midY + 60);

    const activeContract = garage.contracts.find(c => c.targetStageId === stage.id);
    if (activeContract) {
      ctx.fillStyle = activeContract.completed ? '#22c55e' : '#94a3b8';
      ctx.font = 'bold 15px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.fillText(`📋 ኮንትራት: ${activeContract.titleAmharic} — ${activeContract.completed ? `ተጠናቋል! (+${activeContract.rewardETB} ETB)` : 'በሂደት ላይ'}`, midX, midY + 95);
    }

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(isLastStage ? 'PRESS SPACE TO PLAY AGAIN | G FOR GARAGE' : 'PRESS SPACE FOR NEXT ROUTE | G FOR GARAGE', midX, midY + 135);

    ctx.restore();
  }
}

export const ui = new UIManager();
