"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import GameBoard from "@/components/GameBoard";
import Link from "next/link";

function GameContent() {
  const params = useSearchParams();
  const gameId = params.get("id");
  const player = params.get("player");
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (gameId) {
      const stored = localStorage.getItem(`playerId:${gameId}`);
      setPlayerId(stored);
    }
  }, [gameId]);

  if (!gameId || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Invalid game link</p>
          <Link href="/" className="text-amber-400 hover:text-amber-300 underline">
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  const playerNumber = parseInt(player, 10);
  if (playerNumber !== 1 && playerNumber !== 2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Invalid player number</p>
          <Link href="/" className="text-amber-400 hover:text-amber-300 underline">
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">Player identity not found. Please join from the lobby.</p>
          <Link href="/" className="text-amber-400 hover:text-amber-300 underline">
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🐾 Fauna Frontline</h1>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ← Lobby
          </Link>
        </div>

        {/* Share game code */}
        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-sm text-slate-400 shrink-0">Game Code:</span>
          <code className="text-lg text-amber-400 font-mono tracking-widest">
            {gameId.toUpperCase()}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gameId.toUpperCase());
            }}
            className="shrink-0 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
          >
            Copy
          </button>
        </div>

        <GameBoard gameId={gameId} playerNumber={playerNumber} playerId={playerId} />
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Loading...
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
