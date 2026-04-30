"use client";

import { useState, useEffect, useCallback } from "react";
import { PIECES, ROWS, COLS, getPieceInfo } from "@/lib/types";

interface CellView {
  rank?: number;
  owner?: number;
  faceUp: boolean;
  exists: boolean;
}

interface GameState {
  id: string;
  board: CellView[][];
  currentPlayer: 1 | 2;
  phase: string;
  winner: 0 | 1 | 2;
  player1: string;
  player2: string;
  playerNumber: number;
}

interface Props {
  gameId: string;
  playerNumber: number;
  playerId: string;
}

export default function GameBoard({ gameId, playerNumber, playerId }: Props) {
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [validCaptures, setValidCaptures] = useState<[number, number][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${gameId}?player=${playerNumber}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
      }
    } catch {}
  }, [gameId, playerNumber]);

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [fetchGame]);

  const getAdjacent = (r: number, c: number): [number, number][] => {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
  };

  const computeValidMoves = (r: number, c: number) => {
    if (!game) return;
    const adj = getAdjacent(r, c);
    const moves: [number, number][] = [];
    const captures: [number, number][] = [];
    const piece = game.board[r][c];

    for (const [nr, nc] of adj) {
      const cell = game.board[nr][nc];
      if (!cell.exists) {
        moves.push([nr, nc]);
      } else if (cell.faceUp && cell.owner !== playerNumber && piece.rank !== undefined) {
        if (piece.rank >= (cell.rank ?? 0)) {
          captures.push([nr, nc]);
        }
      }
    }
    setValidMoves(moves);
    setValidCaptures(captures);
  };

  const handleCellClick = async (r: number, c: number) => {
    if (!game || game.phase !== "playing" || loading) return;
    if (game.currentPlayer !== playerNumber) {
      setError("还没到你的回合");
      return;
    }

    const cell = game.board[r][c];

    // 点击空格 - 移动
    if (!cell.exists) {
      if (selected && validMoves.some(([mr, mc]) => mr === r && mc === c)) {
        await makeMove("move", selected[0], selected[1], r, c);
      }
      setSelected(null);
      setValidMoves([]);
      setValidCaptures([]);
      return;
    }

    // 点击暗棋 - 翻开
    if (!cell.faceUp) {
      if (cell.owner === playerNumber) {
        await makeMove("flip", r, c);
      } else {
        setError("不能翻开对手的棋子");
      }
      return;
    }

    // 点击己方明棋 - 选中
    if (cell.owner === playerNumber) {
      setSelected([r, c]);
      computeValidMoves(r, c);
      setError("");
      return;
    }

    // 点击敌方明棋 - 吃子
    if (selected && validCaptures.some(([cr, cc]) => cr === r && cc === c)) {
      await makeMove("capture", selected[0], selected[1], r, c);
    }
    setSelected(null);
    setValidMoves([]);
    setValidCaptures([]);
  };

  const makeMove = async (
    action: string,
    fromR: number,
    fromC: number,
    toR?: number,
    toC?: number
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          action,
          fromR,
          fromC,
          toR,
          toC,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSelected(null);
        setValidMoves([]);
        setValidCaptures([]);
        await fetchGame();
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  };

  const getCellDisplay = (cell: CellView, r: number, c: number) => {
    if (!cell.exists) return null;
    if (!cell.faceUp) {
      if (cell.owner === playerNumber) {
        return (
          <div className="w-full h-full bg-teal-800 rounded flex items-center justify-center border-2 border-teal-600">
            <span className="text-2xl">❓</span>
          </div>
        );
      }
      return (
        <div className="w-full h-full bg-slate-700 rounded flex items-center justify-center border-2 border-slate-600">
          <span className="text-2xl">❓</span>
        </div>
      );
    }
    const info = getPieceInfo(cell.rank as any);
    const isMine = cell.owner === playerNumber;
    return (
      <div
        className={`w-full h-full rounded flex flex-col items-center justify-center border-2 ${
          isMine
            ? "bg-amber-900/50 border-amber-500"
            : "bg-red-900/50 border-red-500"
        }`}
      >
        <span className="text-2xl leading-none">{info.emoji}</span>
        <span className="text-xs font-bold mt-0.5">{info.name}</span>
      </div>
    );
  };

  const isCellHighlighted = (r: number, c: number, type: "move" | "capture") => {
    const list = type === "move" ? validMoves : validCaptures;
    return list.some(([mr, mc]) => mr === r && mc === c);
  };

  const isCellSelected = (r: number, c: number) =>
    selected && selected[0] === r && selected[1] === c;

  if (!game) return <div className="text-center p-8">加载中...</div>;

  const isMyTurn = game.currentPlayer === playerNumber;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 状态栏 */}
      <div className="w-full max-w-xl flex items-center justify-between px-4">
        <div className="text-sm">
          <span className="text-slate-400">你是</span>{" "}
          <span className={playerNumber === 1 ? "text-amber-400" : "text-red-400"}>
            玩家 {playerNumber}
          </span>
        </div>
        {game.phase === "playing" && (
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMyTurn
                ? "bg-green-900/50 text-green-400"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {isMyTurn ? "你的回合" : "对手回合"}
          </div>
        )}
        {game.phase === "waiting" && (
          <div className="px-3 py-1 rounded text-sm bg-yellow-900/50 text-yellow-400">
            等待对手加入...
          </div>
        )}
        {game.phase === "finished" && (
          <div
            className={`px-3 py-1 rounded text-sm font-bold ${
              game.winner === playerNumber
                ? "bg-green-900/50 text-green-400"
                : "bg-red-900/50 text-red-400"
            }`}
          >
            {game.winner === playerNumber ? "你赢了！" : "你输了！"}
          </div>
        )}
      </div>

      {/* 棋盘 */}
      <div className="inline-grid gap-1 p-3 bg-slate-800 rounded-xl border border-slate-700"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {game.board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg transition-all duration-150 ${
                !cell.exists
                  ? "bg-slate-900"
                  : isCellSelected(r, c)
                  ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800 scale-105"
                  : isCellHighlighted(r, c, "move")
                  ? "ring-2 ring-blue-400/60 animate-pulse"
                  : isCellHighlighted(r, c, "capture")
                  ? "ring-2 ring-red-400/60 animate-pulse"
                  : "hover:scale-105 hover:brightness-110"
              }`}
              onClick={() => handleCellClick(r, c)}
              disabled={loading || game.phase !== "playing"}
            >
              {getCellDisplay(cell, r, c)}
            </button>
          ))
        )}
      </div>

      {/* 图例 */}
      <div className="flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-teal-800 border border-teal-600 rounded" />
          <span>己方暗棋</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-slate-700 border border-slate-600 rounded" />
          <span>敌方暗棋</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-900/50 border border-amber-500 rounded" />
          <span>己方明棋</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-900/50 border border-red-500 rounded" />
          <span>敌方明棋</span>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
          {error}
          <button className="ml-2 text-red-300 hover:text-red-100" onClick={() => setError("")}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
