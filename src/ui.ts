import type { Player, RouteStage } from './types';

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
  vy: number;
}

export class UIManager {
  private floatingTexts: FloatingText[] = [];

  public addFloatingText(text: string, x: number, y: number, color: string = '#facc15') {
    this.floatingTexts.push({
      text,
      x,
      y,
      alpha: 1.0,
      color,
      vy: -1.4
    });
  }

  public update(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= 0.015 * dt * 60;
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
    isMuted: boolean
  ) {
    ctx.save();

    // 1. Top Status Banner (Addis Blue & Gold Header)
    const headerH = 68;
    const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH);
    headerGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
    headerGrad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, width, headerH);

    // Ethiopian Tricolor Ribbon below header
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

    // Stats Grid on Right: Time, Passengers, Fare
    const statsX = Math.max(width - 440, width * 0.45);

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
    ctx.fillText('PASSENGERS', statsX + 170, 48);

    // Fare Collected
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "Chakra Petch", monospace';
    ctx.fillText(`💵 ${player.fareCollected} ETB`, statsX + 310, 32);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('FARES', statsX + 310, 48);

    // 2. Route Progress Bar (Track position)
    const progW = Math.min(300, width * 0.4);
    const progX = (width - progW) / 2;
    const progY = headerH + 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
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

    // Taxi pin on progress bar
    const pinX = progX + progW * fillProg;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(pinX, progY + 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Bottom Dashboard Gauges (Speedometer, Fuel, Nitro)
    const speedKmh = Math.floor((player.speed / player.maxSpeed) * 160);
    const dashY = height - 75;

    // Speedometer Card (Left)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(20, dashY, 170, 60, 8);
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

    // Speed bar
    const speedRatio = player.speed / player.maxSpeed;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, dashY + 48, 136, 5);
    ctx.fillStyle = speedRatio > 0.8 ? '#ef4444' : '#38bdf8';
    ctx.fillRect(36, dashY + 48, 136 * speedRatio, 5);

    // Fuel Gauge (Center-Left)
    const fuelW = 150;
    const fuelX = 205;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(fuelX, dashY, fuelW, 60, 8);
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

    // Bunna Turbo Boost Indicator (Center)
    const nitroW = 170;
    const nitroX = fuelX + fuelW + 15;
    if (nitroX + nitroW < width - 110) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(nitroX, dashY, nitroW, 60, 8);
      ctx.fill();
      ctx.strokeStyle = player.boostRemaining > 0 ? '#f97316' : '#334155';
      ctx.lineWidth = player.boostRemaining > 0 ? 2 : 1;
      ctx.stroke();

      const boostRatio = player.boostRemaining / player.boostMax;
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 12px "Chakra Petch", sans-serif';
      ctx.fillText(player.boostRemaining > 0 ? '☕ BUNNA BOOST!' : '☕ BUNNA READY', nitroX + 14, dashY + 26);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(nitroX + 14, dashY + 36, nitroW - 28, 10);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(nitroX + 14, dashY + 36, (nitroW - 28) * boostRatio, 10);
    }

    // Audio & Horn Hints (Right)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Chakra Petch", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`[M] ${isMuted ? 'UNMUTE 🔇' : 'SOUND 🔊'} | [H / SPACE] HORN 📢`, width - 20, height - 16);

    // 4. Render Floating Texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 20px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  public renderTitleScreen(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();

    // Dark backdrop overlay
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // Title Card
    const midX = width / 2;
    const midY = height / 2 - 20;

    // Ethiopian Flag Ribbon
    const ribW = Math.min(500, width * 0.8);
    const startRibX = midX - ribW / 2;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(startRibX, midY - 140, ribW / 3, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(startRibX + ribW / 3, midY - 140, ribW / 3, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(startRibX + (ribW / 3) * 2, midY - 140, ribW / 3, 6);

    // Big Amharic Title
    ctx.fillStyle = '#facc15';
    ctx.font = '900 44px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 14;
    ctx.fillText('አዲስ ታክሲ ራሽ', midX, midY - 80);

    // English Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText('ADDIS TAXI RUSH', midX, midY - 40);

    // Instructions Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(midX - 260, midY - 10, 520, 190, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    const leftPad = midX - 230;
    ctx.fillText('🚕 Drive the iconic Blue Minibus Taxi across Addis Ababa', leftPad, midY + 25);
    ctx.fillText('👥 Pull over to the RIGHT curb to pick up passengers ("መገናኛ!")', leftPad, midY + 52);
    ctx.fillText('⚠️ Dodge potholes (ጉድጓድ), goats & cows, and heavy Isuzus', leftPad, midY + 79);
    ctx.fillText('☕ Collect steaming Bunna (ቡና) cups for extreme Turbo Boost!', leftPad, midY + 106);
    ctx.fillText('⌨️ CONTROLS: Arrow Keys / WASD • SPACE: Horn • SHIFT: Nitro', leftPad, midY + 133);
    ctx.fillText('📱 TOUCH: On-screen buttons active on mobile & tablet screens', leftPad, midY + 158);

    // Pulsing Start Prompt
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER OR CLICK TO START DRIVING', midX, midY + 230);

    ctx.restore();
  }

  public renderGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, reason: string, score: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2;

    ctx.fillStyle = '#ef4444';
    ctx.font = '900 38px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ጨዋታው አልቋል! • SHIFT OVER', midX, midY - 60);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '18px "Chakra Petch", sans-serif';
    ctx.fillText(reason, midX, midY - 15);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px "Chakra Petch", sans-serif';
    ctx.fillText(`TOTAL FARES COLLECTED: ${score} ETB`, midX, midY + 35);

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO TRY AGAIN', midX, midY + 95);

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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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
    ctx.fillText(`💵 Fares Earned: ${fare} ETB`, midX, midY + 60);

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(isLastStage ? 'PRESS SPACE TO PLAY AGAIN' : 'PRESS SPACE TO START NEXT ROUTE', midX, midY + 120);

    ctx.restore();
  }
}

export const ui = new UIManager();
