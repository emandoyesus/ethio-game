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

    const tilt = direction === 'left' ? -0.07 : direction === 'right' ? 0.07 : 0;
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

    // Realistic Ambient Occlusion Drop Shadow underneath vehicle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 92, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels & Deep Tires with rubber tread texture
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-80, -6, 28, 28, 6);
    ctx.roundRect(52, -6, 28, 28, 6);
    ctx.fill();

    // Silver Hubcaps with 4-lug nuts
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(-66, 8, 7, 0, Math.PI * 2);
    ctx.arc(66, 8, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(-66, 8, 3, 0, Math.PI * 2);
    ctx.arc(66, 8, 3, 0, Math.PI * 2);
    ctx.fill();

    // Chrome Bumper with black rubber impact strip
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(-78, -12, 156, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-74, -8, 148, 8);

    // Mud flaps with crisp Ethiopian flag stripes
    [-76, 54].forEach(fx => {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(fx, 4, 22, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(fx, 9, 22, 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fx, 14, 22, 5);
    });

    // Lower Body (Authentic Ethiopian Minibus Blue with metallic gradient)
    const bodyGrad = ctx.createLinearGradient(-76, -82, 76, -10);
    bodyGrad.addColorStop(0, '#004899');
    bodyGrad.addColorStop(0.3, '#0066cc');
    bodyGrad.addColorStop(0.7, '#0055bb');
    bodyGrad.addColorStop(1, '#003380');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-76, -84, 152, 74, [10, 10, 4, 4]);
    ctx.fill();

    // White Top Half (Crisp White HiAce Roof)
    const roofGrad = ctx.createLinearGradient(0, -150, 0, -84);
    roofGrad.addColorStop(0, '#ffffff');
    roofGrad.addColorStop(0.7, '#f1f5f9');
    roofGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.roundRect(-73, -148, 146, 68, [20, 20, 0, 0]);
    ctx.fill();

    // Roof Luggage Rack with authentic strapped luggage
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-62, -152);
    ctx.lineTo(62, -152);
    ctx.moveTo(-52, -147);
    ctx.lineTo(-52, -152);
    ctx.moveTo(0, -147);
    ctx.lineTo(0, -152);
    ctx.moveTo(52, -147);
    ctx.lineTo(52, -152);
    ctx.stroke();

    // Strapped colorful luggage bundle
    ctx.fillStyle = '#b45309'; // Leather bag
    ctx.beginPath();
    ctx.roundRect(-46, -168, 32, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#1d4ed8'; // Blue canvas bag
    ctx.beginPath();
    ctx.roundRect(-10, -166, 30, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#15803d'; // Green duffle
    ctx.beginPath();
    ctx.roundRect(22, -164, 26, 12, 3);
    ctx.fill();

    // Elastic bungee cords across luggage
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-44, -152);
    ctx.lineTo(44, -166);
    ctx.moveTo(44, -152);
    ctx.lineTo(-44, -166);
    ctx.stroke();

    // Tinted Rear Window with glass specular sheen
    const winGrad = ctx.createLinearGradient(0, -138, 0, -84);
    winGrad.addColorStop(0, '#0f172a');
    winGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = winGrad;
    ctx.beginPath();
    ctx.roundRect(-60, -138, 120, 54, 8);
    ctx.fill();

    // Passenger silhouettes in rear window
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(-30, -104, 11, 0, Math.PI * 2);
    ctx.arc(0, -104, 11, 0, Math.PI * 2);
    ctx.arc(30, -104, 11, 0, Math.PI * 2);
    ctx.fill();

    // Ethiopian Blessing Window Decal: "ፈጣሪ ይጠብቀን" (May God Protect Us)
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 8.5px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ፈጣሪ ይጠብቀን', 0, -126);

    // Diagonal Glass Specular Reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(-54, -135);
    ctx.lineTo(-12, -135);
    ctx.lineTo(-38, -87);
    ctx.lineTo(-54, -87);
    ctx.fill();

    // Rear Wiper
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -87);
    ctx.lineTo(16, -112);
    ctx.stroke();

    // Rear Taillights (Multi-chamber: Brake Red, Indicator Amber, Reverse White)
    if (brake) {
      // Vivid glowing brake lights
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(-72, -72, 16, 32);
      ctx.fillRect(56, -72, 16, 32);
      // High-mount 3rd brake light
      ctx.fillRect(-18, -144, 36, 6);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-72, -72, 16, 26);
      ctx.fillRect(56, -72, 16, 26);
    }

    ctx.fillStyle = '#f59e0b'; // Amber flasher
    ctx.fillRect(-72, -46, 16, 12);
    ctx.fillRect(56, -46, 16, 12);

    ctx.fillStyle = '#f8fafc'; // Reverse lamp
    ctx.fillRect(-72, -34, 16, 8);
    ctx.fillRect(56, -34, 16, 8);

    // Chrome taillight bevel outline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(-72, -72, 16, 46);
    ctx.strokeRect(56, -72, 16, 46);

    // Chrome Toyota Emblem on Tailgate
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -62, 10, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ethiopian Yellow Taxi License Plate ("3 • AA 778" with blue seal)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.roundRect(-30, -35, 60, 20, 3);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Ethiopian coat of arms blue circle
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(-22, -25, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9.5px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('3 • AA 778', 5, -21);

    // Weyala Conductor hanging out the side door
    ctx.save();
    const weyalaX = direction === 'left' ? -70 : 70;
    ctx.fillStyle = '#5c2c16'; // Face
    ctx.beginPath();
    ctx.arc(weyalaX, -98, 8, 0, Math.PI * 2);
    ctx.fill();
    // Green track cap
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(weyalaX - 7, -107, 14, 6);
    // Waving arm shouting destination
    ctx.strokeStyle = '#5c2c16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(weyalaX, -90);
    ctx.lineTo(weyalaX + (direction === 'left' ? -16 : 16), -108);
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
    this.cache.set('TRAFFIC_POLICE', this.drawPoliceCar());
  }

  private drawPoliceCar(): RenderableSprite {
    const w = 230;
    const h = 180;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.save();
    ctx.translate(w / 2, h - 25);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 80, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-72, -4, 24, 24);
    ctx.fillRect(48, -4, 24, 24);

    // Dark Navy Blue Federal Police Body
    const bodyGrad = ctx.createLinearGradient(-70, -66, 70, -10);
    bodyGrad.addColorStop(0, '#0f172a');
    bodyGrad.addColorStop(0.5, '#1e293b');
    bodyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-70, -66, 140, 58, 6);
    ctx.fill();

    // White Police Doors & Tailgate
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-52, -60, 104, 46);

    // Ethiopian Federal Police Crest (Yellow Star & Blue Eagle Emblem)
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -38, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ፖሊስ', 0, -22);

    // Cab / Windows
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-56, -112, 112, 50, [12, 12, 0, 0]);
    ctx.fill();

    // Police Flashing Lightbar on Roof (Red & Blue Strobe)
    const flasherGrad = ctx.createLinearGradient(-32, -128, 32, -128);
    flasherGrad.addColorStop(0, '#ef4444');
    flasherGrad.addColorStop(0.48, '#ef4444');
    flasherGrad.addColorStop(0.52, '#38bdf8');
    flasherGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = flasherGrad;
    ctx.beginPath();
    ctx.roundRect(-30, -126, 60, 14, 4);
    ctx.fill();

    // Lightbar Glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -124, 16, 10);
    ctx.shadowBlur = 0;

    // Rear Taillights
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-68, -54, 12, 24);
    ctx.fillRect(56, -54, 12, 24);

    ctx.restore();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
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
    const w = 140;
    const h = 70;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);

    // 1. Broken ragged perimeter shadow & asphalt edge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-56, 0);
    ctx.lineTo(-48, -14);
    ctx.lineTo(-24, -18);
    ctx.lineTo(-4, -22);
    ctx.lineTo(28, -16);
    ctx.lineTo(50, -10);
    ctx.lineTo(56, 2);
    ctx.lineTo(44, 15);
    ctx.lineTo(22, 21);
    ctx.lineTo(-12, 19);
    ctx.lineTo(-40, 15);
    ctx.closePath();
    ctx.fill();

    // 2. Weathered asphalt crumb rim
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Deep inner cavity (dark hole)
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.ellipse(0, 2, 44, 14, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 4. Broken asphalt rocks / gravel scattered
    ctx.fillStyle = '#64748b';
    [-40, -20, 24, 38].forEach((rx, idx) => {
      ctx.fillRect(rx, (idx % 2 === 0 ? -12 : 11), 4, 3);
    });

    // 5. Water puddle / mud reflection in bottom
    const puddleGrad = ctx.createLinearGradient(0, -6, 0, 10);
    puddleGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    puddleGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
    ctx.fillStyle = puddleGrad;
    ctx.beginPath();
    ctx.ellipse(4, 4, 28, 7, -0.05, 0, Math.PI * 2);
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawGoat(): RenderableSprite {
    const w = 120;
    const h = 100;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 15);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slender legs with hooves
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3.5;
    [-20, -10, 10, 20].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -26);
      ctx.lineTo(x + (x < 0 ? -2 : 2), 4);
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + (x < 0 ? -4 : 0), 2, 4, 3);
    });

    // Torso (Spotted highland goat)
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, -34, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark patches
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(-8, -36, 12, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head & Floppy Ears
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(26, -48, 13, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Floppy ears
    ctx.beginPath();
    ctx.ellipse(24, -40, 5, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Curved Horns
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, -55);
    ctx.quadraticCurveTo(16, -70, 10, -64);
    ctx.moveTo(26, -55);
    ctx.quadraticCurveTo(20, -70, 14, -64);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawCow(): RenderableSprite {
    const w = 190;
    const h = 150;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 20);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 60, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sturdy legs & dark hooves
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 7;
    [-36, -20, 20, 36].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, -36);
      ctx.lineTo(x, 8);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, 6, 8, 4);
    });

    // Zebu Cow Body (Reddish-brown Highland Cattle)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, -52, 52, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Characteristic Zebu Shoulder Hump (Iconic Ethiopian Breed)
    ctx.beginPath();
    ctx.ellipse(24, -84, 18, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // White hide patch
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-10, -50, 22, 16, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#5c2c16';
    ctx.beginPath();
    ctx.ellipse(54, -68, 20, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Long majestic lyre-shaped horns
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(48, -78);
    ctx.quadraticCurveTo(42, -106, 52, -114);
    ctx.moveTo(58, -78);
    ctx.quadraticCurveTo(66, -106, 76, -112);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.85 };
  }

  private drawPassenger(destinationText: string): RenderableSprite {
    const w = 160;
    const h = 170;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(45, h - 20);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs & Shoes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-6, -35);
    ctx.lineTo(-6, 8);
    ctx.moveTo(6, -35);
    ctx.lineTo(6, 8);
    ctx.stroke();

    // Traditional Ethiopian White Netela / Gabi Shawl with vibrant Tibeb border
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-16, -78, 32, 48, 6);
    ctx.fill();

    // Authentic Tibeb woven embroidery hem (Ethiopian Green, Yellow, Red)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-16, -42, 32, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-16, -39, 32, 3);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-16, -36, 32, 3);

    // Head & Hair
    ctx.fillStyle = '#5c2c16';
    ctx.beginPath();
    ctx.arc(0, -90, 11, 0, Math.PI * 2);
    ctx.fill();

    // Waving Arm signaling taxi
    ctx.strokeStyle = '#5c2c16';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -74);
    ctx.lineTo(28, -104);
    ctx.stroke();

    // Destination Callout Speech Bubble (e.g. "መገናኛ!", "ቦሌ!")
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(14, -146, 96, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Speech bubble tail
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(24, -112);
    ctx.lineTo(14, -100);
    ctx.lineTo(32, -112);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 13px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${destinationText}!`, 62, -124);

    return { canvas: cvs, width: w, height: h, anchorX: 0.35, anchorY: 0.85 };
  }

  private drawBirr(): RenderableSprite {
    const w = 84;
    const h = 84;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);

    // Glowing golden pickup aura
    const aura = ctx.createRadialGradient(0, 0, 16, 0, 0, 40);
    aura.addColorStop(0, 'rgba(250, 204, 21, 0.55)');
    aura.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();

    // Outer coin rim with ridges
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    // Beveled brass edge
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Inner embossed coin face
    const coinGrad = ctx.createLinearGradient(-18, -18, 18, 18);
    coinGrad.addColorStop(0, '#fef08a');
    coinGrad.addColorStop(0.5, '#eab308');
    coinGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Authentic Ethiopian "ብር" (Birr) Ge'ez inscription
    ctx.fillStyle = '#713f12';
    ctx.font = '900 17px "Noto Sans Ethiopic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ብር', 0, 2);

    // Specular diagonal reflection shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, -Math.PI * 0.7, -Math.PI * 0.2);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.5 };
  }

  private drawBunna(): RenderableSprite {
    const w = 100;
    const h = 110;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 22);

    // Warm fiery nitro boost glow
    const glow = ctx.createRadialGradient(0, -32, 10, 0, -32, 45);
    glow.addColorStop(0, 'rgba(249, 115, 22, 0.6)');
    glow.addColorStop(0.6, 'rgba(234, 88, 12, 0.2)');
    glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -32, 45, 0, Math.PI * 2);
    ctx.fill();

    // Traditional straw ring base ("ማጨሻ")
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, -4, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black clay Jebena spherical body with polished ceramic gradient
    const clayGrad = ctx.createRadialGradient(-6, -34, 4, 0, -30, 22);
    clayGrad.addColorStop(0, '#442218');
    clayGrad.addColorStop(0.5, '#22110c');
    clayGrad.addColorStop(1, '#0f0705');
    ctx.fillStyle = clayGrad;
    ctx.beginPath();
    ctx.arc(0, -30, 22, 0, Math.PI * 2);
    ctx.fill();

    // Jebena Tall Tapered Neck
    ctx.beginPath();
    ctx.moveTo(-6, -30);
    ctx.lineTo(-4, -66);
    ctx.lineTo(4, -66);
    ctx.lineTo(6, -30);
    ctx.closePath();
    ctx.fill();

    // Spout (Pouring mouth)
    ctx.strokeStyle = '#22110c';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(14, -32);
    ctx.quadraticCurveTo(26, -42, 24, -50);
    ctx.stroke();

    // Curved Handle
    ctx.beginPath();
    ctx.moveTo(-14, -28);
    ctx.quadraticCurveTo(-28, -44, -6, -58);
    ctx.stroke();

    // Steaming Ethiopian Bunna coffee aroma plumes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-2, -68);
    ctx.quadraticCurveTo(-10, -82, -3, -96);
    ctx.moveTo(3, -68);
    ctx.quadraticCurveTo(12, -82, 5, -94);
    ctx.stroke();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.8 };
  }

  private drawFuel(): RenderableSprite {
    const w = 80;
    const h = 80;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h / 2);

    // Green emergency fuel refill glow
    const fuelGlow = ctx.createRadialGradient(0, 0, 12, 0, 0, 36);
    fuelGlow.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    fuelGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = fuelGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();

    // Heavy duty steel Jerry Can body
    const canGrad = ctx.createLinearGradient(-18, -20, 18, 20);
    canGrad.addColorStop(0, '#ef4444');
    canGrad.addColorStop(0.5, '#dc2626');
    canGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = canGrad;
    ctx.beginPath();
    ctx.roundRect(-18, -18, 36, 38, 5);
    ctx.fill();

    // Stamped X reinforcement rib on jerry can side
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 14);
    ctx.moveTo(12, -12);
    ctx.lineTo(-12, 14);
    ctx.stroke();

    // 3-bar military carry handle on top
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.lineTo(12, -18);
    ctx.stroke();

    // Spout filler cap
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, -28, 8, 7);

    // White bold FUEL text stencil
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FUEL', 0, 1);

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
    this.cache.set('SCENERY_POLICE_CONE', this.drawPoliceCone());
    this.cache.set('SCENERY_RADAR_SIGN', this.drawRadarSign());
    this.cache.set('SCENERY_ZEBRA_PEDESTRIAN', this.drawZebraPedestrian());
  }

  private drawZebraPedestrian(): RenderableSprite {
    const w = 120;
    const h = 160;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 16);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Blue Zebra Crosswalk Signpost on the curb
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-38, -125, 4, 125);

    // Blue square sign
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-52, -125, 32, 32, 4);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // White pedestrian silhouette inside sign
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-36, -118, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-38, -113, 4, 10);
    // Zebra stripes inside sign
    ctx.fillRect(-48, -101, 24, 2);

    // 2. Ethiopian Pedestrian waiting at curb
    // Legs & leather sandals
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, -30);
    ctx.lineTo(4, 6);
    ctx.moveTo(16, -30);
    ctx.lineTo(16, 6);
    ctx.stroke();

    // Traditional Gabi / Shamma Robe
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-6, -72, 30, 46, 6);
    ctx.fill();

    // Beautiful Tibeb embroidery hem (Green, Yellow, Red)
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-6, -38, 30, 2.5);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-6, -35.5, 30, 2.5);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-6, -33, 30, 2.5);

    // Walking stick (beter)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(22, -45);
    ctx.lineTo(24, 8);
    ctx.stroke();

    // Head & hair
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(9, -82, 10, 0, Math.PI * 2);
    ctx.fill();

    // Gentle waiting pose
    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
  }

  private drawPoliceCone(): RenderableSprite {
    const w = 60;
    const h = 70;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 8);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black rubber base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-16, -4, 32, 6);

    // Bright safety orange cone body
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-3, -52);
    ctx.lineTo(3, -52);
    ctx.lineTo(12, -4);
    ctx.closePath();
    ctx.fill();

    // White reflective bands
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.lineTo(-7, -26);
    ctx.lineTo(7, -26);
    ctx.lineTo(9, -16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, -34);
    ctx.lineTo(-4, -44);
    ctx.lineTo(4, -44);
    ctx.lineTo(6, -34);
    ctx.closePath();
    ctx.fill();

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.9 };
  }

  private drawRadarSign(): RenderableSprite {
    const w = 90;
    const h = 130;
    const cvs = document.createElement('canvas');
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext('2d')!;

    ctx.translate(w / 2, h - 10);

    // Metal pole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-3, -110, 6, 110);

    // Speed limit circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -90, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('50', 0, -89);

    // Amharic badge: ኪ.ሜ/ሰ
    ctx.font = 'bold 7.5px "Noto Sans Ethiopic", sans-serif';
    ctx.fillText('ኪ.ሜ/ሰ', 0, -74);

    return { canvas: cvs, width: w, height: h, anchorX: 0.5, anchorY: 0.95 };
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
