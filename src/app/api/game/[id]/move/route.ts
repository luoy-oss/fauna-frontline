import { NextRequest, NextResponse } from "next/server";
import { getGame, saveGame } from "@/lib/store";
import { applyMove, applySkill } from "@/lib/game";
import { SkillAction, GameState } from "@/lib/types";
import { isEmptyRow } from "@/lib/game";

interface CellView {
  rank?: number;
  owner?: number;
  faceUp: boolean;
  exists: boolean;
  killCount?: number;
  skillUsed?: number;
}

function buildBoardView(game: GameState): CellView[][] {
  return game.board.map((row, r) =>
    row.map((cell) => {
      if (isEmptyRow(r)) return { exists: false, faceUp: false };
      if (!cell) return { exists: false, faceUp: false };
      if (cell.faceUp) {
        return {
          rank: cell.rank,
          owner: cell.owner,
          faceUp: true,
          exists: true,
          killCount: cell.killCount,
          skillUsed: cell.skillUsed,
        };
      }
      return { faceUp: false, exists: true };
    })
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { playerId, action, skill, fromR, fromC, toR, toC, targets } = await req.json();

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let player: 1 | 2;
  if (game.player1 === playerId) {
    player = 1;
  } else if (game.player2 === playerId) {
    player = 2;
  } else {
    return NextResponse.json({ error: "Not a player in this game" }, { status: 403 });
  }

  let result;
  if (skill) {
    result = applySkill(game, player, skill as SkillAction, fromR, fromC, targets, toR, toC);
  } else {
    result = applyMove(game, player, action, fromR, fromC, toR, toC);
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await saveGame(result.game);

  const board = buildBoardView(result.game);
  return NextResponse.json({
    ok: true,
    events: result.events,
    state: {
      id: result.game.id,
      board,
      currentPlayer: result.game.currentPlayer,
      phase: result.game.phase,
      winner: result.game.winner,
      playerNumber: player,
    },
  });
}
