// Procedural Vector Sprite Generator for Addis Taxi Rush
// Pre-renders crisp offscreen canvas sprites for high-performance 60fps rendering

export interface RenderableSprite {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  anchorX: number; // 0..1
  anchorY: number; // 0..1
}

class SpriteRegistry {
  private cache: Map<string, RenderableSprite> = new Map();

  public get(key: string): RenderableSprite | undefined {
    return this.cache.get(key);
  }

  public init() {
    this.createPlayerSprites();
    this.createTrafficSprites();
    this.createObstaclesAndCollectibles();
    this.createScenerySprites();
  }

  private createPlayerSprites() {
    const directions: ('straight' | 'left' | 'right')[] = ['straight', 'left', 'right'];

    // 1. Minibus Taxi
    directions.forEach(dir => {
      [false, true].forEach(boost => {
        [false, true].forEach(brake => {
          const key = `PLAYER_MINIBUS_${dir.toUpperCase()}${boost ? '_BOOST' : ''}${brake ? '_BRAKE' : ''}`;
          const sprite = this.drawMinibus(dir, boost, brake);
          this.cache.set(key, sprite);
          // Legacy alias
          this.cache.set(`PLAYER_TAXI_${dir.toUpperCase()}${boost ? '_BOOST' : ''}${brake ? '_BRAKE' : ''}`, sprite);
        });
      });
    });

    // 2. Lada Taxi (Player Version)
    directions.forEach(dir => {
      [false, true].forEach(boost => {
        [false, true].forEach(brake => {
          const key = `PLAYER_LADA_${dir.toUpperCase()}${boost ? '_BOOST' : ''}${brake ? '_BRAKE' : ''}`;
          this.cache.set(key, this.drawLadaPlayer(dir, boost, brake));
        });
      });
    });

    // 3. Bajaj Drifter (Player Version)
    directions.forEach(dir => {
      [false, true].forEach(boost => {
        [false, true].forEach(brake => {
          const key = `PLAYER_BAJAJ_${dir.toUpperCase()}${boost ? '_BOOST' : ''}${brake ? '_BRAKE' : ''}`;
          this.cache.set(key, this.drawBajajPlayer(dir, boost, brake));
        });
      });
    });

    // 4. Isuzu Heavy Truck (Player Version)
    directions.forEach(dir => {
      [false, true].forEach(boost => {
        [false, true].forEach(brake => {
          const key = `PLAYER_ISUZU_${dir.toUpperCase()}${boost ? '_BOOST' : ''}${brake ? '_BRAKE' : ''}`;
          this.cache.set(key, this.drawIsuzuPlayer(dir, boost, brake));
        });
      });
    });
  }

