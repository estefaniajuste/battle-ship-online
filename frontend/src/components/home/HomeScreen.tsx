import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "../layout/MainLayout";
import { useGame } from "../../state/GameContext";
import { createRoom, joinRoom, queueMatch, cancelQueue } from "../../services/gameApi";

const MATCHMAKING_TIMEOUT_MS = 60_000;

const MENU_COLORS = {
  darkGreen: "#1E3D2F",
  orange: "#D97A1F",
  brown: "#7C5C20"
};

type OnlineStep = "options" | "create" | "join" | "random";

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
    setPlayerId,
    effectivePlayerName
  } = useGame();
  const [roomInput, setRoomInput] = useState("");
  const [loadingAction, setLoadingAction] = useState<"create" | "join" | "play" | null>(null);
  const [matchmakingTimeout, setMatchmakingTimeout] = useState(false);
  const [playOnlineOpen, setPlayOnlineOpen] = useState(false);
  const [onlineStep, setOnlineStep] = useState<OnlineStep>("options");

  const handleCancelSearch = useCallback(() => {
    if (socket) cancelQueue(socket);
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
    const timer = window.setTimeout(() => setMatchmakingTimeout(true), MATCHMAKING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [matchmaking]);

  useEffect(() => {
    if (!matchmaking) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancelSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [matchmaking, handleCancelSearch]);

  const openPlayOnline = () => {
    setPlayOnlineOpen(true);
    setOnlineStep("options");
  };

  const closePlayOnline = () => {
    setPlayOnlineOpen(false);
    setOnlineStep("options");
  };

  const handleCreateRoom = async () => {
    if (!socket) {
      alert("Connecting to server... Please wait.");
      return;
    }
    setLoadingAction("create");
    setResult(null);
    setPlayersReady({});
    const response = await createRoom(socket, effectivePlayerName);
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
    const response = await joinRoom(socket, roomInput.trim().toUpperCase(), effectivePlayerName);
    setLoadingAction(null);
    if (response.ok && response.roomCode && response.playerId) {
      setRoomCode(response.roomCode);
      if (response.playerId) setPlayerId(response.playerId);
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
    const res = await queueMatch(socket, effectivePlayerName);
    if (!res.ok) {
      setMatchmaking(false);
      setMatchmakingTimeout(false);
      alert(res.error || "Failed to start matchmaking");
    }
    setLoadingAction(null);
  };

  const inputStyle: React.CSSProperties = {
    borderColor: "rgba(30,61,47,0.28)",
    color: MENU_COLORS.darkGreen,
    backgroundColor: "rgba(30,61,47,0.06)"
  };

  const subButtonClass =
    "w-full rounded-2xl px-4 py-2.5 text-sm font-medium transition-all shadow-sm hover:shadow hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed text-white";
  const subButtonStyle = { backgroundColor: MENU_COLORS.brown };

  return (
    <MainLayout isHome>
      <div className="space-y-5">
        {/* 1) PLAY ONLINE – one main button; expands to sub-options only (no name/room on main) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => (playOnlineOpen ? closePlayOnline() : openPlayOnline())}
            className="btn-orange-sparkle w-full rounded-3xl px-6 py-5 text-lg font-medium tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl hover:opacity-95 text-white relative"
            style={{ backgroundColor: MENU_COLORS.orange, fontFamily: "'Source Sans 3', sans-serif" }}
          >
            <span className="sparkle-dot" style={{ top: "20%", left: "10%", animationDelay: "0s" }} />
            <span className="sparkle-dot" style={{ top: "65%", left: "88%", animationDelay: "1.6s" }} />
            <span className="sparkle-dot" style={{ top: "35%", right: "15%", left: "auto", animationDelay: "2.6s" }} />
            <span className="sparkle-dot" style={{ bottom: "25%", left: "18%", top: "auto", animationDelay: "0.5s" }} />
            Play Online
          </button>

          {playOnlineOpen && (
            <div
              className="rounded-2xl p-4 space-y-4"
              style={{ borderWidth: 2, borderColor: "rgba(124,92,32,0.25)", borderStyle: "solid" }}
            >
              {onlineStep === "options" && (
                <>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlineStep("create")}
                      disabled={matchmaking}
                      className={subButtonClass}
                      style={subButtonStyle}
                    >
                      Create room
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlineStep("join")}
                      disabled={matchmaking}
                      className={subButtonClass}
                      style={subButtonStyle}
                    >
                      Join room
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlineStep("random")}
                      disabled={matchmaking || loadingAction === "play"}
                      className={subButtonClass}
                      style={subButtonStyle}
                    >
                      {matchmaking || loadingAction === "play" ? "Searching…" : "Find random match"}
                    </button>
                  </div>
                  {matchmaking && (
                    <div className="rounded-2xl p-4 space-y-3" style={{ borderWidth: 1, borderColor: "rgba(30,61,47,0.12)", borderStyle: "solid" }}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" />
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" style={{ animationDelay: "300ms" }} />
                        <span className="text-sm opacity-80" style={{ color: MENU_COLORS.darkGreen }}>Searching…</span>
                      </div>
                      {matchmakingTimeout && (
                        <p className="text-xs text-center opacity-90" style={{ color: MENU_COLORS.darkGreen }}>No players available. Try again later.</p>
                      )}
                      <button type="button" onClick={handleCancelSearch} className={subButtonClass} style={subButtonStyle}>
                        Cancel search
                      </button>
                      <p className="text-xs text-center opacity-70" style={{ color: MENU_COLORS.darkGreen }}>Press ESC to cancel</p>
                    </div>
                  )}
                </>
              )}

              {onlineStep === "create" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                      Player name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      maxLength={20}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:opacity-60"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOnlineStep("options")} className="rounded-2xl px-4 py-2.5 text-sm font-medium opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                      Back
                    </button>
                    <button type="button" onClick={handleCreateRoom} disabled={loadingAction === "create"} className={`flex-1 ${subButtonClass}`} style={subButtonStyle}>
                      {loadingAction === "create" ? "Creating room…" : "Create room"}
                    </button>
                  </div>
                </div>
              )}

              {onlineStep === "join" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                      Room code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABC123"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      maxLength={6}
                      className="w-full rounded-xl border-2 px-4 py-2.5 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                      Player name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      maxLength={20}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:opacity-60"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOnlineStep("options")} className="rounded-2xl px-4 py-2.5 text-sm font-medium opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinRoom}
                      disabled={!roomInput.trim() || loadingAction === "join"}
                      className={`flex-1 ${subButtonClass}`}
                      style={subButtonStyle}
                    >
                      {loadingAction === "join" ? "Joining…" : "Join room"}
                    </button>
                  </div>
                </div>
              )}

              {onlineStep === "random" && (
                <>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wide opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                        Player name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        maxLength={20}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full rounded-xl border-2 px-4 py-3 text-sm outline-none placeholder:opacity-60"
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setOnlineStep("options")} className="rounded-2xl px-4 py-2.5 text-sm font-medium opacity-90" style={{ color: MENU_COLORS.darkGreen }}>
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handlePlayOnline}
                        disabled={matchmaking || loadingAction === "play"}
                        className={`flex-1 ${subButtonClass}`}
                        style={subButtonStyle}
                      >
                        {matchmaking || loadingAction === "play" ? "Searching…" : "Find random match"}
                      </button>
                    </div>
                  </div>
                  {matchmaking && (
                    <div className="rounded-2xl p-4 space-y-3" style={{ borderWidth: 1, borderColor: "rgba(30,61,47,0.12)", borderStyle: "solid" }}>
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" />
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full animate-pulse bg-[#D97A1F]" style={{ animationDelay: "300ms" }} />
                        <span className="text-sm opacity-80" style={{ color: MENU_COLORS.darkGreen }}>Searching…</span>
                      </div>
                      {matchmakingTimeout && (
                        <p className="text-xs text-center opacity-90" style={{ color: MENU_COLORS.darkGreen }}>No players available. Try again later.</p>
                      )}
                      <button type="button" onClick={handleCancelSearch} className={subButtonClass} style={subButtonStyle}>
                        Cancel search
                      </button>
                      <p className="text-xs text-center opacity-70" style={{ color: MENU_COLORS.darkGreen }}>Press ESC to cancel</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* 2) PLAY VS COMPUTER – single main button with sparkle */}
        <button
          type="button"
          onClick={() => setScreen("ai_placement")}
          className="btn-dark-green-sparkle w-full rounded-3xl px-6 py-5 text-lg font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl hover:opacity-95 text-white relative"
          style={{ backgroundColor: MENU_COLORS.darkGreen, fontFamily: "'Source Sans 3', sans-serif" }}
        >
          <span className="sparkle-dot" style={{ top: "22%", left: "12%", animationDelay: "0s" }} />
          <span className="sparkle-dot" style={{ top: "68%", left: "82%", animationDelay: "1.5s" }} />
          <span className="sparkle-dot" style={{ top: "35%", right: "18%", left: "auto", animationDelay: "2.8s" }} />
          <span className="sparkle-dot" style={{ bottom: "28%", left: "22%", top: "auto", animationDelay: "0.6s" }} />
          <span className="sparkle-dot" style={{ top: "50%", left: "75%", animationDelay: "2s" }} />
          Play vs Computer
        </button>
      </div>
    </MainLayout>
  );
};
