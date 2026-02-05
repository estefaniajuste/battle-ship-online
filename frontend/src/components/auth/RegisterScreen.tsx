import React, { useState } from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { useAuth } from "../../state/AuthContext";

export const RegisterScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await register(username, email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message || "Failed to register");
      return;
    }
    setSuccess("Account created. You can now log in.");
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-text-main tracking-wide">
            Create account
          </h1>
          <p className="text-sm text-text-main/70">
            Register to play with a persistent identity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20"
              placeholder="Choose a username"
            />
          </div>

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
              placeholder="Create a password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-700 font-medium">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#1E3D2F] text-white px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#2A523F]"
          >
            {submitting ? "Creating account…" : "Create account"}
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