  private drawMinibus(direction: 'straight' | 'left' | 'right', boost: boolean, brake: boolean): RenderableSprite {
    const w = 240;
    const h = 200;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    const tilt = direction === 'left' ? -0.08 : direction === 'right' ? 0.08 : 0;
    const shiftX = direction === 'left' ? -8 : direction === 'right' ? 8 : 0;

    ctx.save();
    ctx.translate(w / 2 + shiftX, h - 30);
    ctx.rotate(tilt);

    // Boost flames
    if (boost) {
      ctx.save();
      [-40, 40].forEach(exX => {
        ctx.fillStyle = '#ff3b00';
        ctx.beginPath();
        ctx.moveTo(exX - 9, 12);
        ctx.lineTo(exX, 38);
        ctx.lineTo(exX + 9, 12);
        ctx.fill();

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.moveTo(exX - 5, 12);
        ctx.lineTo(exX, 26);
        ctx.lineTo(exX + 5, 12);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(exX, 14, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 85, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-78, -5, 26, 26);
    ctx.fillRect(52, -5, 26, 26);
    // Hubcaps
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(-65, 8, 6, 0, Math.PI * 2);
    ctx.arc(65, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bumper
    ctx.fillStyle = '#2b2b2b';
    ctx.roundRect(-76, -10, 152, 18, 4);
    ctx.fill();

    // Mud flaps with Ethiopian flag stripes
    [-74, 56].forEach(fx => {
      ctx.fillStyle = '#078930';
      ctx.fillRect(fx, 4, 18, 4);
      ctx.fillStyle = '#fcdd09';
      ctx.fillRect(fx, 8, 18, 4);
      ctx.fillStyle = '#da121a';
      ctx.fillRect(fx, 12, 18, 4);
    });

    // Lower Body (Ethiopian Taxi Blue)
    const bodyGrad = ctx.createLinearGradient(-75, -70, 75, -10);
    bodyGrad.addColorStop(0, '#0052a5');
    bodyGrad.addColorStop(0.5, '#006edc');
    bodyGrad.addColorStop(1, '#004085');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-75, -80, 150, 72, [8, 8, 4, 4]);
    ctx.fill();

    // White Top Half
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.roundRect(-72, -145, 144, 70, [18, 18, 0, 0]);
    ctx.fill();

    // Roof Rack
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-60, -150);
    ctx.lineTo(60, -150);
    ctx.moveTo(-50, -145);
    ctx.lineTo(-50, -150);
    ctx.moveTo(0, -145);
    ctx.lineTo(0, -150);
    ctx.moveTo(50, -145);
    ctx.lineTo(50, -150);
    ctx.stroke();

    // Luggage
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-45, -164, 30, 14);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-10, -162, 28, 12);
    ctx.fillStyle = '#059669';
    ctx.fillRect(22, -160, 24, 10);

    // Rear Window
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-58, -135, 116, 52, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(-52, -132);
    ctx.lineTo(-10, -132);
    ctx.lineTo(-35, -88);
    ctx.lineTo(-52, -88);
    ctx.fill();

    // Rear Wiper
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -88);
    ctx.lineTo(15, -110);
    ctx.stroke();

