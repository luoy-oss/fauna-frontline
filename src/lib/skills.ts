import { Board, Piece, PieceRank, ROWS, COLS, getPieceInfo } from "./types";

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function get8Neighbors(r: number, c: number): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) result.push([nr, nc]);
    }
  }
  return result;
}

function get4Neighbors(r: number, c: number): [number, number][] {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]]
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => inBounds(nr, nc));
}

function getDiagonalNeighbors(r: number, c: number): [number, number][] {
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => inBounds(nr, nc));
}

export function resolveElephantDeath(
  board: Board,
  r: number,
  c: number
): { board: Board; eliminated: [number, number][] } {
  const piece = board[r][c];
  if (!piece || piece.rank !== 8) return { board, eliminated: [] };

  const eliminated: [number, number][] = [];
  const neighbors = get8Neighbors(r, c);
  for (const [nr, nc] of neighbors) {
    if (board[nr][nc]) {
      eliminated.push([nr, nc]);
      board[nr][nc] = null;
    }
  }
  board[r][c] = null;
  eliminated.push([r, c]);
  return { board, eliminated };
}

export function getLionTargets(
  board: Board,
  lionR: number,
  lionC: number,
  player: 1 | 2
): [number, number][] {
  const lion = board[lionR][lionC];
  if (!lion) return [];
  const neighbors = get4Neighbors(lionR, lionC);
  return neighbors.filter(([nr, nc]) => {
    const t = board[nr][nc];
    return t && t.owner !== player && t.faceUp && t.rank < lion.rank;
  });
}

export function getTigerTargets(
  board: Board,
  tigerR: number,
  tigerC: number,
  player: 1 | 2
): [number, number][] {
  const tiger = board[tigerR][tigerC];
  if (!tiger) return [];
  const neighbors = get4Neighbors(tigerR, tigerC);
  return neighbors.filter(([nr, nc]) => {
    const t = board[nr][nc];
    return t && t.owner !== player && t.faceUp && t.rank > tiger.rank;
  });
}

export function getLeopardTargets(
  board: Board,
  r: number,
  c: number
): [number, number][] {
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const targets: [number, number][] = [];
  for (const [dr, dc] of dirs) {
    const mr = r + dr;
    const mc = c + dc;
    if (!inBounds(mr, mc)) continue;
    if (board[mr][mc]) continue;
    const tr = mr + dr;
    const tc = mc + dc;
    if (!inBounds(tr, tc)) continue;
    if (!board[tr][tc]) targets.push([tr, tc]);
  }
  return targets;
}

export function getCatDiagonalRats(
  board: Board,
  catR: number,
  catC: number,
  player: 1 | 2
): [number, number][] {
  const diagonals = getDiagonalNeighbors(catR, catC);
  return diagonals.filter(([nr, nc]) => {
    const t = board[nr][nc];
    return t && t.rank === 1 && t.owner !== player && t.faceUp;
  });
}

export function getRatTargets(
  board: Board,
  ratR: number,
  ratC: number,
  player: 1 | 2
): [number, number][] {
  const neighbors = get4Neighbors(ratR, ratC);
  return neighbors.filter(([nr, nc]) => {
    const t = board[nr][nc];
    return t && !t.faceUp;
  });
}

export function tryUpgrade(board: Board, piece: Piece): PieceRank | null {
  if (piece.rank !== 4 && piece.rank !== 3) return null;
  if (piece.killCount < 2) return null;
  const newRank = (piece.rank + 1) as PieceRank;
  if (newRank > 8) return null;
  return newRank;
}
