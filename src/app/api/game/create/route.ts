import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@/lib/game";
import { saveGame, getGame } from "@/lib/store";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(req: NextRequest) {
  const { playerId } = await req.json();
  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  let id: string;
  let attempts = 0;
  do {
    id = generateId();
    const existing = await getGame(id);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  const game = createGame(id!, playerId);
  await saveGame(game);

  return NextResponse.json({ gameId: id, player: 1 });
}
