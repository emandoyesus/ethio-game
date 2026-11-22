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

export class UIManager {
  private floatingTexts: FloatingText[] = [];
  public garageHitboxes: GarageButtonHitbox[] = [];

  public addFloatingText(text: string, x: number, y: number, color: string = '#facc15') {
    this.floatingTexts.push({
      text,
      x,
      y,
      alpha: 1.0,
      color,
      scale: 1.25,
      vy: -1.6
    });
  }

  public update(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= 0.016 * dt * 60;
      if (ft.scale > 1.0) {
        ft.scale -= 0.03 * dt * 60;
      }
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
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

    // 1. Sleek Top Status Bar (Transparent dark gradient with no overlap)
    const headerH = 54;
    const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH + 20);
    headerGrad.addColorStop(0, 'rgba(10, 15, 26, 0.95)');
    headerGrad.addColorStop(0.7, 'rgba(10, 15, 26, 0.7)');
    headerGrad.addColorStop(1, 'rgba(10, 15, 26, 0)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, width, headerH + 20);

    // Subtle Ethiopian flag hairline ribbon across top
    const ribW = width / 3;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, 0, ribW, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ribW, 0, ribW, 3);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ribW * 2, 0, ribW, 3);

    // Left: Route Title Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(16, 10, 260, 36, 6);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${stage.nameAmharic}`, 26, 26);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Chakra Petch", sans-serif';
    ctx.fillText(`${stage.name}  |  💼 ${walletBalance} ETB  |  👑 ${highScore}`, 26, 39);

    // Center: Modern Slim Progress Bar
    const progW = Math.min(260, width * 0.28);
    const progX = (width - progW) / 2;
    const progY = 22;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, 8, 4);
    ctx.fill();

    const fillProg = Math.max(0, Math.min(1, progressRatio));
    const progGrad = ctx.createLinearGradient(progX, 0, progX + progW, 0);
    progGrad.addColorStop(0, '#10b981');
    progGrad.addColorStop(0.5, '#facc15');
    progGrad.addColorStop(1, '#ef4444');
    ctx.fillStyle = progGrad;
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * fillProg, 8, 4);
    ctx.fill();

    // Destination Pin
    const pinX = progX + progW * fillProg;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pinX, progY + 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Right: Essential Objectives (Shifted left of the arcade buttons so there is ZERO overlap!)
    const statsX = width - 360;

    // Time Left Badge
    const timeColor = timeLeft < 15 ? '#ef4444' : '#facc15';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(statsX - 85, 10, 75, 36, 6);
    ctx.fill();
    ctx.strokeStyle = timeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = timeColor;
    ctx.font = 'bold 15px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))}s`, statsX - 47, 28);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('TIME', statsX - 47, 39);

    // Passengers Delivered Badge
    const passTargetMet = player.passengersOnBoard >= stage.targetPassengers;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(statsX, 10, 85, 36, 6);
    ctx.fill();
    ctx.strokeStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`👥 ${player.passengersOnBoard}/${stage.targetPassengers}`, statsX + 42, 27);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText(passTargetMet ? 'GOAL MET' : 'PASSENGERS', statsX + 42, 39);

    // Fare Earned Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(statsX + 95, 10, 105, 36, 6);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px "Chakra Petch", monospace';
    ctx.fillText(`💵 ${player.fareCollected} ETB`, statsX + 147, 27);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('SHIFT FARE', statsX + 147, 39);

    // 2. Active Speed Combo Floating Pill
    if (player.comboCount > 1) {
      ctx.save();
      const comboX = width / 2;
      const comboY = headerH + 34;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.9)';
      ctx.beginPath();
      ctx.roundRect(comboX - 100, comboY - 16, 200, 30, 15);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 SPEED COMBO x${player.comboCount}!`, comboX, comboY + 4);
      ctx.restore();
    }

    // 3. REALISTIC VEHICULAR COCKPIT DASHBOARD (Center Bottom)
    this.renderRealisticCockpit(ctx, width, height, player);

    // 4. Render Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${Math.round(20 * ft.scale)}px "Noto Sans Ethiopic", "Chakra Petch", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  // Realistic Cockpit Instrument Binnacle
  private renderRealisticCockpit(ctx: CanvasRenderingContext2D, width: number, height: number, player: Player) {
    ctx.save();

    const speedKmh = Math.floor((player.speed / player.maxSpeed) * 165);
    const rpmRatio = Math.min(1, Math.max(0.12, player.rpm / 7500));

    // Dashboard Binnacle Dimensions
    const binnacleW = Math.min(680, width * 0.78);
    const binnacleH = 82;
    const binnacleX = (width - binnacleW) / 2;
    const binnacleY = height - binnacleH - 12;

    // Dark brushed carbon cockpit frame with glass reflection
    const dashGrad = ctx.createLinearGradient(0, binnacleY, 0, binnacleY + binnacleH);
    dashGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    dashGrad.addColorStop(0.5, 'rgba(10, 15, 28, 0.96)');
    dashGrad.addColorStop(1, 'rgba(4, 7, 14, 0.98)');
    ctx.fillStyle = dashGrad;
    ctx.beginPath();
    ctx.roundRect(binnacleX, binnacleY, binnacleW, binnacleH, 14);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle glass specular shine on top rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(binnacleX + 16, binnacleY + 1);
    ctx.lineTo(binnacleX + binnacleW - 16, binnacleY + 1);
    ctx.stroke();

    // 1. LEFT DIAL: Speedometer Dial & Digital LCD
    const spdX = binnacleX + 75;
    const spdY = binnacleY + 44;

    // Outer Speedometer Arc
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(spdX, spdY, 32, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Active Speed Arc Fill
    const speedRatio = Math.min(1, player.speed / player.maxSpeed);
    const spdGrad = ctx.createLinearGradient(spdX - 32, spdY, spdX + 32, spdY);
    spdGrad.addColorStop(0, '#38bdf8');
    spdGrad.addColorStop(0.7, '#facc15');
    spdGrad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = spdGrad;
    ctx.beginPath();
    ctx.arc(spdX, spdY, 32, Math.PI * 0.75, Math.PI * (0.75 + speedRatio * 1.5));
    ctx.stroke();

    // Digital Speed Number
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speedKmh}`, spdX, spdY + 5);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('KM/H', spdX, spdY + 16);

    // 2. CENTER SECTION: Gear Selector, Turn Signals, Fuel, and Boost
    const midX = binnacleX + binnacleW / 2;

    // Turn Signals (blinking green arrows)
    const isLeftSig = player.turnSignal === 'left' && Math.floor(Date.now() / 350) % 2 === 0;
    const isRightSig = player.turnSignal === 'right' && Math.floor(Date.now() / 350) % 2 === 0;

    ctx.fillStyle = isLeftSig ? '#22c55e' : 'rgba(34, 197, 94, 0.15)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◀', midX - 90, binnacleY + 24);

    ctx.fillStyle = isRightSig ? '#22c55e' : 'rgba(34, 197, 94, 0.15)';
    ctx.fillText('▶', midX + 90, binnacleY + 24);

    // Automatic Gear Indicator
    ctx.font = 'bold 11px "Chakra Petch", monospace';

    [-45, -22, 0, 22, 45].forEach((offset, idx) => {
      const gLabel = idx === 0 ? 'P' : idx === 1 ? 'R' : idx === 2 ? 'N' : idx === 3 ? 'D' : `${player.gear}`;
      const isActive = (idx === 3 && player.speed >= 20) || (idx === 2 && player.speed < 20);

      ctx.fillStyle = isActive ? '#22c55e' : 'rgba(148, 163, 184, 0.4)';
      ctx.fillText(gLabel, midX + offset, binnacleY + 24);
    });

    // Dual Slim Gauges: Fuel (Left) & Bunna Turbo (Right)
    const gaugeW = 120;
    const gaugeY = binnacleY + 48;

    // Fuel Gauge
    const fuelRatio = Math.max(0, Math.min(1, player.fuel / player.maxFuel));
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⛽ FUEL`, midX - gaugeW - 10, gaugeY - 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX - gaugeW - 10, gaugeY, gaugeW, 8);
    ctx.fillStyle = fuelRatio < 0.25 ? '#ef4444' : '#10b981';
    ctx.fillRect(midX - gaugeW - 10, gaugeY, gaugeW * fuelRatio, 8);

    // Bunna Boost Gauge
    const boostRatio = Math.max(0, Math.min(1, player.boostRemaining / player.boostMax));
    ctx.fillStyle = '#f97316';
    ctx.font = '9px "Chakra Petch", sans-serif';
    ctx.fillText(`☕ BUNNA TURBO`, midX + 10, gaugeY - 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX + 10, gaugeY, gaugeW, 8);
    ctx.fillStyle = player.boostRemaining > 0 ? '#ff5500' : '#f97316';
    ctx.fillRect(midX + 10, gaugeY, gaugeW * boostRatio, 8);

    // 3. RIGHT DIAL: Tachometer (RPM Dial)
    const rpmX = binnacleX + binnacleW - 75;
    const rpmY = binnacleY + 44;

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(rpmX, rpmY, 32, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Active RPM Arc
    const rpmGrad = ctx.createLinearGradient(rpmX - 32, rpmY, rpmX + 32, rpmY);
    rpmGrad.addColorStop(0, '#38bdf8');
    rpmGrad.addColorStop(0.7, '#facc15');
    rpmGrad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = rpmGrad;
    ctx.beginPath();
    ctx.arc(rpmX, rpmY, 32, Math.PI * 0.75, Math.PI * (0.75 + rpmRatio * 1.5));
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 18px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(player.rpm)}`, rpmX, rpmY + 5);
    ctx.fillStyle = rpmRatio > 0.85 ? '#ef4444' : '#94a3b8';
    ctx.font = '8px "Chakra Petch", sans-serif';
    ctx.fillText('RPM', rpmX, rpmY + 16);

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

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(isLastStage ? 'PRESS SPACE TO PLAY AGAIN | G FOR GARAGE' : 'PRESS SPACE FOR NEXT ROUTE | G FOR GARAGE', midX, midY + 120);

    ctx.restore();
  }
}

export const ui = new UIManager();
