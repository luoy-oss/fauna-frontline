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
  killCount: number;
  skillUsed: number;
}

export type Cell = Piece | null;

export type Board = Cell[][];

export type GamePhase = "waiting" | "playing" | "finished";

export type SkillAction =
  | "lion_skill"
  | "tiger_skill"
  | "leopard_skill"
  | "cat_skill"
  | "rat_skill";

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

export const ROWS = 6;
export const COLS = 7;
export const PLAYER_PIECE_COUNT = 14;

export function getPieceInfo(rank: PieceRank) {
  return PIECES.find((p) => p.rank === rank)!;
}

export function getSkillName(rank: PieceRank): string {
  switch (rank) {
    case 8: return "死亡爆炸";
    case 7: return "猎杀";
    case 6: return "同归";
    case 5: return "突进";
    case 4: return "升级";
    case 3: return "升级";
    case 2: return "捕鼠";
    case 1: return "食暗";
    default: return "";
  }
}
