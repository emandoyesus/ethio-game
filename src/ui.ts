import type { Player, RouteStage } from './types';

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
  scale: number;
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
    highScore: number
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

    // High score badge
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px "Chakra Petch", sans-serif';
    ctx.fillText(`👑 RECORD: ${highScore} ETB`, 20, 64);

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
    ctx.fillText('FARES', statsX + 310, 48);

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

    // 3. Route Progress Bar (Track position)
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

    // Taxi pin on progress bar
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

    // Speedometer Card (Left)
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

    // Speed bar
    const speedRatio = player.speed / player.maxSpeed;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, dashY + 48, 136, 5);
    ctx.fillStyle = speedRatio > 0.8 ? '#ef4444' : '#38bdf8';
    ctx.fillRect(36, dashY + 48, 136 * speedRatio, 5);

    // Fuel Gauge (Center-Left)
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

    // Bunna Turbo Boost Indicator (Center)
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

    // Audio & Horn Hints (Right)
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

  public renderTitleScreen(ctx: CanvasRenderingContext2D, width: number, height: number, highScore: number) {
    ctx.save();

    ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const midX = width / 2;
    const midY = height / 2 - 20;

    // Ethiopian Flag Ribbon
    const ribW = Math.min(520, width * 0.85);
    const startRibX = midX - ribW / 2;
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(startRibX, midY - 145, ribW / 3, 6);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(startRibX + ribW / 3, midY - 145, ribW / 3, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(startRibX + (ribW / 3) * 2, midY - 145, ribW / 3, 6);

    // Big Amharic Title
    ctx.fillStyle = '#facc15';
    ctx.font = '900 46px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 16;
    ctx.fillText('አዲስ ታክሲ ራሽ', midX, midY - 82);

    // English Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 28px "Chakra Petch", sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText('ADDIS TAXI RUSH', midX, midY - 42);

    // Instructions Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
    ctx.beginPath();
    ctx.roundRect(midX - 270, midY - 10, 540, 195, 12);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px "Noto Sans Ethiopic", "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    const leftPad = midX - 240;
    ctx.fillText('🚕 Drive the iconic Blue Minibus Taxi across Addis Ababa', leftPad, midY + 24);
    ctx.fillText('👥 Pull over to the RIGHT curb to pick up passengers ("መገናኛ!")', leftPad, midY + 50);
    ctx.fillText('📢 Press H / SPACE to honk: clears cows, goats, and traffic!', leftPad, midY + 76);
    ctx.fillText('☕ Collect steaming Bunna (ቡና) cups for extreme Turbo Boost!', leftPad, midY + 102);
    ctx.fillText('🔥 Near-miss overtakes build Speed Combos for massive fares!', leftPad, midY + 128);
    ctx.fillText('⌨️ CONTROLS: Arrow Keys / WASD • H / SPACE: Horn • P: Pause', leftPad, midY + 154);

    if (highScore > 0) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`👑 BEST FARE RECORD: ${highScore} ETB`, midX, midY + 215);
    }

    // Pulsing Start Prompt
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER OR CLICK TO START DRIVING', midX, midY + 250);

    ctx.restore();
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
    ctx.fillText('⏸️ ጨዋታው ቆሟል • PAUSED', midX, midY - 40);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px "Chakra Petch", sans-serif';
    ctx.fillText('Press P, ESC, or CLICK to Resume', midX, midY + 15);
    ctx.fillText('Press R to Restart Route', midX, midY + 45);

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
    ctx.fillText(`TOTAL FARES COLLECTED: ${score} ETB`, midX, midY + 30);

    if (score >= highScore && score > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.fillText('🏆 NEW HIGH SCORE RECORD! 🏆', midX, midY + 65);
    }

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.font = 'bold 20px "Chakra Petch", sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO TRY AGAIN', midX, midY + 115);

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
    ctx.fillText(`💵 Fares Earned: ${fare} ETB`, midX, midY + 60);

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.font = 'bold 22px "Chakra Petch", sans-serif';
    ctx.fillText(isLastStage ? 'PRESS SPACE TO PLAY AGAIN' : 'PRESS SPACE TO START NEXT ROUTE', midX, midY + 120);

    ctx.restore();
  }
}

export const ui = new UIManager();
