export const BOARD_SIZE = 15;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];

export class GomokuGame {
  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(EMPTY));
    this.currentPlayer = BLACK;
    this.winner = null;
    this.winningLine = [];
    this.history = [];
    this.future = [];
  }

  play(row, col) {
    if (this.winner || !this.inBounds(row, col) || this.board[row][col] !== EMPTY) return false;
    const player = this.currentPlayer;
    this.board[row][col] = player;
    this.history.push({ row, col, player });
    this.future = [];
    const line = this.getWinningLine(row, col, player);
    if (line.length >= 5) {
      this.winner = player;
      this.winningLine = line;
    } else if (this.history.length === this.size * this.size) {
      this.winner = 'draw';
    } else {
      this.currentPlayer = player === BLACK ? WHITE : BLACK;
    }
    return true;
  }

  undo() {
    if (!this.history.length) return false;
    const move = this.history.pop();
    this.board[move.row][move.col] = EMPTY;
    this.future.push(move);
    this.winner = null;
    this.winningLine = [];
    this.currentPlayer = move.player;
    return true;
  }

  redo() {
    if (!this.future.length || this.winner) return false;
    const move = this.future.pop();
    return this.play(move.row, move.col);
  }

  inBounds(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  getWinningLine(row, col, player) {
    for (const [dr, dc] of DIRECTIONS) {
      const line = [[row, col]];
      for (const direction of [-1, 1]) {
        let r = row + dr * direction;
        let c = col + dc * direction;
        while (this.inBounds(r, c) && this.board[r][c] === player) {
          line.push([r, c]);
          r += dr * direction;
          c += dc * direction;
        }
      }
      if (line.length >= 5) return line;
    }
    return [];
  }
}
