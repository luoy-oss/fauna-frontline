"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Lobby() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createGame = async () => {
    setLoading(true);
    setError("");
    try {
      const playerId = `p1_${Date.now()}`;
      const res = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`playerId:${data.gameId}`, playerId);
        router.push(`/game?id=${data.gameId}&player=1`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to create game");
    }
    setLoading(false);
  };

  const joinGame = async () => {
    if (!joinId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const playerId = `p2_${Date.now()}`;
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: joinId.trim().toLowerCase(), playerId }),
      });
      const data = await res.json();
      if (res.ok) {
        const gameId = joinId.trim().toLowerCase();
        localStorage.setItem(`playerId:${gameId}`, playerId);
        router.push(`/game?id=${gameId}&player=${data.player}`);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to join game");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🐾 Fauna Frontline</h1>
          <p className="text-slate-400">Animal Battle Strategy Game</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Create New Game</h2>
            <p className="text-sm text-slate-400 mb-4">
              Start a new game and share the link with your opponent.
            </p>
            <button
              onClick={createGame}
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create Game"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">OR</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Join Game</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Enter game code"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-500 text-center tracking-widest font-mono uppercase"
                maxLength={6}
              />
              <button
                onClick={joinGame}
                disabled={loading || !joinId.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
              >
                Join
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-3">Rules</h2>
          <ul className="text-sm text-slate-300 space-y-1.5">
            <li>• 4×7 board, 28 pieces (14 per side) placed face-down</li>
            <li>• Piece ranks: 🐘象 &gt; 🦁狮 &gt; 🐅虎 &gt; 🐆豹 &gt; 🐺狼 &gt; 🐕狗 &gt; 🐱猫 &gt; 🐀鼠</li>
            <li>• Each turn: flip a hidden piece, move 1 space, or capture</li>
            <li>• Equal-rank capture: both pieces are destroyed</li>
            <li>• Win by eliminating all enemy pieces</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
