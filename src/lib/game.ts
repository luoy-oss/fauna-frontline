import {
  Board,
  Cell,
  GameState,
  Piece,
  PieceRank,
  ROWS,
  COLS,
  PIECES,
} from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createBoard(): Board {
  const pieces: Piece[] = [];
  for (const p of PIECES) {
    for (let i = 0; i < p.count; i++) {
      pieces.push({ rank: p.rank as PieceRank, owner: 1, faceUp: false });
      pieces.push({ rank: p.rank as PieceRank, owner: 2, faceUp: false });
    }
  }
  const shuffled = shuffle(pieces);
  const board: Board = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push(shuffled[r * COLS + c]);
    }
    board.push(row);
  }
  return board;
}

export function createGame(id: string, player1: string): GameState {
  return {
    id,
    board: createBoard(),
    currentPlayer: 1,
    phase: "waiting",
    winner: 0,
    player1,
    player2: "",
    createdAt: Date.now(),
  };
}

export function getAdjacentPositions(
  r: number,
  c: number
): [number, number][] {
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  return dirs
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
}

function countPieces(board: Board, owner: 1 | 2): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.owner === owner) count++;
    }
  }
  return count;
}

export function checkWinner(board: Board): 0 | 1 | 2 {
  const p1 = countPieces(board, 1);
  const p2 = countPieces(board, 2);

  if (p1 === 0) return 2;
  if (p2 === 0) return 1;

  if (p1 === 1 && p2 === 1) {
    let piece1: Piece | null = null;
    let piece2: Piece | null = null;
    for (const row of board) {
      for (const cell of row) {
        if (cell) {
          if (cell.owner === 1) piece1 = cell;
          if (cell.owner === 2) piece2 = cell;
        }
      }
    }
    if (piece1 && piece2) {
      if (piece1.rank >= piece2.rank) return 1;
      if (piece2.rank >= piece1.rank) return 2;
    }
  }

  return 0;
}

export function applyMove(
  game: GameState,
  player: 1 | 2,
  action: "flip" | "move" | "capture",
  fromR: number,
  fromC: number,
  toR?: number,
  toC?: number
): { ok: true; game: GameState } | { ok: false; error: string } {
  if (game.phase !== "playing")
    return { ok: false, error: "Game is not in progress" };
  if (game.currentPlayer !== player)
    return { ok: false, error: "Not your turn" };

  const board = game.board.map((row) => row.map((c) => (c ? { ...c } : null)));

  if (action === "flip") {
    const piece = board[fromR][fromC];
    if (!piece) return { ok: false, error: "No piece at position" };
    if (piece.faceUp) return { ok: false, error: "Piece is already face up" };
    piece.faceUp = true;
  } else if (action === "move") {
    if (toR === undefined || toC === undefined)
      return { ok: false, error: "Missing target position" };
    const piece = board[fromR][fromC];
    if (!piece) return { ok: false, error: "No piece at source" };
    if (piece.owner !== player)
      return { ok: false, error: "Cannot move opponent's piece" };
    if (!piece.faceUp) return { ok: false, error: "Piece is face down" };
    if (board[toR][toC]) return { ok: false, error: "Target is not empty" };
    const adj = getAdjacentPositions(fromR, fromC);
    if (!adj.some(([r, c]) => r === toR && c === toC))
      return { ok: false, error: "Target is not adjacent" };
    board[toR][toC] = piece;
    board[fromR][fromC] = null;
  } else if (action === "capture") {
    if (toR === undefined || toC === undefined)
      return { ok: false, error: "Missing target position" };
    const piece = board[fromR][fromC];
    const target = board[toR][toC];
    if (!piece) return { ok: false, error: "No piece at source" };
    if (piece.owner !== player)
      return { ok: false, error: "Cannot move opponent's piece" };
    if (!piece.faceUp) return { ok: false, error: "Piece is face down" };
    if (!target) return { ok: false, error: "No piece at target" };
    if (target.owner === player) return { ok: false, error: "Cannot capture own piece" };
    if (!target.faceUp) return { ok: false, error: "Target is face down" };
    if (piece.rank < target.rank)
      return { ok: false, error: "Cannot capture a stronger piece" };
    const adj = getAdjacentPositions(fromR, fromC);
    if (!adj.some(([r, c]) => r === toR && c === toC))
      return { ok: false, error: "Target is not adjacent" };

    if (piece.rank === target.rank) {
      board[fromR][fromC] = null;
      board[toR][toC] = null;
    } else {
      board[toR][toC] = piece;
      board[fromR][fromC] = null;
    }
  } else {
    return { ok: false, error: "Invalid action" };
  }

  const winner = checkWinner(board);
  const nextPlayer = player === 1 ? 2 : 1;

  const newGame: GameState = {
    ...game,
    board,
    currentPlayer: nextPlayer,
    winner,
    phase: winner ? "finished" : "playing",
  };

  return { ok: true, game: newGame };
}
