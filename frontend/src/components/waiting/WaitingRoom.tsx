import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { leaveRoom } from "../../services/gameApi";

export const WaitingRoom: React.FC = () => {
  const { roomCode, opponentName, socket, setScreen, setRoomCode, setResult, setPlayersReady } = useGame();
  const [copied, setCopied] = useState(false);

  const handleBackToMenu = useCallback(() => {
    if (socket && roomCode) {
      leaveRoom(socket, roomCode);
    }
    setScreen("home");
    setRoomCode(null);
    setResult(null);
    setPlayersReady({});
  }, [socket, roomCode, setScreen, setRoomCode, setResult, setPlayersReady]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBackToMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleBackToMenu]);

  const handleCopy = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <MainLayout>
      <div className="space-y-10 animate-slide-up">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold text-text-main">Waiting for opponent…</h2>
          <p className="text-sm text-text-main/65 max-w-md mx-auto">
            Share your room code with a friend. The game will start automatically when your opponent joins.
          </p>
        </div>

        <div className="space-y-6">
          {/* Room Code Display */}
          <div className="rounded-2xl border-2 border-grid-deep/20 bg-background/60 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-grid-deep/30 transition-colors">
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs uppercase tracking-wide text-text-main/60 block mb-2">Room Code</span>
              <p className="text-2xl font-mono tracking-[0.4em] text-text-main font-semibold">
                {roomCode ?? "— — — — — —"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!roomCode}
              className="shrink-0 rounded-full border border-grid-deep/20 bg-white/50 text-text-main px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 hover:bg-grid-deep/5 hover:border-grid-deep/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-xs text-text-main/60 text-center">
            Share this code with a friend to play.
          </p>

          {/* BACK TO MENU - same brown style as JOIN ROOM (#8B6F47) */}
          <div>
            <button
              type="button"
              onClick={handleBackToMenu}
              className="w-full rounded-full bg-[#8B6F47] text-white px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:scale-[1.02] hover:bg-[#9B7F57] active:translate-y-0 active:scale-100"
            >
              BACK TO MENU
            </button>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {opponentName ? (
              <div className="space-y-2">
                <p className="text-sm text-text-main/70">
                  Opponent <span className="font-semibold text-text-main">{opponentName}</span> joined.
                </p>
                <p className="text-xs text-text-main/60">Get ready to place your ships.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text-main/70">Waiting for someone to connect…</p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-accent-primary/60 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-accent-primary/60 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-accent-primary/60 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

