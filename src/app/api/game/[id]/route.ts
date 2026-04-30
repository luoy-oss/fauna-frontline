import { NextRequest, NextResponse } from "next/server";
import { getGame } from "@/lib/store";
import { GameState, Piece } from "@/lib/types";

interface CellView {
  rank?: number;
  owner?: number;
  faceUp: boolean;
  exists: boolean;
}

function buildBoardView(game: GameState, player: number): CellView[][] {
  return game.board.map((row) =>
    row.map((cell) => {
      if (!cell) return { exists: false, faceUp: false };
      if (cell.faceUp) {
        return { rank: cell.rank, owner: cell.owner, faceUp: true, exists: true };
      }
      if (cell.owner === player) {
        return { owner: cell.owner, faceUp: false, exists: true };
      }
      return { faceUp: false, exists: true };
    })
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const player = Number(req.nextUrl.searchParams.get("player"));

  const game = await getGame(id);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const board = buildBoardView(game, player);

  return NextResponse.json({
    id: game.id,
    board,
    currentPlayer: game.currentPlayer,
    phase: game.phase,
    winner: game.winner,
    player1: game.player1,
    player2: game.player2,
    playerNumber: player,
  });
}
