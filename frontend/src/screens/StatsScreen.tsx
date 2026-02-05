import React, { useEffect, useState } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { useGame } from "../state/GameContext";
import { useAuth } from "../state/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://battle-ship-online.onrender.com" : "http://localhost:4000");

type Stats = {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  averageShotsPerGame: number;
  bestGame: number | null;
};

export const StatsScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
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
    fetch(`${API_URL}/api/games/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then((data: Stats) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load stats");
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
            My Stats
          </h1>
          <p className="text-sm text-text-main/70">
            Your personal battle statistics.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-6 text-center text-sm text-text-main/80">
            Log in to see your statistics.
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
        ) : stats ? (
          <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-5 space-y-4">
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Total games</span>
              <span className="text-text-main">{stats.totalGames}</span>
            </div>
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Wins</span>
              <span className="text-text-main text-[#1E3D2F] font-medium">{stats.totalWins}</span>
            </div>
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Losses</span>
              <span className="text-text-main text-stone-600 font-medium">{stats.totalLosses}</span>
            </div>
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Win rate</span>
              <span className="text-text-main">{stats.winRate}%</span>
            </div>
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Average shots per game</span>
              <span className="text-text-main">{stats.averageShotsPerGame}</span>
            </div>
            <div className="flex justify-between text-sm text-text-main/80">
              <span className="font-medium">Best game (fewest shots in a win)</span>
              <span className="text-text-main">{stats.bestGame !== null ? stats.bestGame : "—"}</span>
            </div>
          </div>
        ) : null}

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
