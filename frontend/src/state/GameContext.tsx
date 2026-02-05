import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export type Screen =
  | "home"
  | "waiting"
  | "placement"
  | "game"
  | "result"
  | "ai_placement"
  | "ai_game"
  | "ai_result"
  | "login"
  | "register"
  | "profile"
  | "history"
  | "stats"
  | "leaderboard";

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
  /** Display name for sockets: authenticated user's username or playerName or "Player" */
  effectivePlayerName: string;
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
  /** AI game: screen is one of ai_placement | ai_game | ai_result */
  isAIGame: boolean;
  /** AI's ship placement (internal); used to resolve hit/miss/sunk when player fires */
  aiShipPlacement: ShipPlacement[] | null;
  setAiShipPlacement: (p: ShipPlacement[] | null) => void;
  /** Player's view when attacking AI: empty | hit | miss | sunk (no "ship" shown) */
  aiBoard: BoardCellState[][];
  setAiBoard: React.Dispatch<React.SetStateAction<BoardCellState[][]>>;
  /** Player's board that AI attacks: ship | empty | hit | miss | sunk */
  playerBoardState: BoardCellState[][];
  setPlayerBoardState: React.Dispatch<React.SetStateAction<BoardCellState[][]>>;
  /** Cells the AI has already shot at */
  aiShots: Array<{ x: number; y: number }>;
  setAiShots: React.Dispatch<React.SetStateAction<Array<{ x: number; y: number }>>>;
  aiMyShots: number;
  aiOpponentShots: number;
  setAiMyShots: (n: number) => void;
  setAiOpponentShots: (n: number) => void;
  /** Set when AI game ends: "win" | "lose" */
  aiResult: "win" | "lose" | null;
  setAiResult: (r: "win" | "lose" | null) => void;
  /** Initialize and start AI game; initialPlayerBoard is 10x10 with "ship" | "empty" */
  startAIGame: (aiPlacement: ShipPlacement[], initialPlayerBoard: BoardCellState[][]) => void;
  /** Clear AI state and optionally go home */
  resetAIGame: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

/* URL DEL BACKEND SEGÚN ENTORNO */
const BACKEND_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";


export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const effectivePlayerName = user?.username || playerName || "Player";
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

  const [aiShipPlacement, setAiShipPlacement] = useState<ShipPlacement[] | null>(null);
  const [aiBoard, setAiBoard] = useState<BoardCellState[][]>(() =>
    Array.from({ length: 10 }, () => Array(10).fill("empty" as BoardCellState))
  );
  const [playerBoardState, setPlayerBoardState] = useState<BoardCellState[][]>(() =>
    Array.from({ length: 10 }, () => Array(10).fill("empty" as BoardCellState))
  );
  const [aiShots, setAiShots] = useState<Array<{ x: number; y: number }>>([]);
  const [aiMyShots, setAiMyShotsState] = useState(0);
  const [aiOpponentShots, setAiOpponentShotsState] = useState(0);
  const [aiResult, setAiResult] = useState<"win" | "lose" | null>(null);

  const myShotsInGameRef = useRef(0);
  const opponentShotsInGameRef = useRef(0);

  const isAIGame = screen === "ai_placement" || screen === "ai_game" || screen === "ai_result";

  const setAiMyShots = useCallback((n: number) => setAiMyShotsState(n), []);
  const setAiOpponentShots = useCallback((n: number) => setAiOpponentShotsState(n), []);

  const startAIGame = useCallback(
    (aiPlacement: ShipPlacement[], initialPlayerBoard: BoardCellState[][]) => {
      setAiShipPlacement(aiPlacement);
      setAiBoard(Array.from({ length: 10 }, () => Array(10).fill("empty" as BoardCellState)));
      setAiShots([]);
      setAiMyShotsState(0);
      setAiOpponentShotsState(0);
      setAiResult(null);
      setPlayerBoardState(initialPlayerBoard.map((row) => [...row]));
      setScreen("ai_game");
    },
    []
  );

  const resetAIGame = useCallback(() => {
    setAiShipPlacement(null);
    setAiBoard(Array.from({ length: 10 }, () => Array(10).fill("empty" as BoardCellState)));
    setPlayerBoardState(Array.from({ length: 10 }, () => Array(10).fill("empty" as BoardCellState)));
    setAiShots([]);
    setAiMyShotsState(0);
    setAiOpponentShotsState(0);
    setAiResult(null);
  }, []);

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
      myShotsInGameRef.current = 0;
      opponentShotsInGameRef.current = 0;
      setScreen("game");
    });

    socket.on("game:shotResult", ({ currentTurn, attackerId }: { currentTurn?: string | null; attackerId?: string }) => {
      if (currentTurn != null) setCurrentTurnId(currentTurn);
      if (attackerId && playerId) {
        if (attackerId === playerId) {
          myShotsInGameRef.current += 1;
        } else {
          opponentShotsInGameRef.current += 1;
        }
      }
    });

    socket.on("game:over", ({ winnerId }) => {
      if (playerId && winnerId) {
        const resultValue = winnerId === playerId ? "win" : "lose";
        const myShots = myShotsInGameRef.current;
        const opponentShots = opponentShotsInGameRef.current;
        setResult(resultValue);
        setFinalMyShotsState(myShots);
        setFinalOpponentShotsState(opponentShots);

        if (token) {
          (async () => {
            try {
              await fetch(`${BACKEND_URL}/api/games`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  result: resultValue,
                  myShots,
                  opponentShots
                })
              });
            } catch {
              // Do not block UI; save failure is silent
            }
          })();
        }

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
      myShotsInGameRef.current = 0;
      opponentShotsInGameRef.current = 0;
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
  }, [socket, playerId, token]);

  const value = useMemo<GameContextValue>(
    () => ({
      screen,
      setScreen,
      playerName,
      setPlayerName,
      effectivePlayerName,
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
      setFinalShots,
      isAIGame,
      aiShipPlacement,
      setAiShipPlacement,
      aiBoard,
      setAiBoard,
      playerBoardState,
      setPlayerBoardState,
      aiShots,
      setAiShots,
      aiMyShots,
      aiOpponentShots,
      setAiMyShots,
      setAiOpponentShots,
      aiResult,
      setAiResult,
      startAIGame,
      resetAIGame
    }),
    [
      screen,
      playerName,
      effectivePlayerName,
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
      finalOpponentShots,
      aiShipPlacement,
      aiBoard,
      playerBoardState,
      aiShots,
      aiMyShots,
      aiOpponentShots,
      aiResult
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
