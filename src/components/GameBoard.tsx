"use client";

import { useState, useEffect, useCallback } from "react";
import { ROWS, COLS, getPieceInfo, getSkillName, SkillAction } from "@/lib/types";

interface CellView {
  rank?: number;
  owner?: number;
  faceUp: boolean;
  exists: boolean;
  killCount?: number;
  skillUsed?: number;
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

type SkillMode = {
  skill: SkillAction;
  fromR: number;
  fromC: number;
  multiSelect?: boolean;
};

const EMPTY_ROWS = [2, 3];

export default function GameBoard({ gameId, playerNumber, playerId }: Props) {
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [validCaptures, setValidCaptures] = useState<[number, number][]>([]);
  const [skillMode, setSkillMode] = useState<SkillMode | null>(null);
  const [skillTargets, setSkillTargets] = useState<[number, number][]>([]);
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

  const get4Neighbors = (r: number, c: number): [number, number][] => {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
  };

  const getDiagonalNeighbors = (r: number, c: number): [number, number][] => {
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
  };

  const computeValidMoves = (r: number, c: number) => {
    if (!game) return;
    const adj = get4Neighbors(r, c);
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

  const getAvailableSkills = (r: number, c: number): SkillAction[] => {
    if (!game) return [];
    const cell = game.board[r][c];
    if (!cell || !cell.faceUp || cell.owner !== playerNumber) return [];

    const skills: SkillAction[] = [];
    switch (cell.rank) {
      case 7: // 狮
        if ((cell.skillUsed ?? 0) < 1) {
          const targets = getLionTargets(r, c);
          if (targets.length > 0) skills.push("lion_skill");
        }
        break;
      case 6: // 虎
        if (getTigerTargets(r, c).length > 0) skills.push("tiger_skill");
        break;
      case 5: // 豹
        if ((cell.skillUsed ?? 0) < 2 && getLeopardTargets(r, c).length > 0)
          skills.push("leopard_skill");
        break;
      case 2: // 猫
        if (getCatTargets(r, c).length > 0) skills.push("cat_skill");
        break;
      case 1: // 鼠
        if ((cell.skillUsed ?? 0) < 3 && getRatTargets(r, c).length > 0)
          skills.push("rat_skill");
        break;
    }
    return skills;
  };

  const getLionTargets = (r: number, c: number): [number, number][] => {
    if (!game) return [];
    const piece = game.board[r][c];
    if (!piece) return [];
    return get4Neighbors(r, c).filter(([nr, nc]) => {
      const t = game.board[nr][nc];
      return t && t.owner !== playerNumber && t.faceUp && (t.rank ?? 0) < (piece.rank ?? 0);
    });
  };

  const getTigerTargets = (r: number, c: number): [number, number][] => {
    if (!game) return [];
    const piece = game.board[r][c];
    if (!piece) return [];
    return get4Neighbors(r, c).filter(([nr, nc]) => {
      const t = game.board[nr][nc];
      return t && t.owner !== playerNumber && t.faceUp && (t.rank ?? 0) > (piece.rank ?? 0);
    });
  };

  const getLeopardTargets = (r: number, c: number): [number, number][] => {
    if (!game) return [];
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const targets: [number, number][] = [];
    for (const [dr, dc] of dirs) {
      const mr = r + dr;
      const mc = c + dc;
      if (mr < 0 || mr >= ROWS || mc < 0 || mc >= COLS) continue;
      if (game.board[mr][mc]?.exists) continue;
      const tr = mr + dr;
      const tc = mc + dc;
      if (tr < 0 || tr >= ROWS || tc < 0 || tc >= COLS) continue;
      if (!game.board[tr][tc]?.exists) targets.push([tr, tc]);
    }
    return targets;
  };

  const getCatTargets = (r: number, c: number): [number, number][] => {
    if (!game) return [];
    return getDiagonalNeighbors(r, c).filter(([nr, nc]) => {
      const t = game.board[nr][nc];
      return t && t.rank === 1 && t.owner !== playerNumber && t.faceUp;
    });
  };

  const getRatTargets = (r: number, c: number): [number, number][] => {
    if (!game) return [];
    return get4Neighbors(r, c).filter(([nr, nc]) => {
      const t = game.board[nr][nc];
      return t && t.exists && !t.faceUp;
    });
  };

  const handleCellClick = async (r: number, c: number) => {
    if (!game || game.phase !== "playing" || loading) return;
    if (game.currentPlayer !== playerNumber) {
      setError("还没到你的回合");
      return;
    }
    if (EMPTY_ROWS.includes(r)) return;

    const cell = game.board[r][c];

    // 技能模式下的点击
    if (skillMode) {
      await handleSkillTargetClick(r, c);
      return;
    }

    // 点击空格 - 移动
    if (!cell.exists) {
      if (selected && validMoves.some(([mr, mc]) => mr === r && mc === c)) {
        await makeMove("move", selected[0], selected[1], r, c);
      }
      clearSelection();
      return;
    }

    // 点击暗棋 - 翻开
    if (!cell.faceUp) {
      await makeMove("flip", r, c);
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
    clearSelection();
  };

  const handleSkillTargetClick = async (r: number, c: number) => {
    if (!skillMode) return;

    if (skillMode.skill === "lion_skill") {
      // 狮技能：多选目标
      const idx = skillTargets.findIndex(([tr, tc]) => tr === r && tc === c);
      if (idx >= 0) {
        setSkillTargets(skillTargets.filter((_, i) => i !== idx));
      } else {
        const valid = getLionTargets(skillMode.fromR, skillMode.fromC);
        if (valid.some(([vr, vc]) => vr === r && vc === c) && skillTargets.length < 2) {
          setSkillTargets([...skillTargets, [r, c]]);
        }
      }
      return;
    }

    // 单选目标技能
    let toR = r, toC = c;
    const valid = getSkillValidTargets(skillMode.skill, skillMode.fromR, skillMode.fromC);
    if (!valid.some(([vr, vc]) => vr === r && vc === c)) {
      setError("无效的目标");
      return;
    }
    await executeSkill([[toR, toC]]);
  };

  const getSkillValidTargets = (skill: SkillAction, r: number, c: number): [number, number][] => {
    switch (skill) {
      case "lion_skill": return getLionTargets(r, c);
      case "tiger_skill": return getTigerTargets(r, c);
      case "leopard_skill": return getLeopardTargets(r, c);
      case "cat_skill": return getCatTargets(r, c);
      case "rat_skill": return getRatTargets(r, c);
      default: return [];
    }
  };

  const executeSkill = async (targets: [number, number][]) => {
    if (!skillMode) return;
    setLoading(true);
    setError("");
    try {
      const body: any = {
        playerId,
        skill: skillMode.skill,
        fromR: skillMode.fromR,
        fromC: skillMode.fromC,
      };
      if (skillMode.skill === "lion_skill") {
        body.targets = targets;
      } else {
        body.toR = targets[0][0];
        body.toC = targets[0][1];
      }

      const res = await fetch(`/api/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        clearSkillMode();
        clearSelection();
        await fetchGame();
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  };

  const confirmLionSkill = async () => {
    if (skillTargets.length === 0) {
      setError("请选择至少一个目标");
      return;
    }
    await executeSkill(skillTargets);
  };

  const startSkill = (skill: SkillAction, r: number, c: number) => {
    clearSelection();
    setSkillMode({ skill, fromR: r, fromC: c, multiSelect: skill === "lion_skill" });
    setSkillTargets([]);
    setError("");
  };

  const clearSkillMode = () => {
    setSkillMode(null);
    setSkillTargets([]);
  };

  const clearSelection = () => {
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
        body: JSON.stringify({ playerId, action, fromR, fromC, toR, toC }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        clearSelection();
        await fetchGame();
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  };

  const getCellDisplay = (cell: CellView) => {
    if (!cell.exists) return null;
    if (!cell.faceUp) {
      return (
        <div className="w-full h-full bg-slate-700 rounded flex items-center justify-center border-2 border-slate-500 hover:border-slate-400 transition-colors">
          <span className="text-2xl">❓</span>
        </div>
      );
    }
    const info = getPieceInfo(cell.rank as any);
    const isMine = cell.owner === playerNumber;
    const skillCount = cell.skillUsed ?? 0;
    const kills = cell.killCount ?? 0;
    return (
      <div
        className={`w-full h-full rounded flex flex-col items-center justify-center border-2 relative ${
          isMine
            ? "bg-amber-900/50 border-amber-500"
            : "bg-red-900/50 border-red-500"
        }`}
      >
        <span className="text-2xl leading-none">{info.emoji}</span>
        <span className="text-xs font-bold mt-0.5">{info.name}</span>
        {skillCount > 0 && (
          <span className="absolute top-0 right-0.5 text-[9px] text-yellow-400">
            {skillCount}
          </span>
        )}
        {kills > 0 && (
          <span className="absolute bottom-0 left-0.5 text-[9px] text-green-400">
            {kills}杀
          </span>
        )}
      </div>
    );
  };

  const isCellHighlighted = (r: number, c: number, type: "move" | "capture") => {
    const list = type === "move" ? validMoves : validCaptures;
    return list.some(([mr, mc]) => mr === r && mc === c);
  };

  const isSkillTarget = (r: number, c: number) => {
    if (!skillMode) return false;
    const valid = getSkillValidTargets(skillMode.skill, skillMode.fromR, skillMode.fromC);
    return valid.some(([vr, vc]) => vr === r && vc === c);
  };

  const isSkillSelectedTarget = (r: number, c: number) => {
    return skillTargets.some(([tr, tc]) => tr === r && tc === c);
  };

  const isCellSelected = (r: number, c: number) =>
    (selected && selected[0] === r && selected[1] === c) ||
    (skillMode && skillMode.fromR === r && skillMode.fromC === c);

  if (!game) return <div className="text-center p-8">加载中...</div>;

  const isMyTurn = game.currentPlayer === playerNumber;
  const selectedSkills = selected ? getAvailableSkills(selected[0], selected[1]) : [];

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

      {/* 技能面板 */}
      {selected && selectedSkills.length > 0 && !skillMode && (
        <div className="flex gap-2 flex-wrap justify-center">
          {selectedSkills.map((skill) => {
            const cell = game.board[selected[0]][selected[1]];
            return (
              <button
                key={skill}
                onClick={() => startSkill(skill, selected[0], selected[1])}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-sm font-medium transition-colors"
              >
                {getSkillName(cell.rank! as any)} {skill === "lion_skill" ? "(选1-2目标)" : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* 狮技能确认 */}
      {skillMode?.skill === "lion_skill" && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-slate-400">
            已选 {skillTargets.length}/2 个目标
          </span>
          <button
            onClick={confirmLionSkill}
            disabled={skillTargets.length === 0}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 rounded text-sm transition-colors"
          >
            确认猎杀
          </button>
          <button
            onClick={clearSkillMode}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* 棋盘 */}
      <div
        className="inline-grid gap-1 p-3 bg-slate-800 rounded-xl border border-slate-700"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
      >
        {game.board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg transition-all duration-150 ${
                EMPTY_ROWS.includes(r)
                  ? "bg-transparent cursor-default"
                  : !cell.exists
                  ? "bg-slate-900"
                  : isCellSelected(r, c)
                  ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-800 scale-105"
                  : isSkillSelectedTarget(r, c)
                  ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-800"
                  : isSkillTarget(r, c)
                  ? "ring-2 ring-purple-400/60 animate-pulse"
                  : isCellHighlighted(r, c, "move")
                  ? "ring-2 ring-blue-400/60 animate-pulse"
                  : isCellHighlighted(r, c, "capture")
                  ? "ring-2 ring-red-400/60 animate-pulse"
                  : "hover:scale-105 hover:brightness-110"
              }`}
              onClick={() => handleCellClick(r, c)}
              disabled={loading || game.phase !== "playing" || EMPTY_ROWS.includes(r)}
            >
              {EMPTY_ROWS.includes(r) ? null : getCellDisplay(cell)}
            </button>
          ))
        )}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-slate-700 border border-slate-500 rounded" />
          <span>暗棋（未知）</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-900/50 border border-amber-500 rounded" />
          <span>己方明棋</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-900/50 border border-red-500 rounded" />
          <span>敌方明棋</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-900/50 border border-purple-400 rounded" />
          <span>技能目标</span>
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
