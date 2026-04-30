import {
  Board,
  Cell,
  GameState,
  Piece,
  PieceRank,
  SkillAction,
  ROWS,
  COLS,
  PIECES,
} from "./types";
import {
  resolveElephantDeath,
  getLionTargets,
  getTigerTargets,
  getLeopardTargets,
  getCatDiagonalRats,
  getRatTargets,
  tryUpgrade,
} from "./skills";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isEmptyRow(r: number): boolean {
  return r === 2 || r === 3;
}

export function createBoard(): Board {
  const pieces: Piece[] = [];
  for (const p of PIECES) {
    for (let i = 0; i < p.count; i++) {
      pieces.push({
        rank: p.rank as PieceRank,
        owner: 1,
        faceUp: false,
        killCount: 0,
        skillUsed: 0,
      });
      pieces.push({
        rank: p.rank as PieceRank,
        owner: 2,
        faceUp: false,
        killCount: 0,
        skillUsed: 0,
      });
    }
  }
  const shuffled = shuffle(pieces);
  const board: Board = [];
  let idx = 0;
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      if (isEmptyRow(r)) {
        row.push(null);
      } else {
        row.push(shuffled[idx++]);
      }
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

function get4Neighbors(r: number, c: number): [number, number][] {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]]
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
): { ok: true; game: GameState; events: string[] } | { ok: false; error: string } {
  if (game.phase !== "playing")
    return { ok: false, error: "Game is not in progress" };
  if (game.currentPlayer !== player)
    return { ok: false, error: "Not your turn" };

  const board = game.board.map((row) => row.map((c) => (c ? { ...c } : null)));
  const events: string[] = [];

  if (action === "flip") {
    const piece = board[fromR][fromC];
    if (!piece) return { ok: false, error: "No piece at position" };
    if (piece.faceUp) return { ok: false, error: "Piece is already face up" };
    piece.faceUp = true;
    events.push(`翻开了一个棋子`);

  } else if (action === "move") {
    if (toR === undefined || toC === undefined)
      return { ok: false, error: "Missing target position" };
    const piece = board[fromR][fromC];
    if (!piece) return { ok: false, error: "No piece at source" };
    if (piece.owner !== player)
      return { ok: false, error: "Cannot move opponent's piece" };
    if (!piece.faceUp) return { ok: false, error: "Piece is face down" };
    if (board[toR][toC]) return { ok: false, error: "Target is not empty" };
    const adj = get4Neighbors(fromR, fromC);
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
    const canCapture = piece.rank >= target.rank || (piece.rank === 1 && target.rank === 8);
    if (!canCapture)
      return { ok: false, error: "Cannot capture a stronger piece" };
    const adj = get4Neighbors(fromR, fromC);
    if (!adj.some(([r, c]) => r === toR && c === toC))
      return { ok: false, error: "Target is not adjacent" };

    if (piece.rank === target.rank) {
      // 大小相同，同归于尽
      if (piece.rank === 8) {
        // 象死亡爆炸
        const { eliminated } = resolveElephantDeath(board, fromR, fromC);
        board[toR][toC] = null;
        events.push(`象死亡爆炸，周围 ${eliminated.length} 个棋子被消灭`);
      } else {
        board[fromR][fromC] = null;
        board[toR][toC] = null;
      }
    } else {
      // 大吃小
      if (target.rank === 8) {
        // 吃了象，象爆炸
        const { eliminated } = resolveElephantDeath(board, toR, toC);
        events.push(`象死亡爆炸，周围 ${eliminated.length} 个棋子被消灭`);
      } else {
        board[toR][toC] = piece;
        board[fromR][fromC] = null;
        piece.killCount++;
        // 狼/狗升级检查
        const upgraded = tryUpgrade(board, piece);
        if (upgraded) {
          piece.rank = upgraded;
          piece.killCount = 0;
          events.push(`棋子升级为${getInfo(upgraded)}！`);
        }
      }
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

  return { ok: true, game: newGame, events };
}

export function applySkill(
  game: GameState,
  player: 1 | 2,
  skill: SkillAction,
  fromR: number,
  fromC: number,
  targets?: [number, number][],
  toR?: number,
  toC?: number
): { ok: true; game: GameState; events: string[] } | { ok: false; error: string } {
  if (game.phase !== "playing")
    return { ok: false, error: "Game is not in progress" };
  if (game.currentPlayer !== player)
    return { ok: false, error: "Not your turn" };

  const board = game.board.map((row) => row.map((c) => (c ? { ...c } : null)));
  const events: string[] = [];

  switch (skill) {
    case "lion_skill": {
      const lion = board[fromR][fromC];
      if (!lion || lion.rank !== 7 || lion.owner !== player || !lion.faceUp)
        return { ok: false, error: "Invalid lion" };
      if (lion.skillUsed >= 1)
        return { ok: false, error: "Lion skill already used" };
      if (!targets || targets.length === 0)
        return { ok: false, error: "No targets" };
      if (targets.length > 2)
        return { ok: false, error: "Max 2 targets" };

      const validTargets = getLionTargets(board, fromR, fromC, player);
      for (const [tr, tc] of targets) {
        if (!validTargets.some(([r, c]) => r === tr && c === tc))
          return { ok: false, error: "Invalid target" };
      }

      for (const [tr, tc] of targets) {
        const t = board[tr][tc];
        if (t) {
          if (t.rank === 8) {
            const { eliminated } = resolveElephantDeath(board, tr, tc);
            events.push(`象死亡爆炸，周围 ${eliminated.length} 个棋子被消灭`);
          } else {
            board[tr][tc] = null;
          }
        }
      }
      lion.skillUsed = 1;
      events.push(`狮发动猎杀，消灭了 ${targets.length} 个棋子`);
      break;
    }

    case "tiger_skill": {
      const tiger = board[fromR][fromC];
      if (!tiger || tiger.rank !== 6 || tiger.owner !== player || !tiger.faceUp)
        return { ok: false, error: "Invalid tiger" };
      if (!toR || toC === undefined)
        return { ok: false, error: "Missing target" };

      const target = board[toR][toC];
      if (!target || !target.faceUp || target.owner === player || target.rank <= tiger.rank)
        return { ok: false, error: "Invalid target" };

      const validTargets = getTigerTargets(board, fromR, fromC, player);
      if (!validTargets.some(([r, c]) => r === toR && c === toC))
        return { ok: false, error: "Invalid target" };

      if (target.rank === 8) {
        resolveElephantDeath(board, toR, toC);
        board[fromR][fromC] = null;
        events.push(`虎与敌方同归于尽，象死亡爆炸`);
      } else {
        board[fromR][fromC] = null;
        board[toR][toC] = null;
        events.push(`虎与敌方${getInfo(target.rank)}同归于尽`);
      }
      break;
    }

    case "leopard_skill": {
      const leopard = board[fromR][fromC];
      if (!leopard || leopard.rank !== 5 || leopard.owner !== player || !leopard.faceUp)
        return { ok: false, error: "Invalid leopard" };
      if (leopard.skillUsed >= 2)
        return { ok: false, error: "Leopard skill already used" };
      if (toR === undefined || toC === undefined)
        return { ok: false, error: "Missing target" };

      const validTargets = getLeopardTargets(board, fromR, fromC);
      if (!validTargets.some(([r, c]) => r === toR && c === toC))
        return { ok: false, error: "Invalid target" };

      board[toR][toC] = leopard;
      board[fromR][fromC] = null;
      leopard.skillUsed++;
      events.push(`豹发动突进，移动两格`);
      break;
    }

    case "cat_skill": {
      const cat = board[fromR][fromC];
      if (!cat || cat.rank !== 2 || cat.owner !== player || !cat.faceUp)
        return { ok: false, error: "Invalid cat" };
      if (!toR || toC === undefined)
        return { ok: false, error: "Missing target" };

      const validTargets = getCatDiagonalRats(board, fromR, fromC, player);
      if (!validTargets.some(([r, c]) => r === toR && c === toC))
        return { ok: false, error: "Invalid target" };

      board[toR][toC] = cat;
      board[fromR][fromC] = null;
      cat.killCount++;
      events.push(`猫捕杀对角线老鼠`);

      const upgraded = tryUpgrade(board, cat);
      if (upgraded) {
        cat.rank = upgraded;
        cat.killCount = 0;
        events.push(`棋子升级为${getInfo(upgraded)}！`);
      }
      break;
    }

    case "rat_skill": {
      const rat = board[fromR][fromC];
      if (!rat || rat.rank !== 1 || rat.owner !== player || !rat.faceUp)
        return { ok: false, error: "Invalid rat" };
      if (rat.skillUsed >= 3)
        return { ok: false, error: "Rat skill already used" };
      if (toR === undefined || toC === undefined)
        return { ok: false, error: "Missing target" };

      const validTargets = getRatTargets(board, fromR, fromC, player);
      if (!validTargets.some(([r, c]) => r === toR && c === toC))
        return { ok: false, error: "Invalid target" };

      const target = board[toR][toC]!;
      const eatenRank = target.rank;
      rat.skillUsed++;
      rat.killCount++;

      if (eatenRank === 8) {
        resolveElephantDeath(board, toR, toC);
        board[fromR][fromC] = null;
        events.push(`鼠吃暗棋，触发象爆炸`);
      } else {
        board[toR][toC] = rat;
        board[fromR][fromC] = null;
        events.push(`鼠发动食暗，吃掉暗棋`);
      }

      const upgraded = tryUpgrade(board, rat);
      if (upgraded) {
        rat.rank = upgraded;
        rat.killCount = 0;
        events.push(`棋子升级为${getInfo(upgraded)}！`);
      }
      break;
    }

    default:
      return { ok: false, error: "Unknown skill" };
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

  return { ok: true, game: newGame, events };
}

function getInfo(rank: PieceRank): string {
  const names: Record<number, string> = {
    8: "象", 7: "狮", 6: "虎", 5: "豹",
    4: "狼", 3: "狗", 2: "猫", 1: "鼠",
  };
  return names[rank] || "";
}
