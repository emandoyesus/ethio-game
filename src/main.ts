import './style.css';
import { GameEngine } from './game';
import { sound } from './audio';
import { ui } from './ui';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="game-wrapper" id="gameWrapper">
    <!-- Dedicated Arcade Bezel Header (Cleanly separated from canvas) -->
    <header class="arcade-header">
      <div class="header-brand">
        <span class="flag-icon">🇪🇹</span>
        <span class="brand-title">አዲስ ታክሲ ራሽ</span>
        <span class="brand-sub">ADDIS TAXI RUSH</span>
      </div>
      <div class="header-actions">
        <button id="btnCamera" class="arcade-btn" title="Switch Camera View: Chase, Hood, or Top-Down (C)">
          🎥 <span>CAM</span>
        </button>
        <button id="btnRadio" class="arcade-btn" title="Next Addis Taxi FM Radio Station (R)">
          📻 <span>RADIO</span>
        </button>
        <button id="btnGarage" class="arcade-btn" title="Open Vehicle Garage & Upgrades (G)">
          🚗 <span>GARAGE</span>
        </button>
        <button id="btnAudio" class="arcade-btn" title="Mute or Unmute Sound (M)">
          🔊 <span>AUDIO</span>
        </button>
        <button id="btnPause" class="arcade-btn" title="Pause or Resume Game (P)">
          ⏸️ <span>PAUSE</span>
        </button>
        <button id="btnTouchControls" class="arcade-btn" title="Show or Hide On-Screen Steering Wheel & Pedals">
          🎡 <span>WHEEL</span>
        </button>
        <button id="btnPerf" class="arcade-btn" title="Toggle 60 FPS Performance Mode (Shadows Off) (O)">
          ⚡ <span>FPS</span>
        </button>
        <button id="btnCrt" class="arcade-btn" title="Toggle Retro Scanline Filter">
          📺 <span>RETRO</span>
        </button>
        <button id="btnFullscreen" class="arcade-btn" title="Toggle Fullscreen">
          ⛶ <span>FULL</span>
        </button>
      </div>
    </header>

    <div class="canvas-viewport" id="canvasViewport">
      <canvas id="gameCanvas3d"></canvas>
      <canvas id="gameCanvasHud"></canvas>
      <div class="scanlines off" id="scanlines"></div>

      <!-- On-screen touch buttons for mobile / tablet devices -->
      <div class="touch-controls">
        <div class="touch-cluster">
          <button id="btnLeft" class="touch-btn" aria-label="Steer Left">
            ◀
            <span>LEFT</span>
          </button>
          <button id="btnRight" class="touch-btn" aria-label="Steer Right">
            ▶
            <span>RIGHT</span>
          </button>
        </div>

        <div class="touch-cluster">
          <button id="btnHorn" class="touch-btn horn" aria-label="Horn">
            📢
            <span>HORN</span>
          </button>
          <button id="btnHazards" class="touch-btn hazards" aria-label="Hazard Flashers">
            ⚠️
            <span>HAZARD</span>
          </button>
          <button id="btnBrake" class="touch-btn brake" aria-label="Brake">
            🛑
            <span>BRAKE</span>
          </button>
          <button id="btnGas" class="touch-btn gas" aria-label="Gas">
            ⚡
            <span>GAS</span>
          </button>
        </div>
      </div>
    </div>
  </div>
