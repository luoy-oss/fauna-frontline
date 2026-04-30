import { Redis } from "@upstash/redis";
import { GameState } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const PREFIX = "game:";

export async function saveGame(game: GameState): Promise<void> {
  await redis.set(`${PREFIX}${game.id}`, JSON.stringify(game));
}

export async function getGame(id: string): Promise<GameState | null> {
  const data = await redis.get<string>(`${PREFIX}${id}`);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

export async function deleteGame(id: string): Promise<void> {
  await redis.del(`${PREFIX}${id}`);
}
