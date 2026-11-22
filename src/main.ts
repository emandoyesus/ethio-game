import './style.css';
import { GameEngine } from './game';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="game-wrapper">
    <canvas id="gameCanvas"></canvas>
    <div class="scanlines"></div>

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
`;

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
const game = new GameEngine(canvas);

// Hook touch buttons to window key events
const bindTouchButton = (btnId: string, keyName: string) => {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const triggerDown = (e: Event) => {
    e.preventDefault();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, code: keyName }));
  };

  const triggerUp = (e: Event) => {
    e.preventDefault();
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
