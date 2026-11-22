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
    // Player Minibus: straight, turn left, turn right, and boost versions
    ['straight', 'left', 'right'].forEach(dir => {
      [false, true].forEach(boost => {
        const key = `PLAYER_TAXI_${dir.toUpperCase()}${boost ? '_BOOST' : ''}`;
        this.cache.set(key, this.drawMinibus(dir as 'straight' | 'left' | 'right', boost));
      });
    });
  }

  private drawMinibus(direction: 'straight' | 'left' | 'right', boost: boolean): RenderableSprite {
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
      // Dual exhaust boost flames
      [-40, 40].forEach(exX => {
        ctx.fillStyle = '#ff3b00';
        ctx.beginPath();
        ctx.moveTo(exX - 8, 12);
        ctx.lineTo(exX, 34 + Math.random() * 8);
        ctx.lineTo(exX + 8, 12);
        ctx.fill();

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.moveTo(exX - 4, 12);
        ctx.lineTo(exX, 24 + Math.random() * 6);
        ctx.lineTo(exX + 4, 12);
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
      ctx.fillStyle = '#078930'; // Green
      ctx.fillRect(fx, 4, 18, 4);
      ctx.fillStyle = '#fcdd09'; // Yellow
      ctx.fillRect(fx, 8, 18, 4);
      ctx.fillStyle = '#da121a'; // Red
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

    // White Top Half (Iconic Minibus Roof)
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.roundRect(-72, -145, 144, 70, [18, 18, 0, 0]);
    ctx.fill();

    // Roof Rack (Cargo luggage rack)
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

    // Luggage on roof rack (jerrycans, mattress, bags)
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-45, -164, 30, 14);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-10, -162, 28, 12);
    ctx.fillStyle = '#059669';
    ctx.fillRect(22, -160, 24, 10);

    // Rear Window (Dark tinted)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-58, -135, 116, 52, 6);
    ctx.fill();
    // Glass reflection
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
    ctx.fillStyle = '#dc2626'; // Red
    ctx.fillRect(-70, -68, 16, 26);
    ctx.fillRect(54, -68, 16, 26);

    ctx.fillStyle = '#f59e0b'; // Amber turn signal
    ctx.fillRect(-70, -42, 16, 12);
    ctx.fillRect(54, -42, 16, 12);

    // White reverse lights
    ctx.fillStyle = '#fff';
    ctx.fillRect(-70, -30, 16, 8);
    ctx.fillRect(54, -30, 16, 8);

    // License Plate (Ethiopian Code 3 Addis Ababa)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-28, -32, 56, 18);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-28, -32, 56, 18);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('3 • AA 778', 0, -20);

    // Weyala hanging out of sliding side door!
    ctx.save();
    const weyalaX = direction === 'left' ? -68 : 68;
    ctx.fillStyle = '#78350f'; // Skin
    ctx.beginPath();
    ctx.arc(weyalaX, -95, 8, 0, Math.PI * 2);
    ctx.fill();
    // Weyala hat/beanie
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(weyalaX - 7, -104, 14, 6);
    // Arm waving
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

  private createTrafficSprites() {
    // 1. Classic Blue Lada Taxi
    this.cache.set('TRAFFIC_LADA', this.drawLada());
    // 2. Bajaj (Tuk-Tuk)
    this.cache.set('TRAFFIC_BAJAJ', this.drawBajaj());
    // 3. Isuzu Freight Truck
    this.cache.set('TRAFFIC_ISUZU', this.drawIsuzu());
  }

  private drawLada(): RenderableSprite {
    const w = 180;
    const h = 140;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 68, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-62, -4, 20, 20);
    ctx.fillRect(42, -4, 20, 20);

    // Body (Blue)
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.roundRect(-60, -56, 120, 50, 4);
    ctx.fill();

    // White Top / Roof
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-48, -98, 96, 46, [8, 8, 0, 0]);
    ctx.fill();

    // Rear window
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-42, -92, 84, 34);

    // Taxi Sign on roof
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-14, -110, 28, 12);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', 0, -101);

    // Chrome Bumper
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-62, -10, 124, 10);

    // Taillights (Vertical Lada style)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-56, -48, 12, 22);
    ctx.fillRect(44, -48, 12, 22);

    // Plate
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-20, -28, 40, 14);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1 • AA', 0, -18);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawBajaj(): RenderableSprite {
    const w = 150;
    const h = 160;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-42, -4, 14, 18);
    ctx.fillRect(28, -4, 14, 18);

    // Body (Vibrant Yellow / Blue Bajaj)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(-40, -68, 80, 60, 6);
    ctx.fill();

    // Black Canvas Canopy
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-38, -125, 76, 62, [14, 14, 0, 0]);
    ctx.fill();

    // Rear Canvas Window
    ctx.fillStyle = '#475569';
    ctx.fillRect(-24, -112, 48, 28);

    // Spare tire mounted on back
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -38, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rear round lights
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-30, -22, 6, 0, Math.PI * 2);
    ctx.arc(30, -22, 6, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawIsuzu(): RenderableSprite {
    const w = 260;
    const h = 260;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 25);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 96, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive Twin Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-88, -10, 32, 32);
    ctx.fillRect(56, -10, 32, 32);

    // Wooden Cargo Bed
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-86, -165, 172, 140);
    // Wooden slats detail
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    for (let y = -145; y < -35; y += 22) {
      ctx.beginPath();
      ctx.moveTo(-86, y);
      ctx.lineTo(86, y);
      ctx.stroke();
    }

    // Traditional Ethiopian decorative stripes across wooden tailgate
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-86, -70, 172, 8);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-86, -62, 172, 8);
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-86, -54, 172, 8);

    // Amharic Isuzu branding / motto: "ይሁነኝ" or "እግዚአብሔር ይመስገን"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('እግዚአብሔር ይመስገን', 0, -84);

    // Exhaust Pipe on left puffing dark diesel smoke
    ctx.fillStyle = '#475569';
    ctx.fillRect(-92, -180, 8, 90);
    ctx.fillStyle = 'rgba(70, 70, 70, 0.4)';
    ctx.beginPath();
    ctx.arc(-95, -195, 14, 0, Math.PI * 2);
    ctx.arc(-105, -215, 20, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Metal Bumper
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-90, -25, 180, 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-75, -22, 24, 12);
    ctx.fillRect(51, -22, 24, 12);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private createObstaclesAndCollectibles() {
    // 1. Pothole (ጉድጓድ)
    this.cache.set('OBSTACLE_POTHOLE', this.drawPothole());
    // 2. Goat / Sheep
    this.cache.set('OBSTACLE_GOAT', this.drawGoat());
    // 3. Cow
    this.cache.set('OBSTACLE_COW', this.drawCow());
    // 4. Passenger
    this.cache.set('PASSENGER', this.drawPassenger());
    // 5. Birr Coin
    this.cache.set('ITEM_BIRR', this.drawBirr());
    // 6. Jebena Bunna (Nitro)
    this.cache.set('ITEM_BUNNA', this.drawBunna());
    // 7. Fuel Can
    this.cache.set('ITEM_FUEL', this.drawFuel());
    // 8. Checkpoint Gate
    this.cache.set('CHECKPOINT_GATE', this.drawCheckpointGate());
  }

  private drawPothole(): RenderableSprite {
    const w = 120;
    const h = 60;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);
    // Outer ragged asphalt crack
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Deep pit
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(2, 2, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water puddle reflection / ripple
    ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
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

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    [-18, -8, 8, 18].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -25);
      ctx.lineTo(x, 4);
      ctx.stroke();
    });

    // Body (Woolly cream / brown)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -32, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(24, -46, 12, 9, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, -52);
    ctx.quadraticCurveTo(14, -66, 10, -60);
    ctx.stroke();

    // Tiny Tail
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-24, -36);
    ctx.lineTo(-32, -44);
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

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 55, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#573418';
    ctx.lineWidth = 6;
    [-35, -20, 20, 35].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -35);
      ctx.lineTo(x, 8);
      ctx.stroke();
    });

    // Cow Body (Zebu)
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -50, 48, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Characteristic Zebu Hump!
    ctx.beginPath();
    ctx.ellipse(-12, -78, 16, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Cow Head
    ctx.beginPath();
    ctx.ellipse(48, -64, 18, 14, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Magnificent curved horns
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

  private drawPassenger(): RenderableSprite {
    const w = 130;
    const h = 150;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(45, h - 20);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-5, -35);
    ctx.lineTo(-5, 8);
    ctx.moveTo(5, -35);
    ctx.lineTo(5, 8);
    ctx.stroke();

    // Traditional White Netela Shawl with colourful border
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-14, -75, 28, 44, 4);
    ctx.fill();

    // Tibeb / Ethiopian woven border pattern on shawl
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-14, -40, 28, 3);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-14, -37, 28, 3);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-14, -34, 28, 3);

    // Head
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, -85, 10, 0, Math.PI * 2);
    ctx.fill();

    // Arm raised waving to taxi!
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -70);
    ctx.lineTo(24, -98);
    ctx.stroke();

    // Speech / Destination Bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(14, -135, 68, 28, 6);
    ctx.fill();
    ctx.stroke();

    // Destination text: "ታክሲ!" or "መገናኛ!"
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ታክሲ!', 48, -116);

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

    // Outer glow
    ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    // Gold Coin
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Currency symbol
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

    // Glowing aura
    ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.beginPath();
    ctx.arc(0, -30, 38, 0, Math.PI * 2);
    ctx.fill();

    // Traditional Clay Jebena (ቡና ጀበና)
    // Round pot base
    ctx.fillStyle = '#3f1f14';
    ctx.beginPath();
    ctx.arc(0, -26, 20, 0, Math.PI * 2);
    ctx.fill();

    // Long slender neck
    ctx.fillRect(-5, -60, 10, 34);

    // Spout (አፍንጫ)
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3f1f14';
    ctx.beginPath();
    ctx.moveTo(12, -30);
    ctx.quadraticCurveTo(24, -36, 22, -44);
    ctx.stroke();

    // Handle (እጀታ)
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.quadraticCurveTo(-26, -42, -5, -54);
    ctx.stroke();

    // Steam fumes (Turbo Nitro!)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
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

    // Jerrycan
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(-16, -18, 32, 36, 4);
    ctx.fill();

    // Handle
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-10, -25);
    ctx.lineTo(10, -25);
    ctx.lineTo(10, -18);
    ctx.stroke();

    // Cap
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, -26, 6, 6);

    // Fuel icon
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAS', 0, 2);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawCheckpointGate(): RenderableSprite {
    const w = 600;
    const h = 320;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    // Pillars
    ctx.fillStyle = '#334155';
    ctx.fillRect(-220, -260, 28, 260);
    ctx.fillRect(192, -260, 28, 260);

    // Arch Beam
    ctx.fillRect(-240, -290, 480, 50);

    // Ethiopian Flag colored banner
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-230, -282, 460, 11);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-230, -271, 460, 11);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-230, -260, 460, 11);

    // Welcome Sign
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

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 80, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gnarled Trunk
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -60, -35, -110);
    ctx.moveTo(-10, -50);
    ctx.quadraticCurveTo(20, -80, 45, -115);
    ctx.stroke();

    // Canopy (Flat umbrella layered crowns)
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

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 35, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tall slender pale trunk (ባህር ዛፍ)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(5, -130, 0, -260);
    ctx.stroke();

    // Foliage puffs
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

    // Lamp bulb & glow
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-28, -233, 6, 0, Math.PI * 2);
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

    // Posts
    ctx.fillStyle = '#334155';
    ctx.fillRect(-60, -120, 10, 120);
    ctx.fillRect(50, -120, 10, 120);

    // Board
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-90, -180, 180, 80, 6);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text: "ቶሞካ ቡና" (Tomoca Coffee)
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
