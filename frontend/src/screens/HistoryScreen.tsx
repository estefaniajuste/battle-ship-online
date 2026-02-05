import React, { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { useGame } from "../state/GameContext";
import { useAuth } from "../state/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://battle-ship-online.onrender.com" : "http://localhost:4000");

type HistoryEntry = {
  id: string;
  playedAt: string;
  winnerShots: number;
  loserShots: number;
  iWon: boolean;
};

export const HistoryScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { token } = useAuth();
  const [games, setGames] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/api/games/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then((data: { games: HistoryEntry[] }) => {
        if (!cancelled) setGames(data.games || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-text-main tracking-wide">
            Game History
          </h1>
          <p className="text-sm text-text-main/70">
            Your recent games. Log in to see and save history.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-6 text-center text-sm text-text-main/80">
            Log in to see your game history.
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setScreen("login")}
                className="rounded-full bg-[#1E3D2F] text-white px-4 py-2 text-sm font-medium"
              >
                Log in
              </button>
            </div>
          </div>
        ) : loading ? (
          <p className="text-center text-sm text-text-main/70">Loading…</p>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-6 text-center text-sm text-text-main/80">
            No games played yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {games.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-grid-deep/20 bg-background/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="text-text-main/80 shrink-0">
                  {formatDate(g.playedAt)}
                </span>
                <span className="text-text-main/70">
                  My shots: {g.iWon ? g.winnerShots : g.loserShots} · Opponent shots: {g.iWon ? g.loserShots : g.winnerShots}
                </span>
                <span
                  className={`font-medium shrink-0 ${g.iWon ? "text-[#1E3D2F]" : "text-stone-600"}`}
                >
                  {g.iWon ? "Victory" : "Defeat"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setScreen("home")}
          className="w-full rounded-full bg-[#1E3D2F] text-white px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all hover:bg-[#2A523F]"
        >
          Back to menu
        </button>
      </div>
    </MainLayout>
  );
};