    // Rear Tail Lights
    if (brake) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff1144';
      ctx.fillRect(-70, -68, 16, 32);
      ctx.fillRect(54, -68, 16, 32);
      ctx.fillRect(-16, -142, 32, 6);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-70, -68, 16, 26);
      ctx.fillRect(54, -68, 16, 26);
    }

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-70, -42, 16, 12);
    ctx.fillRect(54, -42, 16, 12);

    ctx.fillStyle = '#fff';
    ctx.fillRect(-70, -30, 16, 8);
    ctx.fillRect(54, -30, 16, 8);

    // License Plate
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-28, -32, 56, 18);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-28, -32, 56, 18);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('3 • AA 778', 0, -20);

    // Weyala hanging out
    ctx.save();
    const weyalaX = direction === 'left' ? -68 : 68;
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(weyalaX, -95, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(weyalaX - 7, -104, 14, 6);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(weyalaX, -88);
    ctx.lineTo(weyalaX + (direction === 'left' ? -14 : 14), -105);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawLadaPlayer(direction: 'straight' | 'left' | 'right', boost: boolean, brake: boolean): RenderableSprite {
    const w = 220;
    const h = 170;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    const tilt = direction === 'left' ? -0.1 : direction === 'right' ? 0.1 : 0;
    const shiftX = direction === 'left' ? -9 : direction === 'right' ? 9 : 0;

    ctx.save();
    ctx.translate(w / 2 + shiftX, h - 25);
    ctx.rotate(tilt);

    // Boost flames
    if (boost) {
      ctx.save();
      const exX = 36;
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.moveTo(exX - 8, 12);
      ctx.lineTo(exX, 42);
      ctx.lineTo(exX + 8, 12);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.moveTo(exX - 4, 12);
      ctx.lineTo(exX, 28);
      ctx.lineTo(exX + 4, 12);
      ctx.fill();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 75, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-68, -4, 22, 22);
    ctx.fillRect(46, -4, 22, 22);

    // Lower Body (Vibrant Blue Lada)
    const bodyGrad = ctx.createLinearGradient(-66, -60, 66, -10);
    bodyGrad.addColorStop(0, '#1d4ed8');
    bodyGrad.addColorStop(0.5, '#2563eb');
    bodyGrad.addColorStop(1, '#1e40af');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-66, -62, 132, 54, 4);
    ctx.fill();

    // White Top / Roof
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-54, -108, 108, 50, [10, 10, 0, 0]);
    ctx.fill();

    // Rear window
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-48, -102, 96, 38);
    // Reflection
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(-44, -100);
    ctx.lineTo(-8, -100);
    ctx.lineTo(-24, -68);
    ctx.lineTo(-44, -68);
    ctx.fill();

    // Taxi Roof Sign
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-18, -124, 36, 14);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, -114);

    // Chrome Bumper
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-68, -12, 136, 12);

    // Taillights
    if (brake) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff1144';
      ctx.fillRect(-62, -54, 14, 32);
      ctx.fillRect(48, -54, 14, 32);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-62, -54, 14, 26);
      ctx.fillRect(48, -54, 14, 26);
    }

    // Plate
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-22, -32, 44, 16);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1 • AA 55', 0, -21);

    ctx.restore();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawBajajPlayer(direction: 'straight' | 'left' | 'right', boost: boolean, brake: boolean): RenderableSprite {
    const w = 180;
    const h = 180;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    const tilt = direction === 'left' ? -0.14 : direction === 'right' ? 0.14 : 0;
    const shiftX = direction === 'left' ? -10 : direction === 'right' ? 10 : 0;

    ctx.save();
    ctx.translate(w / 2 + shiftX, h - 25);
    ctx.rotate(tilt);

    // Boost flames
    if (boost) {
      ctx.save();
      const exX = -28;
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.moveTo(exX - 6, 10);
      ctx.lineTo(exX, 36);
      ctx.lineTo(exX + 6, 10);
      ctx.fill();
      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.moveTo(exX - 3, 10);
      ctx.lineTo(exX, 24);
      ctx.lineTo(exX + 3, 10);
      ctx.fill();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 54, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-46, -4, 16, 20);
    ctx.fillRect(30, -4, 16, 20);

    // Body (Vibrant Yellow)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(-44, -74, 88, 66, 6);
    ctx.fill();

    // Black Canvas Canopy
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-42, -135, 84, 66, [14, 14, 0, 0]);
    ctx.fill();

    // Rear Canvas Window
    ctx.fillStyle = '#475569';
    ctx.fillRect(-26, -120, 52, 30);

    // Spare tire mounted on back
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -42, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -42, 7, 0, Math.PI * 2);
    ctx.fill();

    // Rear round lights
    if (brake) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff1144';
      ctx.beginPath();
      ctx.arc(-32, -24, 8, 0, Math.PI * 2);
      ctx.arc(32, -24, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-32, -24, 6, 0, Math.PI * 2);
      ctx.arc(32, -24, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawIsuzuPlayer(direction: 'straight' | 'left' | 'right', boost: boolean, brake: boolean): RenderableSprite {
    const w = 280;
    const h = 280;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    const tilt = direction === 'left' ? -0.05 : direction === 'right' ? 0.05 : 0;
    const shiftX = direction === 'left' ? -6 : direction === 'right' ? 6 : 0;

    ctx.save();
    ctx.translate(w / 2 + shiftX, h - 30);
    ctx.rotate(tilt);

    // Exhaust smoke / boost flames
    if (boost) {
      ctx.save();
      const exX = -94;
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.moveTo(exX - 8, -180);
      ctx.lineTo(exX, -225);
      ctx.lineTo(exX + 8, -180);
      ctx.fill();
      ctx.restore();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 105, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Twin Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-96, -10, 34, 34);
    ctx.fillRect(62, -10, 34, 34);

    // Wooden Cargo Bed
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-94, -175, 188, 150);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    for (let y = -155; y < -35; y += 22) {
      ctx.beginPath();
      ctx.moveTo(-94, y);
      ctx.lineTo(94, y);
      ctx.stroke();
    }

    // Traditional Ethiopian stripes
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-94, -75, 188, 8);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-94, -67, 188, 8);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-94, -59, 188, 8);

    // Amharic motto
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('እግዚአብሔር ይመስገን', 0, -90);

    // Exhaust Pipe
    ctx.fillStyle = '#475569';
    ctx.fillRect(-100, -190, 8, 95);

    // Bumper & Taillights
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-96, -26, 192, 20);

    if (brake) {
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff1144';
      ctx.fillRect(-82, -23, 28, 14);
      ctx.fillRect(54, -23, 28, 14);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-82, -23, 28, 14);
      ctx.fillRect(54, -23, 28, 14);
    }

    ctx.restore();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private createTrafficSprites() {
    this.cache.set('TRAFFIC_LADA', this.drawLada());
    this.cache.set('TRAFFIC_BAJAJ', this.drawBajaj());
    this.cache.set('TRAFFIC_ISUZU', this.drawIsuzu());
  }

  private drawLada(): RenderableSprite {
    return this.drawLadaPlayer('straight', false, false);
  }

  private drawBajaj(): RenderableSprite {
    return this.drawBajajPlayer('straight', false, false);
  }

  private drawIsuzu(): RenderableSprite {
    return this.drawIsuzuPlayer('straight', false, false);
  }

  private createObstaclesAndCollectibles() {
    this.cache.set('OBSTACLE_POTHOLE', this.drawPothole());
    this.cache.set('OBSTACLE_GOAT', this.drawGoat());
    this.cache.set('OBSTACLE_COW', this.drawCow());

    const dests = [
      { key: 'PASSENGER', text: 'መገናኛ!' },
      { key: 'PASSENGER_BOLE', text: 'ቦሌ!' },
      { key: 'PASSENGER_MERKATO', text: 'መርካቶ!' },
      { key: 'PASSENGER_PIAZZA', text: 'ፒያሳ!' },
      { key: 'PASSENGER_SARIS', text: 'ሳሪስ!' },
      { key: 'PASSENGER_KAZANCHIS', text: 'ካዛንቺስ!' }
    ];
    dests.forEach(d => {
      this.cache.set(d.key, this.drawPassenger(d.text));
    });

    this.cache.set('ITEM_BIRR', this.drawBirr());
    this.cache.set('ITEM_BUNNA', this.drawBunna());
    this.cache.set('ITEM_FUEL', this.drawFuel());
    this.cache.set('CHECKPOINT_GATE', this.drawCheckpointGate());
    this.cache.set('SCENERY_TAXI_SIGN', this.drawTaxiSign());
  }

  private drawPothole(): RenderableSprite {
    const w = 120;
    const h = 60;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(2, 2, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.beginPath();
    ctx.ellipse(4, 3, 20, 6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawGoat(): RenderableSprite {
    const w = 110;
    const h = 100;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 15);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    [-18, -8, 8, 18].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -25);
      ctx.lineTo(x, 4);
      ctx.stroke();
    });

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -32, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(24, -46, 12, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -52);
    ctx.quadraticCurveTo(14, -66, 10, -60);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawCow(): RenderableSprite {
    const w = 180;
    const h = 140;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#573418';
    ctx.lineWidth = 6;
    [-35, -20, 20, 35].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -35);
      ctx.lineTo(x, 8);
      ctx.stroke();
    });

    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -50, 48, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-12, -78, 16, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(48, -64, 18, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(42, -74);
    ctx.quadraticCurveTo(38, -98, 48, -104);
    ctx.moveTo(50, -74);
    ctx.quadraticCurveTo(56, -98, 66, -102);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawPassenger(destinationText: string): RenderableSprite {
    const w = 150;
    const h = 160;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(45, h - 20);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-5, -35);
    ctx.lineTo(-5, 8);
    ctx.moveTo(5, -35);
    ctx.lineTo(5, 8);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-14, -75, 28, 44, 4);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-14, -40, 28, 3);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-14, -37, 28, 3);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-14, -34, 28, 3);

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, -85, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -70);
    ctx.lineTo(24, -98);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, -140, 85, 32, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(destinationText, 52, -119);

    return { canvas: cvs, width: w, height: h, anchorX: 0.35, anchorY: 0.85 };
  }

  private drawBirr(): RenderableSprite {
    const w = 80;
    const h = 80;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 16px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ብር', 0, 2);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawBunna(): RenderableSprite {
    const w = 90;
    const h = 100;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -30, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3f1f14';
    ctx.beginPath();
    ctx.arc(0, -26, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(-5, -60, 10, 34);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3f1f14';
    ctx.beginPath();
    ctx.moveTo(12, -30);
    ctx.quadraticCurveTo(24, -36, 22, -44);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.quadraticCurveTo(-26, -42, -5, -54);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-2, -62);
    ctx.quadraticCurveTo(-8, -75, -2, -88);
    ctx.moveTo(3, -62);
    ctx.quadraticCurveTo(10, -74, 4, -86);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.8 };
  }

  private drawFuel(): RenderableSprite {
    const w = 70;
    const h = 70;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-16, -18, 32, 36, 4);
    ctx.fill();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-10, -25);
    ctx.lineTo(10, -25);
    ctx.lineTo(10, -18);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, -26, 6, 6);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAS', 0, 2);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawTaxiSign(): RenderableSprite {
    const w = 110;
    const h = 180;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 15);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-4, -140, 8, 140);

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-42, -165, 84, 45, 6);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ታክሲ መያዣ', 0, -145);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('TAXI STOP', 0, -130);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
  }

  private drawCheckpointGate(): RenderableSprite {
    const w = 600;
    const h = 320;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    ctx.fillStyle = '#334155';
    ctx.fillRect(-220, -260, 28, 260);
    ctx.fillRect(192, -260, 28, 260);

    ctx.fillRect(-240, -290, 480, 50);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(-230, -282, 460, 11);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-230, -271, 460, 11);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-230, -260, 460, 11);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('እንኳን ደህና መጡ! • CHECKPOINT', 0, -230);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
  }

  private createScenerySprites() {
    this.cache.set('SCENERY_ACACIA', this.drawAcaciaTree());
    this.cache.set('SCENERY_EUCALYPTUS', this.drawEucalyptusTree());
    this.cache.set('SCENERY_LAMP', this.drawStreetLamp());
    this.cache.set('SCENERY_BILLBOARD', this.drawBillboard());
  }

  private drawAcaciaTree(): RenderableSprite {
    const w = 240;
    const h = 220;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 80, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -60, -35, -110);
    ctx.moveTo(-10, -50);
    ctx.quadraticCurveTo(20, -80, 45, -115);
    ctx.stroke();

    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.ellipse(-38, -125, 65, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(42, -130, 60, 18, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, -145, 80, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.9 };
  }

  private drawEucalyptusTree(): RenderableSprite {
    const w = 180;
    const h = 320;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, -130, 0, -260);
    ctx.stroke();

    ctx.fillStyle = '#065f46';
    for (let y = -260; y < -90; y += 38) {
      ctx.beginPath();
      ctx.arc(-16, y, 22, 0, Math.PI * 2);
      ctx.arc(18, y + 10, 20, 0, Math.PI * 2);
      ctx.arc(0, y - 10, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
  }

  private drawStreetLamp(): RenderableSprite {
    const w = 120;
    const h = 260;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 15);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -200);
    ctx.quadraticCurveTo(0, -235, -28, -235);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-28, -233, 7, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
  }

  private drawBillboard(): RenderableSprite {
    const w = 240;
    const h = 220;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-60, -120, 10, 120);
    ctx.fillRect(50, -120, 10, 120);

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-90, -180, 180, 80, 6);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ቶሞካ ቡና', 0, -145);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText('ADDIS ABABA COFFEE', 0, -125);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.9 };
  }
}

export const sprites = new SpriteRegistry();
