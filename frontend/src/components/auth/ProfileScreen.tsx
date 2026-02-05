import React from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { useAuth } from "../../state/AuthContext";

export const ProfileScreen: React.FC = () => {
  const { setScreen } = useGame();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setScreen("home");
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-text-main tracking-wide">
            My profile
          </h1>
          <p className="text-sm text-text-main/70">
            Basic account information. More social features will appear here later.
          </p>
        </div>

        <div className="rounded-2xl border border-grid-deep/20 bg-background/70 px-6 py-5 space-y-3">
          <div className="flex justify-between text-sm text-text-main/80">
            <span className="font-medium">Username</span>
            <span className="text-text-main">{user?.username ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm text-text-main/80">
            <span className="font-medium">Email</span>
            <span className="text-text-main">{user?.email ?? "—"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="w-full rounded-full bg-[#1E3D2F] text-white px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all hover:bg-[#2A523F]"
          >
            Back to main menu
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-full border border-grid-deep/20 text-text-main px-6 py-3 text-sm font-medium uppercase tracking-wide hover:bg-grid-deep/5 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

