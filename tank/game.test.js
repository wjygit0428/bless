import assert from 'node:assert/strict';
import { TankGame, TILE, BRICK, STEEL, BASE, EMPTY } from './game.js';

const seeded = () => {
  let s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

function clearMap(game) {
  for (const row of game.map) row.fill(EMPTY);
}

// 初始状态
{
  const game = new TankGame({ random: seeded() });
  assert.equal(game.status, 'playing');
  assert.equal(game.lives, 3);
  assert.equal(game.map[12][6], BASE, '基地应位于底部中央');
  assert.equal(game.enemies.length, 1, '开局应生成一辆敌方坦克');
}

// 移动与边界、障碍
{
  const game = new TankGame({ random: seeded() });
  clearMap(game);
  game.enemies = [];
  const p = game.player;
  const x = p.x;
  assert.equal(game.moveTank(p, 'left', 2), true);
  assert.equal(p.x, x - 2);
  for (let i = 0; i < 500; i += 1) game.moveTank(p, 'left', 2);
  assert.ok(p.x >= 0, '不能越过左边界');
  game.map[Math.floor(p.y / TILE)][2] = STEEL;
  p.x = 3 * TILE + 2;
  game.moveTank(p, 'left', 2);
  game.moveTank(p, 'left', 2);
  assert.ok(p.x >= 3 * TILE, '不能穿过钢墙');
}

// 子弹摧毁砖墙，被钢墙阻挡
{
  const game = new TankGame({ random: seeded() });
  clearMap(game);
  game.enemies = [];
  game.enemiesLeft = 5;
  game.player.invincible = 0;
  game.player.x = 5 * TILE + 2;
  game.player.y = 10 * TILE + 2;
  game.map[8][5] = BRICK;
  game.map[7][5] = STEEL;
  game.player.dir = 'up';
  assert.equal(game.fire(game.player), true);
  assert.equal(game.fire(game.player), false, '冷却中/已有子弹时不能再次射击');
  for (let i = 0; i < 30; i += 1) game.updateBullets();
  assert.equal(game.map[8][5], EMPTY, '砖墙应被摧毁');
  assert.equal(game.map[7][5], STEEL, '钢墙不可摧毁');
  assert.equal(game.bullets.length, 0);
}

// 击毁敌人得分并最终胜利
{
  const game = new TankGame({ random: seeded() });
  clearMap(game);
  game.enemiesLeft = 0;
  game.enemies = [{ x: 5 * TILE + 2, y: 2 * TILE + 2, w: 28, h: 28, dir: 'down', cooldown: 999, isPlayer: false }];
  game.player.x = 5 * TILE + 2;
  game.player.y = 10 * TILE + 2;
  game.player.dir = 'up';
  game.fire(game.player);
  for (let i = 0; i < 80; i += 1) game.updateBullets();
  assert.equal(game.enemies.length, 0);
  assert.equal(game.score, 100);
  game.update({});
  assert.equal(game.status, 'won');
}

// 基地被击毁则失败
{
  const game = new TankGame({ random: seeded() });
  clearMap(game);
  game.map[12][6] = BASE;
  game.enemies = [];
  game.enemiesLeft = 5;
  game.bullets.push({ x: 6 * TILE + 10, y: 11 * TILE, w: 6, h: 6, dir: 'down', owner: 'enemy', shooter: null });
  for (let i = 0; i < 10; i += 1) game.updateBullets();
  assert.equal(game.status, 'lost');
}

// 玩家被击中扣命，三条命用完失败；复活后短暂无敌
{
  const game = new TankGame({ random: seeded() });
  clearMap(game);
  game.enemies = [];
  game.enemiesLeft = 5;
  game.player.invincible = 0;
  const hit = () => {
    const p = game.player;
    game.bullets.push({ x: p.x + 10, y: p.y + 10, w: 6, h: 6, dir: 'up', owner: 'enemy', shooter: null });
    game.updateBullets();
  };
  hit();
  assert.equal(game.lives, 2);
  assert.ok(game.player.invincible > 0);
  hit();
  assert.equal(game.lives, 2, '无敌期间不扣命');
  game.player.invincible = 0;
  hit();
  game.player.invincible = 0;
  hit();
  assert.equal(game.lives, 0);
  assert.equal(game.status, 'lost');
}

// 暂停
{
  const game = new TankGame({ random: seeded() });
  game.togglePause();
  const tick = game.tick;
  game.update({ dir: 'left' });
  assert.equal(game.tick, tick, '暂停时不更新');
}

// 模拟长时间运行不应抛错
{
  const game = new TankGame({ random: seeded() });
  for (let i = 0; i < 5000 && game.status === 'playing'; i += 1) {
    game.update({ dir: ['up', 'left', 'right', 'down'][Math.floor(i / 50) % 4], fire: true });
  }
}

console.log('tank tests passed');
