import { NextRequest, NextResponse } from "next/server";
import { getGame, saveGame } from "@/lib/store";

export async function POST(req: NextRequest) {
  const { gameId, playerId } = await req.json();
  if (!gameId || !playerId) {
    return NextResponse.json(
      { error: "Missing gameId or playerId" },
      { status: 400 }
    );
  }

  const game = await getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (game.player2) {
    if (game.player1 === playerId) return NextResponse.json({ player: 1 });
    if (game.player2 === playerId) return NextResponse.json({ player: 2 });
    return NextResponse.json({ error: "Game is full" }, { status: 400 });
  }

  if (game.player1 === playerId) {
    return NextResponse.json({ error: "Cannot join your own game" }, { status: 400 });
  }

  game.player2 = playerId;
  game.phase = "playing";
  await saveGame(game);

  return NextResponse.json({ player: 2 });
}
