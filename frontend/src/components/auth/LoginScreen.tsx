import React, { useState } from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { useAuth } from "../../state/AuthContext";

export const LoginScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message || "Failed to login");
      return;
    }
    setScreen("home");
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-text-main tracking-wide">
            Log in
          </h1>
          <p className="text-sm text-text-main/70">
            Access your account to play as a registered player.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#1E3D2F] text-white px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#2A523F]"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setScreen("home")}
          className="w-full rounded-full border border-grid-deep/20 text-text-main px-6 py-3 text-sm font-medium uppercase tracking-wide hover:bg-grid-deep/5 transition-colors"
        >
          Back to main menu
        </button>
      </div>
    </MainLayout>
  );
};

