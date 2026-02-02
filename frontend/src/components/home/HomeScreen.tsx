import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { createRoom, joinRoom, queueMatch, cancelQueue } from "../../services/gameApi";

const MATCHMAKING_TIMEOUT_MS = 60_000;

export const HomeScreen: React.FC = () => {
  const {
    playerName,
    setPlayerName,
    setScreen,
    socket,
    setRoomCode,
    setMatchmaking,
    matchmaking,
    setPlayersReady,
    setResult,
    setPlayerId
  } = useGame();
  const [roomInput, setRoomInput] = useState("");
  const [loadingAction, setLoadingAction] = useState<"create" | "join" | "play" | null>(null);
  const [matchmakingTimeout, setMatchmakingTimeout] = useState(false);

  const effectiveName = playerName || "Player";

  const handleCancelSearch = useCallback(() => {
    if (socket) {
      cancelQueue(socket);
    }
    setMatchmaking(false);
    setScreen("home");
    setRoomCode(null);
    setResult(null);
    setPlayersReady({});
    setMatchmakingTimeout(false);
  }, [socket, setMatchmaking, setScreen, setRoomCode, setResult, setPlayersReady]);

  useEffect(() => {
    if (!matchmaking) {
      setMatchmakingTimeout(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setMatchmakingTimeout(true);
    }, MATCHMAKING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [matchmaking]);

  useEffect(() => {
    if (!matchmaking) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [matchmaking, handleCancelSearch]);

  const handleCreateRoom = async () => {
    if (!socket) {
      alert("Connecting to server... Please wait.");
      return;
    }
    setLoadingAction("create");
    setResult(null);
    setPlayersReady({});
    const response = await createRoom(socket, effectiveName);
    setLoadingAction(null);
    if (response.ok && response.roomCode && response.playerId) {
      setRoomCode(response.roomCode);
      if (response.playerId) setPlayerId(response.playerId);
      setScreen("waiting");
    } else {
      alert(response.error || "Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!socket) {
      alert("Connecting to server... Please wait.");
      return;
    }
    if (!roomInput.trim()) {
      alert("Please enter a room code");
      return;
    }
    setLoadingAction("join");
    setResult(null);
    setPlayersReady({});
    const response = await joinRoom(socket, roomInput.trim().toUpperCase(), effectiveName);
    setLoadingAction(null);
    if (response.ok && response.roomCode && response.playerId) {
      setRoomCode(response.roomCode);
      if (response.playerId) setPlayerId(response.playerId);
      // Do NOT setScreen("placement") here — both host and guest navigate via room:ready from server
    } else {
      alert(response.error || "Failed to join room");
    }
  };

  const handlePlayOnline = async () => {
    if (!socket) {
      alert("Connecting to server... Please wait.");
      return;
    }
    setLoadingAction("play");
    setMatchmaking(true);
    setMatchmakingTimeout(false);
    setResult(null);
    setPlayersReady({});
    const res = await queueMatch(socket, effectiveName);
    if (!res.ok) {
      setMatchmaking(false);
      setMatchmakingTimeout(false);
      alert(res.error || "Failed to start matchmaking");
    }
    setLoadingAction(null);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Player Name Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-main/70 uppercase tracking-wide">
            Player Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            maxLength={20}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20"
          />
        </div>

        {/* Create New Room Button - Orange #D97706 */}
        <div>
          <button
            onClick={handleCreateRoom}
            disabled={loadingAction === "create" || matchmaking}
            className="w-full rounded-full bg-[#D97706] text-white px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:scale-[1.02] hover:bg-[#E07B0A] active:translate-y-0 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            {loadingAction === "create" ? "Creating room..." : "CREATE NEW ROOM"}
          </button>
        </div>

        {/* Join Room */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter room code"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={6}
            className="w-full rounded-full border border-grid-deep/20 bg-white/80 px-5 py-3 text-sm text-text-main outline-none transition-all duration-200 placeholder:text-text-main/40 hover:border-grid-deep/30 hover:bg-white focus:border-accent-primary focus:bg-white focus:ring-2 focus:ring-accent-primary/20"
          />
          <button
            onClick={handleJoinRoom}
            disabled={!roomInput.trim() || loadingAction === "join" || matchmaking}
            className="w-full rounded-full bg-[#8B6F47] text-white px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:scale-[1.02] hover:bg-[#9B7F57] active:translate-y-0 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            {loadingAction === "join" ? "Joining..." : "JOIN ROOM"}
          </button>
        </div>

        {/* Play Online - Deep green #1E3D2F, hover #2A523F */}
        <div className="pt-6 border-t border-grid-deep/10 space-y-3">
          <button
            onClick={handlePlayOnline}
            disabled={matchmaking || loadingAction === "play"}
            className="w-full rounded-full bg-[#1E3D2F] text-[#FFFFFF] px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:scale-[1.02] hover:bg-[#2A523F] active:translate-y-0 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            {matchmaking || loadingAction === "play" ? "Searching for opponent…" : "PLAY ONLINE"}
          </button>

          {/* Matchmaking UI: indicator, messages, timeout, cancel */}
          {matchmaking && (
            <div className="space-y-3 rounded-2xl border border-grid-deep/20 bg-background/60 px-4 py-4">
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-pulse" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-pulse" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-accent-primary/80 animate-pulse" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-text-main/80">Searching for opponent…</span>
              </div>
              <p className="text-xs text-text-main/60 text-center">
                Waiting for another online player…
              </p>
              {matchmakingTimeout && (
                <p className="text-xs text-amber-700/90 text-center font-medium">
                  No players available at the moment. Try again later.
                </p>
              )}
              <button
                type="button"
                onClick={handleCancelSearch}
                className="w-full rounded-full bg-[#8B6F47] text-white px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-md hover:scale-[1.02] hover:bg-[#9B7F57] active:translate-y-0 active:scale-100"
              >
                CANCEL SEARCH
              </button>
              <p className="text-xs text-text-main/50 text-center">
                Press ESC to cancel
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
