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
    isMuted: boolean,
    highScore: number,
    walletBalance: number
  ) {
    ctx.save();

    // 1. Top Status Banner (Addis Blue & Gold Header)
    const headerH = 72;
    const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH);
    headerGrad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
    headerGrad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, width, headerH);

    // Ethiopian Tricolor Ribbon
    const ribW = width / 3;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(0, headerH - 4, ribW, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(ribW, headerH - 4, ribW, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(ribW * 2, headerH - 4, ribW, 4);

    // Route title & subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${stage.nameAmharic} (${stage.name})`, 20, 28);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Chakra Petch", sans-serif';
    ctx.fillText(stage.subtitle, 20, 48);

    // High score & Wallet badges
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px "Chakra Petch", sans-serif';
    ctx.fillText(`👑 BEST: ${highScore} ETB  |  💼 WALLET: ${walletBalance} ETB`, 20, 64);

    // Stats Grid on Right: Time, Passengers, Fare
    const statsX = Math.max(width - 450, width * 0.44);

    // Time Remaining
    const timeColor = timeLeft < 15 ? '#ef4444' : '#facc15';
    ctx.fillStyle = timeColor;
    ctx.font = 'bold 18px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${Math.max(0, Math.ceil(timeLeft))}s`, statsX + 50, 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('TIME LEFT', statsX + 50, 48);

    // Passengers Picked
    const passTargetMet = player.passengersOnBoard >= stage.targetPassengers;
    ctx.fillStyle = passTargetMet ? '#22c55e' : '#38bdf8';
    ctx.font = 'bold 18px "Chakra Petch", monospace';
    ctx.fillText(`👥 ${player.passengersOnBoard}/${stage.targetPassengers}`, statsX + 170, 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText(passTargetMet ? 'GOAL MET! ✔️' : 'PASSENGERS', statsX + 170, 48);

    // Fare Collected
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "Chakra Petch", monospace';
    ctx.fillText(`💵 ${player.fareCollected} ETB`, statsX + 310, 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('SHIFT EARNINGS', statsX + 310, 48);

    // 2. Combo / Multiplier Banner
    if (player.comboCount > 1) {
      ctx.save();
      const comboX = width / 2;
      const comboY = headerH + 38;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.9)';
      ctx.beginPath();
      ctx.roundRect(comboX - 110, comboY - 18, 220, 32, 16);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔥 SPEED COMBO x${player.comboCount}!`, comboX, comboY + 3);
      ctx.restore();
    }

    // 3. Route Progress Bar
    const progW = Math.min(280, width * 0.38);
    const progX = (width - progW) / 2;
    const progY = headerH + 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW, 10, 5);
    ctx.fill();

    const fillProg = Math.max(0, Math.min(1, progressRatio));
    const progFillGrad = ctx.createLinearGradient(progX, 0, progX + progW, 0);
    progFillGrad.addColorStop(0, '#16a34a');
    progFillGrad.addColorStop(0.5, '#facc15');
    progFillGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = progFillGrad;
    ctx.beginPath();
    ctx.roundRect(progX, progY, progW * fillProg, 10, 5);
    ctx.fill();

    const pinX = progX + progW * fillProg;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(pinX, progY + 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Bottom Dashboard Gauges (Speedometer, Fuel, Nitro)
    const speedKmh = Math.floor((player.speed / player.maxSpeed) * 160);
    const dashY = height - 76;

    // Speedometer Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(20, dashY, 170, 62, 8);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px "Chakra Petch", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${speedKmh}`, 36, dashY + 40);
    ctx.font = '12px "Chakra Petch", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('KM/H', 98, dashY + 38);

    const speedRatio = player.speed / player.maxSpeed;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, dashY + 48, 136, 5);
    ctx.fillStyle = speedRatio > 0.8 ? '#ef4444' : '#38bdf8';
    ctx.fillRect(36, dashY + 48, 136 * speedRatio, 5);

    // Fuel Gauge
    const fuelW = 150;
    const fuelX = 205;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(fuelX, dashY, fuelW, 62, 8);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const fuelRatio = Math.max(0, player.fuel / player.maxFuel);
    ctx.fillStyle = fuelRatio < 0.25 ? '#ef4444' : '#10b981';
    ctx.font = 'bold 12px "Chakra Petch", sans-serif';
    ctx.fillText(`⛽ FUEL: ${Math.round(fuelRatio * 100)}%`, fuelX + 16, dashY + 26);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(fuelX + 16, dashY + 36, fuelW - 32, 10);
    ctx.fillStyle = fuelRatio < 0.25 ? '#ef4444' : '#10b981';
    ctx.fillRect(fuelX + 16, dashY + 36, (fuelW - 32) * fuelRatio, 10);

    // Bunna Turbo Boost Indicator
    const nitroW = 175;
    const nitroX = fuelX + fuelW + 15;
    if (nitroX + nitroW < width - 110) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(nitroX, dashY, nitroW, 62, 8);
      ctx.fill();
      ctx.strokeStyle = player.boostRemaining > 0 ? '#f97316' : '#334155';
      ctx.lineWidth = player.boostRemaining > 0 ? 2.5 : 1;
      ctx.stroke();

      const boostRatio = player.boostRemaining / player.boostMax;
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.fillText(player.boostRemaining > 0 ? '☕ BUNNA NITRO (ON!)' : '☕ BUNNA READY', nitroX + 14, dashY + 26);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(nitroX + 14, dashY + 36, nitroW - 28, 10);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(nitroX + 14, dashY + 36, (nitroW - 28) * boostRatio, 10);
    }

    // Audio & Horn Hints
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`[M] ${isMuted ? 'UNMUTE 🔇' : 'SOUND 🔊'} | [H / SPACE] HORN 📢 | [P] PAUSE ⏸️`, width - 20, height - 16);

    // 5. Render Floating Texts
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

  public renderTitleScreen(ctx: CanvasRenderingContext2D, width: number, height: number, highScore: number, walletBalance: number) {
    ctx.save();
    this.garageHitboxes = [];

    ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
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

    // Big Amharic Title
    ctx.fillStyle = '#facc15';
    ctx.font = '900 46px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 16;
    ctx.fillText('አዲስ ታክሲ ራሽ', midX, midY - 84);

    // English Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText('ADDIS TAXI RUSH', midX, midY - 44);

    // Selected vehicle badge
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

    // Wallet & Best Stats
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 15px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`💼 WALLET: ${walletBalance} ETB  |  👑 RECORD: ${highScore} ETB`, midX, midY + 195);

    // Pulsing Drive & Garage Buttons
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

    // Background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const vehicleKeys = Object.keys(garage.vehicles) as (keyof typeof garage.vehicles)[];
    const currentId = vehicleKeys[activeVehicleIndex % vehicleKeys.length];
    const vehicle = garage.vehicles[currentId];

    // 1. Header with Ethiopian tricolor and Wallet balance
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

    // 2. Vehicle Selector Tabs
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

      // Register Hitbox
      this.garageHitboxes.push({
        id: `tab_${key}`,
        x: tabX,
        y: tabsY,
        w: tabW,
        h: 36,
        action: () => {}
      });
    });

    // 3. Main Stage: Left = Vehicle Preview & Stats, Right = Upgrades Panel
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

    // Vehicle Name & Tagline
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

    // Big Vehicle Sprite Drawing
    const previewSprite = sprites.get(`PLAYER_${vehicle.id}_STRAIGHT`);
    if (previewSprite) {
      const prevScale = Math.min(1.4, (colW - 80) / previewSprite.width);
      const pw = previewSprite.width * prevScale;
      const ph = previewSprite.height * prevScale;
      const px = 24 + colW / 2 - pw / 2;
      const py = mainY + 85;
      ctx.drawImage(previewSprite.canvas, px, py, pw, ph);
    }

    // Vehicle Base Stat Bars
    const statY = mainY + mainH - 120;
    this.renderStatBar(ctx, 44, statY, colW - 88, 'SPEED (ፍጥነት)', vehicle.baseMaxSpeed / 16000, '#38bdf8');
    this.renderStatBar(ctx, 44, statY + 28, colW - 88, 'HANDLING (መሪ)', vehicle.baseTurnSpeed / 4.2, '#22c55e');
    this.renderStatBar(ctx, 44, statY + 56, colW - 88, 'FUEL CAPACITY (ታንከር)', vehicle.baseMaxFuel / 160, '#facc15');

    // Select / Unlock Action Button
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

    // Upgrades list
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

    // 4. Bottom Navigation Bar
    const btmY = height - 52;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, btmY, width, 52);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◀ / ▶ : Switch Vehicle  |  G / ESC : Close Garage', 24, btmY + 30);

    // [BACK TO TITLE] & [START DRIVING] buttons
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

    // Icon & Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${u.icon} ${u.nameAmh} (${u.name})`, x + 12, y + 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.fillText(u.desc, x + 12, y + 42);

    // Star levels
    const stars = ['★', '★', '★'].map((_, i) => (i < level ? '★' : '☆')).join(' ');
    ctx.fillStyle = '#facc15';
    ctx.font = '16px monospace';
    ctx.fillText(stars, x + w - 195, y + 34);

    // Upgrade Button
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
