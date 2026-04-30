export const PIECES = [
  { rank: 8, name: "象", emoji: "🐘", count: 1 },
  { rank: 7, name: "狮", emoji: "🦁", count: 1 },
  { rank: 6, name: "虎", emoji: "🐅", count: 2 },
  { rank: 5, name: "豹", emoji: "🐆", count: 2 },
  { rank: 4, name: "狼", emoji: "🐺", count: 2 },
  { rank: 3, name: "狗", emoji: "🐕", count: 2 },
  { rank: 2, name: "猫", emoji: "🐱", count: 2 },
  { rank: 1, name: "鼠", emoji: "🐀", count: 2 },
] as const;

export type PieceRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Piece {
  rank: PieceRank;
  owner: 1 | 2;
  faceUp: boolean;
}

export type Cell = Piece | null;

export type Board = Cell[][];

export type GamePhase = "waiting" | "playing" | "finished";

export interface GameState {
  id: string;
  board: Board;
  currentPlayer: 1 | 2;
  phase: GamePhase;
  winner: 0 | 1 | 2;
  player1: string;
  player2: string;
  createdAt: number;
}

export const ROWS = 4;
export const COLS = 7;
export const PLAYER_PIECE_COUNT = 14;

export function getPieceInfo(rank: PieceRank) {
  return PIECES.find((p) => p.rank === rank)!;
}
