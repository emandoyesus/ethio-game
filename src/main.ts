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
        <button id="btnRadio" class="arcade-btn" title="Toggle Addis Taxi FM Radio (R)">
          📻 <span>RADIO</span>
        </button>
        <button id="btnGarage" class="arcade-btn" title="Vehicle Garage & Upgrades (G)">
          🚗 <span>GARAGE</span>
        </button>
        <button id="btnAudio" class="arcade-btn" title="Toggle Sound (M)">
          🔊 <span>AUDIO</span>
        </button>
        <button id="btnPause" class="arcade-btn" title="Pause Game (P)">
          ⏸️ <span>PAUSE</span>
        </button>
        <button id="btnCrt" class="arcade-btn" title="Toggle CRT Scanlines">
          📺 <span>CRT</span>
        </button>
        <button id="btnFullscreen" class="arcade-btn" title="Fullscreen">
          ⛶ <span>FULL</span>
        </button>
      </div>
    </header>

    <div class="canvas-viewport" id="canvasViewport">
      <canvas id="gameCanvas"></canvas>
      <div class="scanlines" id="scanlines"></div>

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

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const game = new GameEngine(canvas);

// Hook quick bar buttons
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
const btnCrt = document.getElementById('btnCrt')!;
btnCrt.addEventListener('click', (e) => {
  e.stopPropagation();
  scanlines.classList.toggle('off');
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

// Start the game loop
game.start();
