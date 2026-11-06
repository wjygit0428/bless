export const TILE = 32;
export const COLS = 13;
export const ROWS = 13;
export const TANK_SIZE = 28;
export const BULLET_SIZE = 6;

export const EMPTY = 0;
export const BRICK = 1;
export const STEEL = 2;
export const BASE = 3;

export const DIRS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const PLAYER_SPEED = 2;
const ENEMY_SPEED = 1;
const BULLET_SPEED = 5;
const PLAYER_COOLDOWN = 20;
const ENEMY_COOLDOWN = 70;
const RESPAWN_INVINCIBLE = 90;
const SPAWN_INTERVAL = 120;
const MAX_ENEMIES_ON_FIELD = 4;
const ENEMIES_PER_LEVEL = 12;
const PLAYER_LIVES = 3;
const ENEMY_SCORE = 100;

const LEVEL_MAP = [
  '.............',
  '.B.B.B.B.B.B.',
  '.B.B.B.B.B.B.',
  '.B.B.BSB.B.B.',
  '.B.B.B.B.B.B.',
  '.B.B.....B.B.',
  '.....BBB.....',
  'S.B.......B.S',
  '.B.B.B.B.B.B.',
  '.B.B.B.B.B.B.',
  '.B.B.....B.B.',
  '.B.B.BBB.B.B.',
  '.....B.B.....',
];

const SPAWN_COLS = [0, 6, 12];
const PLAYER_START = { col: 4, row: 12 };
const BASE_POS = { col: 6, row: 12 };