`;

const canvas3d = document.querySelector<HTMLCanvasElement>('#gameCanvas3d')!;
const canvasHud = document.querySelector<HTMLCanvasElement>('#gameCanvasHud')!;
const game = new GameEngine(canvas3d, canvasHud);

// Hook quick bar buttons
const btnCamera = document.getElementById('btnCamera')!;
btnCamera.addEventListener('click', (e) => {
  e.stopPropagation();
  const mode = game.cycleCameraView();
  btnCamera.innerHTML = `🎥 <span>${mode}</span>`;
});

const btnRadio = document.getElementById('btnRadio')!;
btnRadio.addEventListener('click', (e) => {
  e.stopPropagation();
  const station = sound.nextRadioStation();
  btnRadio.innerHTML = `📻 <span>${station.freq}</span>`;
  ui.showToast(`${station.nameAmharic} (${station.genre})`, '📻', '#facc15');
});

const btnGarage = document.getElementById('btnGarage')!;
btnGarage.addEventListener('click', (e) => {
  e.stopPropagation();
  if (game.state === 'GARAGE') {
    game.state = 'TITLE';
  } else {
    game.openGarage();
  }
});

const btnAudio = document.getElementById('btnAudio')!;
btnAudio.addEventListener('click', (e) => {
  e.stopPropagation();
  const muted = sound.toggleMute();
  btnAudio.innerHTML = muted ? `🔇 <span>MUTED</span>` : `🔊 <span>AUDIO</span>`;
});

const btnPause = document.getElementById('btnPause')!;
btnPause.addEventListener('click', (e) => {
  e.stopPropagation();
  if (game.state === 'PLAYING') {
    game.state = 'PAUSED';
    sound.stopEngine();
  } else if (game.state === 'PAUSED') {
    game.state = 'PLAYING';
  }
});

const scanlines = document.getElementById('scanlines')!;
const btnPerf = document.getElementById('btnPerf')!;
btnPerf.addEventListener('click', (e) => {
  e.stopPropagation();
  const isPerf = game.renderer3d.togglePerformanceMode();
  btnPerf.innerHTML = isPerf ? `⚡ <span style="color:#22c55e">60 FPS</span>` : `✨ <span>HQ</span>`;
  ui.showToast(
    isPerf ? '⚡ PERFORMANCE MODE: 60 FPS (Shadows OFF)' : '✨ HIGH QUALITY (Shadows ON)',
    isPerf ? '⚡' : '✨',
    isPerf ? '#22c55e' : '#38bdf8'
  );
});

const btnCrt = document.getElementById('btnCrt')!;
btnCrt.addEventListener('click', (e) => {
  e.stopPropagation();
  scanlines.classList.toggle('off');
});

const btnTouchControls = document.getElementById('btnTouchControls')!;
const syncWheelBtn = () => {
  btnTouchControls.innerHTML = game.showOnScreenControls
    ? `🎡 <span style="color:#38bdf8">WHEEL ON</span>`
    : `🎡 <span>WHEEL</span>`;
};
syncWheelBtn();
btnTouchControls.addEventListener('click', (e) => {
  e.stopPropagation();
  game.showOnScreenControls = !game.showOnScreenControls;
  if (!game.showOnScreenControls) game.controls.releaseInputs();
  syncWheelBtn();
  ui.showToast(
    game.showOnScreenControls ? '🎡 On-screen Wheel & Pedals ON' : '⌨️ Clean Keyboard HUD Mode',
    game.showOnScreenControls ? '🎡' : '⌨️',
    '#38bdf8'
  );
});

const btnFullscreen = document.getElementById('btnFullscreen')!;
const gameWrapper = document.getElementById('gameWrapper')!;
btnFullscreen.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!document.fullscreenElement) {
    gameWrapper.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Hook touch buttons to window key events
const bindTouchButton = (btnId: string, keyName: string) => {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const triggerDown = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (keyName === 'h') {
      game.triggerHorn();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, code: keyName }));
    }
  };

  const triggerUp = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, code: keyName }));
  };

  btn.addEventListener('touchstart', triggerDown, { passive: false });
  btn.addEventListener('touchend', triggerUp, { passive: false });
  btn.addEventListener('mousedown', triggerDown);
  btn.addEventListener('mouseup', triggerUp);
  btn.addEventListener('mouseleave', triggerUp);
};

bindTouchButton('btnLeft', 'ArrowLeft');
bindTouchButton('btnRight', 'ArrowRight');
bindTouchButton('btnGas', 'ArrowUp');
bindTouchButton('btnBrake', 'ArrowDown');
bindTouchButton('btnHorn', 'h');

const btnHazards = document.getElementById('btnHazards');
if (btnHazards) {
  const onHazards = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    game.toggleHazards();
  };
  btnHazards.addEventListener('touchstart', onHazards, { passive: false });
  btnHazards.addEventListener('click', onHazards);
}

// Start the game loop
game.start();
