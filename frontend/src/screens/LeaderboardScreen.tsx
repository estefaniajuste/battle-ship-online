import React, { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { useGame } from "../state/GameContext";
import { useAuth } from "../state/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://battle-ship-online.onrender.com" : "http://localhost:4000");

type LeaderboardPlayer = {
  username: string;
  wins: number;
  losses: number;
  winRate: number;
};

export const LeaderboardScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { token } = useAuth();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
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
    fetch(`${API_URL}/api/games/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leaderboard");
        return res.json();
      })
      .then((data: { players: LeaderboardPlayer[] }) => {
        if (!cancelled) setPlayers(data.players || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-text-main tracking-wide">
            Global Ranking
          </h1>
          <p className="text-sm text-text-main/70">
            Top 20 players by win rate and wins.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-6 text-center text-sm text-text-main/80">
            Log in to view the leaderboard.
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
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-6 text-center text-sm text-text-main/80">
            No players on the leaderboard yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-grid-deep/20 bg-background/50 text-text-main/80 font-medium">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Wins</th>
                  <th className="px-4 py-3">Losses</th>
                  <th className="px-4 py-3">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={`${p.username}-${i}`} className="border-b border-grid-deep/10 text-text-main/90">
                    <td className="px-4 py-2.5 font-medium">{i + 1}</td>
                    <td className="px-4 py-2.5">{p.username}</td>
                    <td className="px-4 py-2.5">{p.wins}</td>
                    <td className="px-4 py-2.5">{p.losses}</td>
                    <td className="px-4 py-2.5">{p.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
