import { NextRequest, NextResponse } from "next/server";
import { getGame, saveGame } from "@/lib/store";
import { applyMove } from "@/lib/game";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { playerId, action, fromR, fromC, toR, toC } = await req.json();

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

  const result = applyMove(game, player, action, fromR, fromC, toR, toC);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await saveGame(result.game);
  return NextResponse.json({ ok: true });
}
