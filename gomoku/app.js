import { GomokuGame, BLACK, WHITE } from './game.js';

const game = new GomokuGame();
const boardEl = document.querySelector('#board');
const moveCountEl = document.querySelector('#move-count');
const historyCountEl = document.querySelector('#history-count');
const historyListEl = document.querySelector('#history-list');
const turnStoneEl = document.querySelector('#turn-stone');
const turnTextEl = document.querySelector('#turn-text');
const statusTextEl = document.querySelector('#status-text');
const undoButton = document.querySelector('#undo');
const redoButton = document.querySelector('#redo');

const playerName = (player) => player === BLACK ? '黑方' : '白方';
const playerClass = (player) => player === BLACK ? 'black' : 'white';

function renderBoard() {
  boardEl.replaceChildren();
  const lastMove = game.history.at(-1);
  for (let row = 0; row < game.size; row += 1) {
    for (let col = 0; col < game.size; col += 1) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.type = 'button';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${row + 1}行 ${col + 1}列`);
      cell.addEventListener('click', () => {
        if (game.play(row, col)) render();
      });
      const player = game.board[row][col];
      if (player) {
        const stone = document.createElement('span');
        stone.className = `stone ${playerClass(player)}`;
        cell.append(stone);
      }
      if (lastMove?.row === row && lastMove?.col === col) cell.classList.add('last');
      if (game.winningLine.some(([winRow, winCol]) => winRow === row && winCol === col)) cell.classList.add('winning');
      boardEl.append(cell);
    }
  }
}

function renderHistory() {
  historyListEl.replaceChildren();
  if (!game.history.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-history';
    empty.textContent = '还没有落子记录';
    historyListEl.append(empty);
  } else {
    game.history.forEach((move, index) => {
      const item = document.createElement('li');
      item.innerHTML = `<span>${String(index + 1).padStart(2, '0')} · ${playerName(move.player)}</span><span>${move.row + 1}, ${move.col + 1}</span>`;
      historyListEl.append(item);
    });
  }
  moveCountEl.textContent = `${String(game.history.length).padStart(2, '0')} MOVES`;
  historyCountEl.textContent = game.history.length;
}

function renderStatus() {
  const finished = Boolean(game.winner);
  const activePlayer = finished && game.winner !== 'draw' ? game.winner : game.currentPlayer;
  turnStoneEl.className = `stone ${playerClass(activePlayer)}`;
  turnTextEl.textContent = finished ? (game.winner === 'draw' ? '和棋' : `${playerName(game.winner)}胜`) : playerName(game.currentPlayer);
  statusTextEl.textContent = game.winner === 'draw' ? '棋盘已满，精彩的平局' : game.winner ? `${playerName(game.winner)}连成五子！` : `轮到${playerName(game.currentPlayer)}落子`;
  undoButton.disabled = game.history.length === 0;
  redoButton.disabled = game.future.length === 0 || finished;
}

function render() { renderBoard(); renderHistory(); renderStatus(); }

document.querySelector('#undo').addEventListener('click', () => { if (game.undo()) render(); });
document.querySelector('#redo').addEventListener('click', () => { if (game.redo()) render(); });
document.querySelector('#restart').addEventListener('click', () => { game.reset(); render(); });
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea')) return;
  const key = event.key.toLowerCase();
  if (key === 'u' && game.undo()) render();
  if (key === 'r' && game.redo()) render();
  if (key === 'n') { game.reset(); render(); }
});

render();