function buildMap() {
  const map = LEVEL_MAP.map((line) => [...line].map((ch) => (ch === 'B' ? BRICK : ch === 'S' ? STEEL : EMPTY)));
  for (const row of map) {
    while (row.length < COLS) row.push(EMPTY);
  }
  // Clear the base area and surround it with bricks.
  for (let r = BASE_POS.row - 1; r <= BASE_POS.row; r += 1) {
    for (let c = BASE_POS.col - 1; c <= BASE_POS.col + 1; c += 1) map[r][c] = BRICK;
  }
  map[BASE_POS.row][BASE_POS.col] = BASE;
  return map;
}

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class TankGame {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.reset();
  }

  reset() {
    this.map = buildMap();
    this.bullets = [];
    this.enemies = [];
    this.score = 0;
    this.lives = PLAYER_LIVES;
    this.enemiesLeft = ENEMIES_PER_LEVEL;
    this.status = 'playing'; // playing | won | lost
    this.paused = false;
    this.tick = 0;
    this.spawnTimer = 0;
    this.player = null;
    this.spawnPlayer();
    this.trySpawnEnemy();
  }

  spawnPlayer() {
    this.player = {
      x: PLAYER_START.col * TILE + (TILE - TANK_SIZE) / 2,
      y: PLAYER_START.row * TILE + (TILE - TANK_SIZE) / 2,
      w: TANK_SIZE,
      h: TANK_SIZE,
      dir: 'up',
      cooldown: 0,
      invincible: RESPAWN_INVINCIBLE,
      isPlayer: true,
    };
  }

  trySpawnEnemy() {
    if (this.enemiesLeft <= 0 || this.enemies.length >= MAX_ENEMIES_ON_FIELD) return false;
    const cols = SPAWN_COLS.filter((col) => {
      const rect = this.spawnRect(col);
      return !this.allTanks().some((t) => overlap(rect, t));
    });
    if (cols.length === 0) return false;
    const col = cols[Math.floor(this.random() * cols.length)];
    this.enemies.push({
      ...this.spawnRect(col),
      dir: 'down',
      cooldown: ENEMY_COOLDOWN,
      invincible: 0,
      isPlayer: false,
    });
    this.enemiesLeft -= 1;
    return true;
  }

  spawnRect(col) {
    return { x: col * TILE + (TILE - TANK_SIZE) / 2, y: (TILE - TANK_SIZE) / 2, w: TANK_SIZE, h: TANK_SIZE };
  }

  allTanks() {
    return this.player ? [this.player, ...this.enemies] : [...this.enemies];
  }

  blockedByMap(rect) {
    if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > COLS * TILE || rect.y + rect.h > ROWS * TILE) return true;
    const c0 = Math.floor(rect.x / TILE);
    const c1 = Math.floor((rect.x + rect.w - 1) / TILE);
    const r0 = Math.floor(rect.y / TILE);
    const r1 = Math.floor((rect.y + rect.h - 1) / TILE);
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        if (this.map[r][c] !== EMPTY) return true;
      }
    }
    return false;
  }

  // Returns true if the tank actually moved.
  moveTank(tank, dir, speed) {
    tank.dir = dir;
    const { dx, dy } = DIRS[dir];
    const next = { x: tank.x + dx * speed, y: tank.y + dy * speed, w: tank.w, h: tank.h };
    if (this.blockedByMap(next)) return false;
    if (this.allTanks().some((other) => other !== tank && overlap(next, other))) return false;
    tank.x = next.x;
    tank.y = next.y;
    return true;
  }

  fire(tank) {
    if (tank.cooldown > 0) return false;
    const owner = tank.isPlayer ? 'player' : 'enemy';
    // One bullet per tank on screen, as in the classic game.
    if (this.bullets.some((b) => b.shooter === tank)) return false;
    const { dx, dy } = DIRS[tank.dir];
    const cx = tank.x + tank.w / 2;
    const cy = tank.y + tank.h / 2;
    this.bullets.push({
      x: cx + dx * (tank.w / 2) - BULLET_SIZE / 2,
      y: cy + dy * (tank.h / 2) - BULLET_SIZE / 2,
      w: BULLET_SIZE,
      h: BULLET_SIZE,
      dir: tank.dir,
      owner,
      shooter: tank,
    });
    tank.cooldown = tank.isPlayer ? PLAYER_COOLDOWN : ENEMY_COOLDOWN;
    return true;
  }

  // input: { dir: 'up'|'down'|'left'|'right'|null, fire: boolean }
  update(input = {}) {
    if (this.status !== 'playing' || this.paused) return;
    this.tick += 1;

    const player = this.player;
    if (player.cooldown > 0) player.cooldown -= 1;
    if (player.invincible > 0) player.invincible -= 1;
    if (input.dir) this.moveTank(player, input.dir, PLAYER_SPEED);
    if (input.fire) this.fire(player);

    for (const enemy of this.enemies) this.updateEnemy(enemy);
    this.updateBullets();

    this.spawnTimer += 1;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.trySpawnEnemy();
    }

    if (this.status === 'playing' && this.enemiesLeft === 0 && this.enemies.length === 0) {
      this.status = 'won';
    }
  }

  updateEnemy(enemy) {
    if (enemy.cooldown > 0) enemy.cooldown -= 1;
    const moved = this.moveTank(enemy, enemy.dir, ENEMY_SPEED);
    if (!moved || this.random() < 0.02) {
      const names = Object.keys(DIRS);
      // Bias toward heading down so enemies pressure the base.
      enemy.dir = this.random() < 0.4 ? 'down' : names[Math.floor(this.random() * names.length)];
    }
    if (this.random() < 0.03) this.fire(enemy);
  }

  updateBullets() {
    const survivors = [];
    const dead = new Set();

    for (const bullet of this.bullets) {
      const { dx, dy } = DIRS[bullet.dir];
      for (let step = 0; step < BULLET_SPEED && !dead.has(bullet); step += 1) {
        bullet.x += dx;
        bullet.y += dy;
        if (this.bulletHitsWorld(bullet) || this.bulletHitsTank(bullet)) dead.add(bullet);
      }
    }

    for (let i = 0; i < this.bullets.length; i += 1) {
      for (let j = i + 1; j < this.bullets.length; j += 1) {
        const a = this.bullets[i];
        const b = this.bullets[j];
        if (a.owner !== b.owner && overlap(a, b)) {
          dead.add(a);
          dead.add(b);
        }
      }
    }

    for (const bullet of this.bullets) if (!dead.has(bullet)) survivors.push(bullet);
    this.bullets = survivors;
  }

  bulletHitsWorld(bullet) {
    if (bullet.x < 0 || bullet.y < 0 || bullet.x + bullet.w > COLS * TILE || bullet.y + bullet.h > ROWS * TILE) {
      return true;
    }
    const c0 = Math.floor(bullet.x / TILE);
    const c1 = Math.floor((bullet.x + bullet.w - 1) / TILE);
    const r0 = Math.floor(bullet.y / TILE);
    const r1 = Math.floor((bullet.y + bullet.h - 1) / TILE);
    let hit = false;
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const tile = this.map[r][c];
        if (tile === EMPTY) continue;
        hit = true;
        if (tile === BRICK) this.map[r][c] = EMPTY;
        if (tile === BASE) {
          this.map[r][c] = EMPTY;
          this.status = 'lost';
        }
      }
    }
    return hit;
  }

  bulletHitsTank(bullet) {
    if (bullet.owner === 'player') {
      const index = this.enemies.findIndex((enemy) => overlap(bullet, enemy));
      if (index === -1) return false;
      this.enemies.splice(index, 1);
      this.score += ENEMY_SCORE;
      return true;
    }
    if (overlap(bullet, this.player)) {
      if (this.player.invincible <= 0) this.killPlayer();
      return true;
    }
    return false;
  }

  killPlayer() {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.status = 'lost';
      return;
    }
    this.spawnPlayer();
  }

  togglePause() {
    if (this.status === 'playing') this.paused = !this.paused;
    return this.paused;
  }
}
