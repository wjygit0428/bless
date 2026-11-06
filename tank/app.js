import { TankGame, TILE, COLS, ROWS, BRICK, STEEL, BASE } from './game.js';

const game = new TankGame();
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const livesEl = document.querySelector('#lives');
const enemiesEl = document.querySelector('#enemies');
const overlayEl = document.querySelector('#overlay');
const overlayTextEl = document.querySelector('#overlay-text');
const restartButton = document.querySelector('#overlay-restart');

const KEY_DIRS = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

// Most recently pressed direction wins.
const heldDirs = [];
let firing = false;

function restart() {
  game.reset();
  heldDirs.length = 0;
  firing = false;
}

window.addEventListener('keydown', (event) => {
  if (KEY_DIRS[event.key]) {
    event.preventDefault();
    const dir = KEY_DIRS[event.key];
    if (!heldDirs.includes(dir)) heldDirs.push(dir);
  } else if (event.key === ' ') {
    event.preventDefault();
    firing = true;
  } else if (event.key === 'p' || event.key === 'P') {
    game.togglePause();
  } else if (event.key === 'r' || event.key === 'R') {
    restart();
  }
});

window.addEventListener('keyup', (event) => {
  if (KEY_DIRS[event.key]) {
    const index = heldDirs.indexOf(KEY_DIRS[event.key]);
    if (index !== -1) heldDirs.splice(index, 1);
  } else if (event.key === ' ') {
    firing = false;
  }
});

window.addEventListener('blur', () => {
  heldDirs.length = 0;
  firing = false;
});

restartButton.addEventListener('click', restart);

function drawTank(tank, bodyColor, turretColor) {
  ctx.save();
  ctx.translate(tank.x + tank.w / 2, tank.y + tank.h / 2);
  const angle = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[tank.dir];
  ctx.rotate(angle);
  const half = tank.w / 2;
  ctx.fillStyle = '#333';
  ctx.fillRect(-half, -half, 6, tank.h);
  ctx.fillRect(half - 6, -half, 6, tank.h);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-half + 6, -half + 2, tank.w - 12, tank.h - 4);
  ctx.fillStyle = turretColor;
  ctx.fillRect(-4, -half - 2, 8, half + 2);
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const tile = game.map[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (tile === BRICK) {
        ctx.fillStyle = '#b5532a';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = '#3a1a0c';
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        ctx.beginPath();
        ctx.moveTo(x, y + TILE / 2);
        ctx.lineTo(x + TILE, y + TILE / 2);
        ctx.moveTo(x + TILE / 2, y);
        ctx.lineTo(x + TILE / 2, y + TILE / 2);
        ctx.stroke();
      } else if (tile === STEEL) {
        ctx.fillStyle = '#9aa3ad';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#d6dde4';
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
      } else if (tile === BASE) {
        ctx.fillStyle = '#e0b341';
        ctx.font = `${TILE - 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦅', x + TILE / 2, y + TILE / 2 + 1);
      }
    }
  }

  // Destroyed base marker
  if (game.status === 'lost' && game.map[12][6] !== BASE) {
    ctx.fillStyle = '#777';
    ctx.fillRect(6 * TILE + 6, 12 * TILE + 12, TILE - 12, TILE - 12);
  }

  for (const enemy of game.enemies) drawTank(enemy, '#c0392b', '#e57368');
  const player = game.player;
  if (player && !(player.invincible > 0 && Math.floor(game.tick / 4) % 2 === 0)) {
    drawTank(player, '#d4b21f', '#f5dc5a');
  }

  ctx.fillStyle = '#fff';
  for (const bullet of game.bullets) ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);

  scoreEl.textContent = game.score;
  livesEl.textContent = game.lives;
  enemiesEl.textContent = game.enemiesLeft + game.enemies.length;

  const message = game.status === 'won' ? '胜利！' : game.status === 'lost' ? '游戏结束' : game.paused ? '已暂停' : '';
  overlayEl.hidden = !message;
  overlayTextEl.textContent = message;
  restartButton.hidden = game.status === 'playing';
}

// Fixed 60 FPS logic step regardless of display refresh rate.
const STEP_MS = 1000 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  acc += Math.min(now - last, 250);
  last = now;
  while (acc >= STEP_MS) {
    game.update({ dir: heldDirs.at(-1) ?? null, fire: firing });
    acc -= STEP_MS;
  }
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
