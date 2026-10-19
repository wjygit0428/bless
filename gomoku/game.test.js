import assert from 'node:assert/strict';
import { GomokuGame, BLACK, WHITE } from './game.js';

const game = new GomokuGame();
assert.equal(game.play(0, 0), true);
assert.equal(game.play(0, 0), false, '不能在已有棋子上重复落子');
assert.equal(game.currentPlayer, WHITE);
assert.equal(game.undo(), true);
assert.equal(game.board[0][0], 0);
assert.equal(game.currentPlayer, BLACK);
assert.equal(game.redo(), true);
assert.equal(game.board[0][0], BLACK);

const winGame = new GomokuGame();
for (let col = 0; col < 5; col += 1) {
  assert.equal(winGame.play(0, col), true);
  if (col < 4) {
    assert.equal(winGame.play(1, col), true);
  }
}
assert.equal(winGame.winner, BLACK, '横向五子应判定黑方胜利');
assert.equal(winGame.winningLine.length, 5);
assert.equal(winGame.play(2, 2), false, '结束后不能继续落子');

const diagonal = new GomokuGame();
for (let i = 0; i < 5; i += 1) {
  diagonal.play(i, i);
  if (i < 4) diagonal.play(i, i + 1);
}
assert.equal(diagonal.winner, BLACK, '斜向五子应判定黑方胜利');

console.log('Gomoku core tests passed');
