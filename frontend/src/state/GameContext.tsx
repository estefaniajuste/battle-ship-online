import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

export type Screen =
  | "home"
  | "waiting"
  | "placement"
  | "game"
  | "result";

export type ResultType = "win" | "lose" | null;

export type BoardCellState = "empty" | "ship" | "hit" | "miss" | "sunk";

export type ShipOrientation = "horizontal" | "vertical" | 0 | 1 | 2 | 3;

export interface ShipPlacement {
  id: string;
  size: number;
  x: number;
  y: number;
  orientation: ShipOrientation;
}

export interface GameContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  opponentName: string | null;
  isMyTurn: boolean;
  currentTurnId: string | null;
  result: ResultType;
  setResult: (r: ResultType) => void;
  socket: Socket | null;
  matchmaking: boolean;
  setMatchmaking: (m: boolean) => void;
  playersReady: Record<string, boolean>;
  setPlayersReady: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  myPlacement: ShipPlacement[] | null;
  setMyPlacement: (p: ShipPlacement[] | null) => void;
  finalMyShots: number;
  finalOpponentShots: number;
  setFinalShots: (my: number, opponent: number) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

/* CAMBIO CLAVE: URL DEL BACKEND ONLINE */
const BACKEND_URL = "https://battle-ship-online.onrender.com";

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<Screen>("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [matchmaking, setMatchmaking] = useState(false);
  const [playersReady, setPlayersReady] = useState<Record<string, boolean>>({});
  const [myPlacement, setMyPlacement] = useState<ShipPlacement[] | null>(null);
  const [finalMyShots, setFinalMyShotsState] = useState(0);
  const [finalOpponentShots, setFinalOpponentShotsState] = useState(0);

  const setFinalShots = useCallback((my: number, opponent: number) => {
    setFinalMyShotsState(my);
    setFinalOpponentShotsState(opponent);
  }, []);

  useEffect(() => {
    const s = io(BACKEND_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    setSocket(s);

    s.on("connect", () => {
      if (s.id) {
        setPlayerId(s.id);
      }
    });

    s.on("connect_error", (error) => {
      console.warn("Socket connection error:", error);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("room:playersUpdate", ({ players }) => {
      const currentPlayerId = socket.id || playerId;
      if (currentPlayerId) {
        const opponentEntry = Object.values(players).find(
          (p: any) => p.id !== currentPlayerId
        ) as { id: string; name: string } | undefined;
    
        if (opponentEntry) {
          setOpponentName(opponentEntry.name);
        }
      }
    });
    

    socket.on("room:ready", ({ roomCode, players }) => {
      setScreen("placement");
      setRoomCode(roomCode);

      const currentPlayerId = socket.id;
      if (currentPlayerId && players[currentPlayerId]) {
        setPlayerId(currentPlayerId);
        const opponent = Object.values(players).find((p: any) => p.id !== currentPlayerId) as any;
        if (opponent) setOpponentName(opponent.name);
      }
    });

    socket.on("match:found", ({ roomCode, players }) => {
      setMatchmaking(false);
      setScreen("placement");
      setRoomCode(roomCode);

      const currentPlayerId = socket.id;
      if (currentPlayerId && players[currentPlayerId]) {
        setPlayerId(currentPlayerId);
        const opponent = Object.values(players).find((p: any) => p.id !== currentPlayerId) as any;
        if (opponent) setOpponentName(opponent.name);
      }
    });

    socket.on("game:placementUpdate", ({ playersReady }) => {
      setPlayersReady(playersReady);
    });

    socket.on("game:started", ({ currentTurn }) => {
      setCurrentTurnId(currentTurn);
      setScreen("game");
    });

    socket.on("game:shotResult", ({ currentTurn }: { currentTurn?: string | null }) => {
      if (currentTurn != null) setCurrentTurnId(currentTurn);
    });

    socket.on("game:over", ({ winnerId }) => {
      if (playerId && winnerId) {
        setResult(winnerId === playerId ? "win" : "lose");
        setScreen("result");
      }
    });

    socket.on("room:opponentLeft", () => {
      setScreen("home");
      setRoomCode(null);
      setOpponentName(null);
      setCurrentTurnId(null);
      setPlayersReady({});
      setResult(null);
      setMyPlacement(null);
      setFinalMyShotsState(0);
      setFinalOpponentShotsState(0);
    });

    return () => {
      socket.removeAllListeners("room:playersUpdate");
      socket.removeAllListeners("room:ready");
      socket.removeAllListeners("match:found");
      socket.removeAllListeners("game:placementUpdate");
      socket.removeAllListeners("game:started");
      socket.removeAllListeners("game:shotResult");
      socket.removeAllListeners("game:over");
      socket.removeAllListeners("room:opponentLeft");
    };
  }, [socket, playerId]);

  const value = useMemo<GameContextValue>(
    () => ({
      screen,
      setScreen,
      playerName,
      setPlayerName,
      roomCode,
      setRoomCode,
      playerId,
      setPlayerId,
      opponentName,
      isMyTurn: !!playerId && currentTurnId === playerId,
      currentTurnId,
      result,
      setResult,
      socket,
      matchmaking,
      setMatchmaking,
      playersReady,
      setPlayersReady,
      myPlacement,
      setMyPlacement,
      finalMyShots,
      finalOpponentShots,
      setFinalShots
    }),
    [
      screen,
      playerName,
      roomCode,
      playerId,
      opponentName,
      currentTurnId,
      result,
      socket,
      matchmaking,
      playersReady,
      myPlacement,
      finalMyShots,
      finalOpponentShots
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
