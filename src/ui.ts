import { UPGRADE_PRICES, garage } from './garage';
import { sprites } from './sprites';
import type { Player, RacingLimitsGameMode, RouteStage, TrafficFlow, VehicleDef } from './types';
import type { DrDrivingLayout } from './controls';

export interface TitleHitbox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

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
  public titleHitboxes: TitleHitbox[] = [];
  public overlayHitboxes: TitleHitbox[] = [];
  private hoverX: number = -1;
  private hoverY: number = -1;
  private smoothSpeedKmh: number = 0;
  private smoothRpmRatio: number = 0.12;

  public setHover(x: number, y: number) {
    this.hoverX = x;
    this.hoverY = y;
  }

  private isHovered(x: number, y: number, w: number, h: number): boolean {
    return this.hoverX >= x && this.hoverX <= x + w && this.hoverY >= y && this.hoverY <= y + h;
  }

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
    walletBalance: number,
    drDrivingLayout?: DrDrivingLayout,
    trailingCars: { type: string; distBehind: number; laneOffset: number }[] = [],
    gameMode: RacingLimitsGameMode = 'CAREER',
    trafficFlow: TrafficFlow = 'ONE_WAY'
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

    // Dr. Driving Windshield Active Rearview Mirror & Reverse Cam
    this.renderRearviewMirror(ctx, width, player, trailingCars);

    // Left: Route Title & Economy Badge (Responsive width)
    const leftW = Math.min(250, Math.max(175, width * 0.25));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.beginPath();
    ctx.roundRect(14, 8, leftW, 38, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    const modeAmh = gameMode === 'INFINITE'
      ? '♾️ ማለቂያ የሌለው (INFINITE)'
      : gameMode === 'TIME_ATTACK'
      ? '⏱️ የጊዜ ውድድር (TIME ATTACK)'
      : gameMode === 'FREE_RIDE'
      ? '🕊️ ነፃ ጉዞ (FREE RIDE)'
      : `${stage.nameAmharic}`;
    ctx.fillText(modeAmh, 22, 24, leftW - 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Chakra Petch", sans-serif';
    const flowText = trafficFlow === 'TWO_WAY' ? '⚡ 2-WAY' : '➡️ 1-WAY';
    ctx.fillText(`${flowText}  •  WALLET: ${walletBalance}  •  BEST: ${highScore} ETB`, 22, 38, leftW - 16);

    // Right: Essential Objectives (Shift Time, Passengers, Fare)
    const timeColor = timeLeft < 15 ? '#ef4444' : '#facc15';
    const passTargetMet = player.passengersOnBoard >= stage.targetPassengers;
    const fareW = 78;
    const passW = 86;
    const timeW = 68;
    const badgeGap = 6;
    const fareX = width - 14 - fareW;
    const passX = fareX - badgeGap - passW;
    const timeX = passX - badgeGap - timeW;

    // Center: Modern Route Progress Bar (bounded between left and right badges)
    const centerLeft = 14 + leftW + 12;
    const centerRight = timeX - 12;
    const progW = Math.max(90, Math.min(260, centerRight - centerLeft));
    const progX = centerLeft + (centerRight - centerLeft - progW) / 2;
    const progY = 14;

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

    // Distance in Kilometers / Mode Status
    const totalKm = (stage.trackLength / 1000).toFixed(1);
    const currentKm = Math.min(Number(totalKm), (fillProg * Number(totalKm))).toFixed(1);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    const progCenterX = progX + progW / 2;
    if (gameMode === 'INFINITE') {
      ctx.fillText(`♾️ ${(player.z / 1000).toFixed(2)} KM DRIVEN`, progCenterX, progY + 22, progW + 20);
    } else if (gameMode === 'TIME_ATTACK') {
      ctx.fillText(`⏱️ ${(player.z / 1000).toFixed(2)} KM • CLOSE PASS = +2.5s`, progCenterX, progY + 22, progW + 20);
    } else if (gameMode === 'FREE_RIDE') {
      ctx.fillText(`🕊️ ${(player.z / 1000).toFixed(2)} KM • FREE CRUISE`, progCenterX, progY + 22, progW + 20);
    } else {
      ctx.fillText(`DISTANCE: ${currentKm} / ${totalKm} KM`, progCenterX, progY + 22, progW + 20);
    }

    // Time Left / Mode Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(timeX, 8, timeW, 38, 6);
    ctx.fill();
    ctx.strokeStyle = gameMode === 'FREE_RIDE' ? '#38bdf8' : timeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = gameMode === 'FREE_RIDE' ? '#38bdf8' : timeColor;
    ctx.font = 'bold 15px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    if (gameMode === 'FREE_RIDE') {
      ctx.fillText('FREE', timeX + timeW / 2, 25);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "Chakra Petch", sans-serif';
      ctx.fillText('CRUISE', timeX + timeW / 2, 38);
    } else if (gameMode === 'INFINITE') {
      ctx.fillText(`${(player.z / 1000).toFixed(1)}K`, timeX + timeW / 2, 25);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "Chakra Petch", sans-serif';
      ctx.fillText('KM DIST', timeX + timeW / 2, 38);
    } else {
      ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))}s`, timeX + timeW / 2, 25);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "Chakra Petch", sans-serif';
      ctx.fillText('TIME LEFT', timeX + timeW / 2, 38);
    }

    // Passengers Delivered Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(passX, 8, passW, 38, 6);
    ctx.fill();
    ctx.strokeStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`👥 ${player.passengersOnBoard}/${stage.targetPassengers}`, passX + passW / 2, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText(passTargetMet ? 'GOAL MET' : 'PASSENGERS', passX + passW / 2, 38);

    // Fare Earned Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(fareX, 8, fareW, 38, 6);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`💵 ${player.fareCollected}`, fareX + fareW / 2, 25);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('ETB FARE', fareX + fareW / 2, 38);

    // 2. Active Speed Combo Floating Pill (If combo > 1)
    if (player.comboCount > 1) {
      ctx.save();
      const comboX = width / 2;
      const comboY = 110;

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

    // Racing Limits: Active Oncoming Lane Warning Pill
    if (trafficFlow === 'TWO_WAY' && player.x < -0.32 && player.speed > 3600) {
      ctx.save();
      const warnX = width / 2;
      const warnY = player.comboCount > 1 ? 138 : 106;
      const pulseWarn = 0.8 + 0.2 * Math.sin(Date.now() / 90);

      ctx.fillStyle = `rgba(220, 38, 38, ${pulseWarn * 0.92})`;
      ctx.beginPath();
      ctx.roundRect(warnX - 150, warnY - 12, 300, 24, 12);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ በተቃራኒ መስመር • ONCOMING LANE (+20 ETB/s)', warnX, warnY + 4);
      ctx.restore();
    }

    // 3. Structured Toast Alert Notifications (Stacked below rearview mirror, with slide-in ease)
    const toastStartY = 112 + (player.comboCount > 1 ? 28 : 0);
    this.toasts.forEach((toast, idx) => {
      ctx.save();
      const age = toast.maxTimer - toast.timer;
      const enterProgress = Math.min(1, age / 0.22);
      const easeOutBack = 1 - Math.pow(1 - enterProgress, 3);
      const slideOffset = (1 - easeOutBack) * -14;
      const toastY = toastStartY + idx * 30 + slideOffset;
      ctx.globalAlpha = Math.max(0, toast.alpha * easeOutBack);

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

    // 5. TRUE AUTOMOTIVE DUAL CORNER CLUSTERS
    this.renderDualCornerCockpit(ctx, width, height, player, !!drDrivingLayout);

    // 6. Dr. Driving Interactive Controls (Steering Wheel, Gas/Brake Pedals, PRND Shifter)
    if (drDrivingLayout) {
      this.renderDrDrivingControls(ctx, width, height, player, drDrivingLayout);
    }

    ctx.restore();
  }

  // Realistic Automotive Dual-Cluster Cockpit HUD
  private renderDualCornerCockpit(ctx: CanvasRenderingContext2D, width: number, height: number, player: Player, hasOnScreenControls: boolean = false) {
    ctx.save();

    const targetSpeedKmh = (player.speed / player.maxSpeed) * 165;
    const targetRpmRatio = Math.min(1, Math.max(0.12, player.rpm / 7500));
    this.smoothSpeedKmh += (targetSpeedKmh - this.smoothSpeedKmh) * 0.22;
    this.smoothRpmRatio += (targetRpmRatio - this.smoothRpmRatio) * 0.25;

    const speedKmh = Math.floor(this.smoothSpeedKmh);
    const rpmRatio = this.smoothRpmRatio;
    const isBoosting = (player.boostRemaining > 0) || !!player.isNitroActive;

    // Dimensions for corner pods: sit cleanly at bottom corners on desktop, or float above touch controls
    const podW = 224;
    const podH = 88;
    const podY = hasOnScreenControls && height > 520 ? height - podH - 124 : height - podH - 14;

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

    // Racing Limits: Nitrous Oxide (N2O) & Bunna Boost Meter
    const nitroVal = player.nitro !== undefined ? player.nitro : 0;
    const nitroMax = player.maxNitro || 100;
    const nitroRatio = Math.max(0, Math.min(1, nitroVal / nitroMax));
    const isNitroActive = !!player.isNitroActive;
    const isBunnaActive = player.boostRemaining > 0;

    const nitroTitle = isNitroActive ? '⚡ N2O ACTIVE!' : isBunnaActive ? '☕ BUNNA TURBO!' : '⚡ NITRO [N / SHIFT]';
    ctx.fillStyle = isNitroActive ? '#38bdf8' : isBunnaActive ? '#f97316' : '#94a3b8';
    ctx.font = 'bold 9.5px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(nitroTitle, leftPodX + 12, podY + 44);

    ctx.fillStyle = isNitroActive ? '#00f0ff' : isBunnaActive ? '#ff3b00' : nitroRatio > 0.15 ? '#38bdf8' : '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(isBoosting ? `${Math.round(nitroVal)}%` : nitroRatio > 0 ? `${Math.round(nitroVal)}%` : 'EMPTY', leftPodX + podW - 12, podY + 44);

    // Boost Bar
    const boostBarY = podY + 48;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(barX, boostBarY, barW, 6, 3);
    ctx.fill();

    const boostGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    if (isNitroActive || nitroRatio > 0) {
      boostGrad.addColorStop(0, '#0284c7');
      boostGrad.addColorStop(0.5, '#06b6d4');
      boostGrad.addColorStop(1, '#38bdf8');
    } else {
      boostGrad.addColorStop(0, '#f97316');
      boostGrad.addColorStop(1, '#ff3b00');
    }
    ctx.fillStyle = boostGrad;
    ctx.beginPath();
    ctx.roundRect(barX, boostBarY, barW * (isBoosting ? Math.max(0.08, nitroRatio) : nitroRatio), 6, 3);
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
    // Only shown when there is enough room between pods
    // ----------------------------------------------------
    if (width >= 820) {
      const legendW = 330;
      const legendX = (width - legendW) / 2;
      const legendY = height - 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.roundRect(legendX, legendY - 10, legendW, 18, 8);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8.5px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('W DRIVE • S BRAKE/REVERSE • ↑/↓ PEDALS • A/D STEER • SHIFT NITRO • SPACE HORN • R RADIO', width / 2, legendY + 2);
    }

    ctx.restore();
  }

  // Dr. Driving Cockpit Controls: Rotatable Steering Wheel, Gas & Brake Pedals, PRND Shifter
  public renderDrDrivingControls(
    ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    player: Player,
    layout: DrDrivingLayout
  ) {
    ctx.save();
    const { wheel, gas, brake, shifter } = layout;

    // ----------------------------------------------------
    // 1. ROTATABLE STEERING WHEEL WITH CENTER HORN BOSS
    // ----------------------------------------------------
    ctx.save();
    ctx.translate(wheel.cx, wheel.cy);
    ctx.rotate(player.steeringWheelAngle);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;

    // Outer leather rim
    const rimGrad = ctx.createRadialGradient(0, 0, wheel.r - 14, 0, 0, wheel.r + 4);
    rimGrad.addColorStop(0, '#1e293b');
    rimGrad.addColorStop(0.5, '#0f172a');
    rimGrad.addColorStop(1, '#020617');

    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset shadow

    // Inner rim stitch line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.r - 6, 0, Math.PI * 2);
    ctx.stroke();

    // 12 o'clock racing alignment yellow band
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.r, -Math.PI / 2 - 0.12, -Math.PI / 2 + 0.12);
    ctx.stroke();

    // Taper the three spokes into the hub, with a brushed-metal highlight.
    for (const angle of [-1.35, 1.35, Math.PI]) {
      ctx.save();
      ctx.rotate(angle);
      const metal = ctx.createLinearGradient(-9, 0, 9, 0);
      metal.addColorStop(0, '#31383d');
      metal.addColorStop(0.35, '#a8afb0');
      metal.addColorStop(0.65, '#727c80');
      metal.addColorStop(1, '#363e43');
      ctx.fillStyle = metal;
      ctx.beginPath();
      ctx.moveTo(-wheel.hornR * 0.5, -wheel.hornR * 0.6);
      ctx.lineTo(-5, -wheel.r + 5);
      ctx.lineTo(5, -wheel.r + 5);
      ctx.lineTo(wheel.hornR * 0.5, -wheel.hornR * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Center Horn Boss (Hub)
    const bossGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, wheel.hornR);
    bossGrad.addColorStop(0, '#334155');
    bossGrad.addColorStop(0.85, '#0f172a');
    bossGrad.addColorStop(1, '#020617');

    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.hornR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Horn icon & text
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📢', 0, -3);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 7px "Chakra Petch", sans-serif';
    ctx.fillText('HORN', 0, 9);

    ctx.restore();

    // Steering Angle HUD Indicator Arc (Stationary above the wheel)
    const normSteer = player.steerAngle;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wheel.cx, wheel.cy - wheel.r - 8, 14, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    ctx.strokeStyle = normSteer < -0.05 ? '#ef4444' : normSteer > 0.05 ? '#22c55e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(wheel.cx, wheel.cy - wheel.r - 8, 14, Math.PI * 1.5, Math.PI * (1.5 + normSteer * 0.65), normSteer < 0);
    ctx.stroke();

    // ----------------------------------------------------
    // 2. ANALOG PEDALS (BRAKE & GAS)
    // ----------------------------------------------------
    // --- BRAKE PEDAL ---
    const brakeTravel = player.brakePedal * 9;
    const isBraking = player.brakePedal > 0.08;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.beginPath();
    ctx.roundRect(brake.x - 3, brake.y - 2, brake.w + 6, brake.h + 12, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const brakeGrad = ctx.createLinearGradient(brake.x, brake.y, brake.x, brake.y + brake.h);
    brakeGrad.addColorStop(0, isBraking ? '#dc2626' : '#475569');
    brakeGrad.addColorStop(1, isBraking ? '#7f1d1d' : '#1e293b');

    ctx.fillStyle = brakeGrad;
    ctx.beginPath();
    ctx.roundRect(brake.x, brake.y + brakeTravel, brake.w, brake.h, 6);
    ctx.fill();
    ctx.strokeStyle = isBraking ? '#f87171' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isBraking ? 'rgba(0, 0, 0, 0.5)' : '#0f172a';
    for (let r = 0; r < 4; r++) {
      ctx.fillRect(brake.x + 6, brake.y + brakeTravel + 12 + r * 9, brake.w - 12, 4);
    }

    ctx.fillStyle = isBraking ? '#fee2e2' : '#cbd5e1';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRAKE', brake.x + brake.w / 2, brake.y + brakeTravel + brake.h - 6);

    // --- GAS PEDAL ---
    const gasTravel = player.gasPedal * 12;
    const isGasOn = player.gasPedal > 0.08;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.beginPath();
    ctx.roundRect(gas.x - 3, gas.y - 2, gas.w + 6, gas.h + 14, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    const gasGrad = ctx.createLinearGradient(gas.x, gas.y, gas.x, gas.y + gas.h);
    gasGrad.addColorStop(0, isGasOn ? '#0284c7' : '#334155');
    gasGrad.addColorStop(1, isGasOn ? '#0c4a6e' : '#0f172a');

    ctx.fillStyle = gasGrad;
    ctx.beginPath();
    ctx.roundRect(gas.x, gas.y + gasTravel, gas.w, gas.h, 5);
    ctx.fill();
    ctx.strokeStyle = isGasOn ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isGasOn ? 'rgba(0, 0, 0, 0.45)' : '#020617';
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(gas.x + 7 + s * 9, gas.y + gasTravel + 10, 4, gas.h - 26);
    }

    ctx.fillStyle = isGasOn ? '#e0f2fe' : '#cbd5e1';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAS', gas.x + gas.w / 2, gas.y + gasTravel + gas.h - 6);

    // ----------------------------------------------------
    // 3. PRND SHIFTER LEVER CONSOLE
    // ----------------------------------------------------
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(shifter.x, shifter.y, shifter.w, shifter.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Vertical guide groove
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(shifter.x + shifter.w / 2 - 3, shifter.y + 10, 6, shifter.h - 20, 3);
    ctx.fill();

    let activeSlotY = shifter.slots[0].y;
    for (const slot of shifter.slots) {
      const isSel = player.gearMode === slot.gear;
      if (isSel) activeSlotY = slot.y;

      const slotColor = slot.gear === 'R' ? '#ef4444' : slot.gear === 'P' ? '#f59e0b' : slot.gear === 'N' ? '#38bdf8' : '#22c55e';
      ctx.fillStyle = isSel ? slotColor : 'rgba(148, 163, 184, 0.4)';
      ctx.font = isSel ? 'bold 11px "Chakra Petch", monospace' : '9px "Chakra Petch", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slot.gear, shifter.x + shifter.w / 2, slot.y + 4);
    }

    // Chrome Shifter Knob & Lever Arm
    const knobX = shifter.x + shifter.w / 2;
    const knobY = activeSlotY;

    // Lever Shaft
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(knobX - 2, knobY - 2, 4, 4);

    // Chrome Knob
    const knobGrad = ctx.createRadialGradient(knobX - 3, knobY - 3, 1, knobX, knobY, 9);
    knobGrad.addColorStop(0, '#ffffff');
    knobGrad.addColorStop(0.5, '#cbd5e1');
    knobGrad.addColorStop(1, '#475569');

    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.arc(knobX, knobY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // Dr. Driving Windshield Active Rearview Mirror & Reverse Cam Guidelines
  private renderRearviewMirror(
    ctx: CanvasRenderingContext2D,
    width: number,
    player: Player,
    trailingCars: { type: string; distBehind: number; laneOffset: number }[]
  ) {
    ctx.save();

    const mirrorW = 200;
    const mirrorH = 50;
    const mirrorX = (width - mirrorW) / 2;
    const mirrorY = 52;

    // 1. Windshield Mounting Bracket
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 5, mirrorY - 7, 10, 8, 2);
    ctx.fill();

    // 2. Beveled Mirror Bezel / Housing
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(mirrorX, mirrorY, mirrorW, mirrorH, 10);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Anti-glare flip tab at bottom
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 9, mirrorY + mirrorH, 18, 5, [0, 0, 3, 3]);
    ctx.fill();

    // 3. Mirror Glass (clipped inside inner boundary)
    const glassX = mirrorX + 4;
    const glassY = mirrorY + 4;
    const glassW = mirrorW - 8;
    const glassH = mirrorH - 8;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(glassX, glassY, glassW, glassH, 7);
    ctx.clip();

    const isReverse = player.gearMode === 'R';

    // Glass Background: Sky & Ground Perspective
    const glassGrad = ctx.createLinearGradient(0, glassY, 0, glassY + glassH);
    if (isReverse) {
      glassGrad.addColorStop(0, '#04101c');
      glassGrad.addColorStop(0.5, '#082f49');
      glassGrad.addColorStop(1, '#020617');
    } else {
      glassGrad.addColorStop(0, '#0b1329');
      glassGrad.addColorStop(0.45, '#1e293b');
      glassGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = glassGrad;
    ctx.fillRect(glassX, glassY, glassW, glassH);

    // Vanishing road perspective inside mirror
    const centerX = glassX + glassW / 2;
    const horizonY = glassY + glassH * 0.42;

    ctx.strokeStyle = isReverse ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    // Road shoulders converging to horizon
    ctx.beginPath();
    ctx.moveTo(centerX - 8, horizonY);
    ctx.lineTo(glassX + 10, glassY + glassH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + 8, horizonY);
    ctx.lineTo(glassX + glassW - 10, glassY + glassH);
    ctx.stroke();

    // Road center dashed line
    ctx.strokeStyle = isReverse ? 'rgba(56, 189, 248, 0.35)' : 'rgba(250, 204, 21, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, horizonY);
    ctx.lineTo(centerX, glassY + glassH);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Render Trailing Vehicles in Mirror
    trailingCars.forEach(car => {
      const depthFrac = Math.max(0, Math.min(1, (2500 - car.distBehind) / 2400));
      const carScale = 0.3 + depthFrac * 0.7;
      const carY = horizonY + (glassY + glassH - horizonY) * depthFrac * 0.85;
      const carX = centerX + car.laneOffset * (glassW * 0.35) * depthFrac;

      const cw = 26 * carScale;
      const ch = 15 * carScale;

      ctx.fillStyle = car.type === 'TRAFFIC_POLICE' ? '#1e3a5f' : car.type === 'TRAFFIC_BAJAJ' ? '#047857' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(carX - cw / 2, carY - ch / 2, cw, ch, 3);
      ctx.fill();

      // Glowing headlights shining toward player
      const headlightColor = isReverse ? '#38bdf8' : '#fef08a';
      ctx.fillStyle = headlightColor;
      const hlSize = 2.8 * carScale;
      ctx.beginPath();
      ctx.arc(carX - cw * 0.32, carY + ch * 0.1, hlSize, 0, Math.PI * 2);
      ctx.arc(carX + cw * 0.32, carY + ch * 0.1, hlSize, 0, Math.PI * 2);
      ctx.fill();

      // Soft headlight flare
      ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
      ctx.beginPath();
      ctx.arc(carX, carY + ch * 0.1, cw * 0.55, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Dynamic Dr. Driving Backup Guidelines (When in Reverse [R])
    if (isReverse) {
      const steer = player.steerAngle;
      const curveOffset = steer * 20;

      const segments = [
        { yStart: glassY + glassH * 0.38, yEnd: glassY + glassH * 0.6, color: '#22c55e' },
        { yStart: glassY + glassH * 0.6, yEnd: glassY + glassH * 0.82, color: '#facc15' },
        { yStart: glassY + glassH * 0.82, yEnd: glassY + glassH * 0.96, color: '#ef4444' }
      ];

      ctx.lineWidth = 1.8;
      segments.forEach(seg => {
        ctx.strokeStyle = seg.color;
        const f0 = (seg.yStart - glassY) / glassH;
        const f1 = (seg.yEnd - glassY) / glassH;

        const leftX0 = centerX - 30 * f0 + curveOffset * f0 * f0;
        const leftX1 = centerX - 30 * f1 + curveOffset * f1 * f1;
        const rightX0 = centerX + 30 * f0 + curveOffset * f0 * f0;
        const rightX1 = centerX + 30 * f1 + curveOffset * f1 * f1;

        ctx.beginPath();
        ctx.moveTo(leftX0, seg.yStart);
        ctx.lineTo(leftX1, seg.yEnd);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightX0, seg.yStart);
        ctx.lineTo(rightX1, seg.yEnd);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftX1, seg.yEnd);
        ctx.lineTo(rightX1, seg.yEnd);
        ctx.stroke();
      });

      // Top cam mode badge
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.roundRect(glassX + 6, glassY + 4, 66, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R • REAR CAM', glassX + 39, glassY + 13);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 9px "Chakra Petch", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('RADAR: OK', glassX + glassW - 6, glassY + 13);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(glassX + 6, glassY + 4, 78, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 7.5px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('የኋላ መስታወት', glassX + 45, glassY + 13);
    }

    // Glass Subtle Convex Glare / Reflection Sheen
    const sheenGrad = ctx.createLinearGradient(glassX, glassY, glassX + glassW, glassY + glassH);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.04)');
    sheenGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(glassX, glassY, glassW, glassH);

    ctx.restore();
    ctx.restore();
  }

  public renderTitleScreen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    highScore: number,
    walletBalance: number,
    selectedMode: RacingLimitsGameMode = 'CAREER',
    selectedFlow: TrafficFlow = 'ONE_WAY'
  ) {
    ctx.save();
    this.titleHitboxes = [];
    this.garageHitboxes = [];

    ctx.fillStyle = 'rgba(8, 12, 22, 0.92)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = Math.max(165, Math.min(height / 2 - 24, height - 285));

    // Ethiopian Flag Ribbon
    const ribW = Math.min(560, width * 0.9);
    const startRibX = midX - ribW / 2;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(startRibX, midY - 146, ribW / 3, 5);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(startRibX + ribW / 3, midY - 146, ribW / 3, 5);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(startRibX + (ribW / 3) * 2, midY - 146, ribW / 3, 5);

    // Amharic Title
    ctx.fillStyle = '#facc15';
    ctx.font = '900 42px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 14;
    ctx.fillText('አዲስ ታክሲ ራሽ', midX, midY - 92);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 24px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText('ADDIS TAXI RUSH • RACING LIMITS', midX, midY - 58);
    ctx.shadowBlur = 0;

    const selV = garage.selectedVehicle;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.fillText(`CURRENT RIDE: ${selV.nameAmharic} (${selV.name})`, midX, midY - 32);

    // ----------------------------------------------------
    // RACING LIMITS MODE & FLOW CONSOLE BOX
    // ----------------------------------------------------
    const boxW = Math.min(560, width * 0.92);
    const boxH = 205;
    const boxX = midX - boxW / 2;
    const boxY = midY - 18;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 1. GAME MODE SELECTION (4 Tabs)
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GAME MODE / የውድድር ዓይነት:', boxX + 16, boxY + 20);

    const modes: { id: RacingLimitsGameMode; icon: string; amh: string; eng: string }[] = [
      { id: 'CAREER', icon: '🏆', amh: 'የስራ ውድድር', eng: 'CAREER' },
      { id: 'INFINITE', icon: '♾️', amh: 'ማለቂያ የሌለው', eng: 'INFINITE' },
      { id: 'TIME_ATTACK', icon: '⏱️', amh: 'የጊዜ ውድድር', eng: 'TIME ATTACK' },
      { id: 'FREE_RIDE', icon: '🕊️', amh: 'ነፃ ጉዞ', eng: 'FREE RIDE' }
    ];

    const tabGap = 8;
    const tabW = (boxW - 32 - tabGap * 3) / 4;
    const tabH = 46;
    const tabsY = boxY + 28;

    modes.forEach((m, idx) => {
      const tx = boxX + 16 + idx * (tabW + tabGap);
      const isSel = selectedMode === m.id;

      ctx.fillStyle = isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.roundRect(tx, tabsY, tabW, tabH, 8);
      ctx.fill();

      ctx.strokeStyle = isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = isSel ? '#facc15' : '#e2e8f0';
      ctx.font = 'bold 11px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m.icon} ${m.amh}`, tx + tabW / 2, tabsY + 20);

      ctx.fillStyle = isSel ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 9px "Chakra Petch", sans-serif';
      ctx.fillText(m.eng, tx + tabW / 2, tabsY + 36);

      this.titleHitboxes.push({
        id: `mode_${m.id}`,
        x: tx,
        y: tabsY,
        w: tabW,
        h: tabH
      });
    });

    // 2. TRAFFIC FLOW SELECTION (One-Way vs Two-Way Oncoming)
    const flowY = tabsY + tabH + 16;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TRAFFIC FLOW / የትራፊክ አቅጣጫ:', boxX + 16, flowY + 8);

    const flows: { id: TrafficFlow; icon: string; amh: string; eng: string; perk: string }[] = [
      { id: 'ONE_WAY', icon: '➡️', amh: 'አንድ አቅጣጫ', eng: 'ONE-WAY', perk: 'All lanes move forward' },
      { id: 'TWO_WAY', icon: '⚡', amh: 'ሁለት አቅጣጫ', eng: 'TWO-WAY', perk: 'Oncoming lane = +20 ETB/s bonus' }
    ];

    const flowGap = 12;
    const flowW = (boxW - 32 - flowGap) / 2;
    const flowH = 38;
    const flowBtnY = flowY + 16;

    flows.forEach((f, idx) => {
      const fx = boxX + 16 + idx * (flowW + flowGap);
      const isSel = selectedFlow === f.id;

      ctx.fillStyle = isSel ? (f.id === 'TWO_WAY' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(34, 197, 94, 0.25)') : 'rgba(30, 41, 59, 0.6)';
      ctx.beginPath();
      ctx.roundRect(fx, flowBtnY, flowW, flowH, 8);
      ctx.fill();

      ctx.strokeStyle = isSel ? (f.id === 'TWO_WAY' ? '#ef4444' : '#22c55e') : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = isSel ? '#ffffff' : '#cbd5e1';
      ctx.font = 'bold 12px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${f.icon} ${f.amh} (${f.eng})`, fx + flowW / 2, flowBtnY + 18);

      ctx.fillStyle = isSel ? (f.id === 'TWO_WAY' ? '#fca5a5' : '#86efac') : '#64748b';
      ctx.font = '9px "Chakra Petch", sans-serif';
      ctx.fillText(f.perk, fx + flowW / 2, flowBtnY + 31);

      this.titleHitboxes.push({
        id: `flow_${f.id}`,
        x: fx,
        y: flowBtnY,
        w: flowW,
        h: flowH
      });
    });

    // 3. Dynamic Mode Description Banner
    const descY = flowBtnY + flowH + 12;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
    ctx.beginPath();
    ctx.roundRect(boxX + 16, descY, boxW - 32, 28, 6);
    ctx.fill();

    const modeDescs: Record<RacingLimitsGameMode, string> = {
      CAREER: '🚕 Pick up passengers & reach the destination before time runs out',
      INFINITE: '♾️ Endless highway — dodge traffic & survive as far as you can',
      TIME_ATTACK: '⏱️ 60s countdown — close overtakes above 90 km/h add +2.5s',
      FREE_RIDE: '🕊️ Relaxed cruise across Addis Ababa — no timer, no crash fines'
    };

    ctx.fillStyle = '#facc15';
    ctx.font = '11px "Chakra Petch", "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(modeDescs[selectedMode], midX, descY + 18);

    // Economy Status
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💼 WALLET: ${walletBalance} ETB  |  👑 RECORD: ${highScore} ETB`, midX, boxY + boxH + 22);

    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 200);

    // 4. ACTION BUTTONS: [START DRIVING] & [GARAGE]
    const btnW = Math.min(230, (boxW - 16) / 2);
    const btnsY = boxY + boxH + 34;

    // [START DRIVING]
    const startHov = this.isHovered(midX - btnW - 8, btnsY, btnW, 44);
    ctx.save();
    if (startHov) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = `rgba(34, 197, 94, ${startHov ? 0.98 : pulse})`;
    ctx.beginPath();
    ctx.roundRect(midX - btnW - 8, startHov ? btnsY - 2 : btnsY, btnW, 44, 8);
    ctx.fill();
    ctx.strokeStyle = startHov ? '#86efac' : '#22c55e';
    ctx.lineWidth = startHov ? 2 : 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.fillText('▶ START RACE (ENTER)', midX - btnW / 2 - 8, (startHov ? btnsY - 2 : btnsY) + 27);
    ctx.restore();

    this.titleHitboxes.push({
      id: 'btn_start',
      x: midX - btnW - 8,
      y: btnsY,
      w: btnW,
      h: 44
    });

    // [GARAGE & UPGRADES]
    const garHov = this.isHovered(midX + 8, btnsY, btnW, 44);
    ctx.save();
    if (garHov) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = garHov ? '#0369a1' : '#0284c7';
    ctx.beginPath();
    ctx.roundRect(midX + 8, garHov ? btnsY - 2 : btnsY, btnW, 44, 8);
    ctx.fill();
    ctx.strokeStyle = garHov ? '#bae6fd' : '#38bdf8';
    ctx.lineWidth = garHov ? 2 : 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.fillText('🚗 GARAGE / ጋራዥ (G)', midX + btnW / 2 + 8, (garHov ? btnsY - 2 : btnsY) + 27);
    ctx.restore();

    this.titleHitboxes.push({
      id: 'btn_garage',
      x: midX + 8,
      y: btnsY,
      w: btnW,
      h: 44
    });

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

  private drawOverlayButtons(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number,
    buttons: { id: string; label: string; bg: string; border: string }[]
  ) {
    const btnW = 152;
    const btnH = 40;
    const gap = 12;
    const totalW = buttons.length * btnW + (buttons.length - 1) * gap;
    let x = centerX - totalW / 2;

    for (const btn of buttons) {
      const hovered = this.isHovered(x, y, btnW, btnH);
      const drawY = hovered ? y - 2 : y;
      ctx.save();
      if (hovered) {
        ctx.shadowColor = btn.border;
        ctx.shadowBlur = 14;
      }
      ctx.fillStyle = btn.bg;
      ctx.beginPath();
      ctx.roundRect(x, drawY, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = hovered ? '#ffffff' : btn.border;
      ctx.lineWidth = hovered ? 2 : 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, x + btnW / 2, drawY + 25);
      ctx.restore();

      this.overlayHitboxes.push({ id: btn.id, x, y, w: btnW, h: btnH });
      x += btnW + gap;
    }
  }

  public renderPauseScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    this.overlayHitboxes = [];
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 34px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ ጨዋታው ቆሟል • PAUSED', midX, midY - 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Chakra Petch", sans-serif';
    ctx.fillText('Press P or ESC to Resume  •  W Drive  •  S Brake/Reverse  •  ↑/↓ Pedals  •  A/D Steer  •  Shift Nitro  •  Space Horn', midX, midY - 22);

    this.drawOverlayButtons(ctx, midX, midY + 12, [
      { id: 'btn_resume', label: '▶ RESUME', bg: 'rgba(34, 197, 94, 0.85)', border: '#22c55e' },
      { id: 'btn_restart', label: '🔄 RESTART', bg: 'rgba(234, 179, 8, 0.25)', border: '#facc15' },
      { id: 'btn_garage', label: '🚗 GARAGE', bg: 'rgba(2, 132, 199, 0.85)', border: '#38bdf8' },
      { id: 'btn_menu', label: '🏠 MENU', bg: 'rgba(51, 65, 85, 0.85)', border: '#94a3b8' }
    ]);

    ctx.restore();
  }

  public renderGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, reason: string, score: number, highScore: number) {
    ctx.save();
    this.overlayHitboxes = [];
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#ef4444';
    ctx.font = '900 36px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ጨዋታው አልቋል! • SHIFT OVER', midX, midY - 75);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '17px "Chakra Petch", sans-serif';
    ctx.fillText(reason, midX, midY - 30);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.fillText(`EARNED THIS RUN: +${score} ETB (Saved to Wallet)`, midX, midY + 14);

    if (score >= highScore && score > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px "Chakra Petch", sans-serif';
      ctx.fillText('🏆 NEW HIGH SCORE RECORD! 🏆', midX, midY + 46);
    }

    this.drawOverlayButtons(ctx, midX, midY + 74, [
      { id: 'btn_restart', label: '🔄 TRY AGAIN', bg: 'rgba(34, 197, 94, 0.85)', border: '#22c55e' },
      { id: 'btn_garage', label: '🚗 GARAGE', bg: 'rgba(2, 132, 199, 0.85)', border: '#38bdf8' },
      { id: 'btn_menu', label: '🏠 MENU', bg: 'rgba(51, 65, 85, 0.85)', border: '#94a3b8' }
    ]);

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
    this.overlayHitboxes = [];
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#22c55e';
    ctx.font = '900 34px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isLastStage ? 'እንኳን ደስ አለዎት! • GRAND TOUR COMPLETE!' : 'ጣቢያው ደርሰዋል! • STAGE COMPLETE!', midX, midY - 82);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '18px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.fillText(`Completed Route: ${stage.nameAmharic} (${stage.name})`, midX, midY - 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px "Chakra Petch", sans-serif';
    ctx.fillText(`👥 Passengers Delivered: ${passengers}`, midX, midY + 4);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`💵 Fares Earned: +${fare} ETB (Saved to Wallet!)`, midX, midY + 36);

    const activeContract = garage.contracts.find(c => c.targetStageId === stage.id);
    if (activeContract) {
      ctx.fillStyle = activeContract.completed ? '#22c55e' : '#94a3b8';
      ctx.font = 'bold 14px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.fillText(`📋 ኮንትራት: ${activeContract.titleAmharic} — ${activeContract.completed ? `ተጠናቋል! (+${activeContract.rewardETB} ETB)` : 'በሂደት ላይ'}`, midX, midY + 68);
    }

    this.drawOverlayButtons(ctx, midX, midY + 96, [
      { id: 'btn_next', label: isLastStage ? '▶ PLAY AGAIN' : '▶ NEXT ROUTE', bg: 'rgba(34, 197, 94, 0.85)', border: '#22c55e' },
      { id: 'btn_garage', label: '🚗 GARAGE', bg: 'rgba(2, 132, 199, 0.85)', border: '#38bdf8' },
      { id: 'btn_menu', label: '🏠 MENU', bg: 'rgba(51, 65, 85, 0.85)', border: '#94a3b8' }
    ]);

    ctx.restore();
  }
}

export const ui = new UIManager();
