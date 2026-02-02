import React, { useEffect, useRef, useState } from "react";
import { BoardGrid } from "./BoardGrid";
import { useGame } from "../../state/GameContext";
import { fire, leaveRoom } from "../../services/gameApi";
import { preloadGameSounds, playMiss, playHit, playSunk } from "../../utils/gameSounds";
import { getPlacementBoard } from "../setup/ShipPlacement";
import type { SinkingAnimation } from "../../types/game";

type CellStatus = "unknown" | "ship" | "hit" | "miss" | "sunk";

const BOARD_SIZE = 10;

const createEmptyBoard = (): CellStatus[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => "unknown" as CellStatus));

const SINK_FIRE_MS = 1500;
const SINK_BURNED_MS = 6000;

/** Opponent fleet for legend: 1×4, 2×3, 2×2, 2×1, 1 L */
const FLEET_LEGEND = [
  { id: "battleship", size: 4, label: "4" },
  { id: "cruiser", size: 3, label: "3" },
  { id: "submarine", size: 3, label: "3" },
  { id: "destroyer", size: 2, label: "2" },
  { id: "patrol", size: 2, label: "2" },
  { id: "dinghy1", size: 1, label: "1" },
  { id: "dinghy2", size: 1, label: "1" },
  { id: "lship", size: 3, label: "L", shape: "L" as const }
];

export const GameScreen: React.FC = () => {
  const { socket, roomCode, isMyTurn, playerId, opponentName, setResult, setScreen, myPlacement, setMyPlacement, setFinalShots } = useGame();
  const [ownBoard, setOwnBoard] = useState<CellStatus[][]>(() => createEmptyBoard());
  const [opponentBoard, setOpponentBoard] = useState<CellStatus[][]>(() => createEmptyBoard());
  const [pendingShot, setPendingShot] = useState(false);
  const [sinkingAnimation, setSinkingAnimation] = useState<SinkingAnimation | null>(null);
  const [sunkOpponentShips, setSunkOpponentShips] = useState<Set<string>>(() => new Set());
  const [myShotCount, setMyShotCount] = useState(0);
  const [opponentShotCount, setOpponentShotCount] = useState(0);
  const sinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownBoardInitializedRef = useRef(false);

  useEffect(() => {
    preloadGameSounds();
  }, []);

  useEffect(() => {
    return () => {
      if (sinkingTimerRef.current) clearTimeout(sinkingTimerRef.current);
      ownBoardInitializedRef.current = false;
    };
  }, []);

  // Seed own board with player ships when entering game (defense view)
  useEffect(() => {
    if (!myPlacement?.length || ownBoardInitializedRef.current) return;
    ownBoardInitializedRef.current = true;
    setOwnBoard(getPlacementBoard(myPlacement) as CellStatus[][]);
  }, [myPlacement]);

  // Keep final shot counts in context for Game Over screen
  useEffect(() => {
    setFinalShots(myShotCount, opponentShotCount);
  }, [myShotCount, opponentShotCount, setFinalShots]);

  useEffect(() => {
    if (!socket) return;

    const handleShotResult = (payload: any) => {
      const {
        attackerId,
        x,
        y,
        hit,
        sunkShipId,
        sunkShipCells = [],
        autoRevealedWater = []
      } = payload;
      const isMe = attackerId === playerId;

      if (hit) {
        playHit();
        if (sunkShipId) playSunk();
      } else {
        playMiss();
      }

      const setBoard = (prev: CellStatus[][]) => {
        const next = prev.map((row) => row.slice());
        if (sunkShipId && sunkShipCells.length > 0) {
          for (const { x: cx, y: cy } of sunkShipCells) {
            next[cy][cx] = "sunk";
          }
        } else {
          next[y][x] = hit ? (sunkShipId ? "sunk" : "hit") : "miss";
        }
        for (const { x: ax, y: ay } of autoRevealedWater) {
          if (next[ay][ax] === "unknown") next[ay][ax] = "miss";
        }
        return next;
      };

      if (isMe) {
        setOpponentBoard(setBoard);
        setPendingShot(false);
        if (sunkShipId) setSunkOpponentShips((s) => new Set(s).add(sunkShipId));
      } else {
        setOwnBoard(setBoard);
        setOpponentShotCount((c) => c + 1);
      }

      if (sunkShipId && sunkShipCells.length > 0) {
        if (sinkingTimerRef.current) clearTimeout(sinkingTimerRef.current);
        setSinkingAnimation({
          phase: "fire",
          cells: sunkShipCells,
          board: isMe ? "opponent" : "own"
        });
        sinkingTimerRef.current = setTimeout(() => {
          setSinkingAnimation((a) => (a ? { ...a, phase: "burned" } : null));
          sinkingTimerRef.current = setTimeout(() => {
            setSinkingAnimation(null);
            sinkingTimerRef.current = null;
          }, SINK_BURNED_MS);
        }, SINK_FIRE_MS);
      }
    };

    socket.on("game:shotResult", handleShotResult);

    return () => {
      socket.off("game:shotResult", handleShotResult);
    };
  }, [socket, playerId]);

  const handleFireCell = async (x: number, y: number) => {
    if (!socket || !roomCode || !isMyTurn || pendingShot) return;
    setPendingShot(true);
    setMyShotCount((c) => c + 1);
    const res = await fire(socket, roomCode, x, y);
    if (!res.ok) {
      setPendingShot(false);
      setMyShotCount((c) => Math.max(0, c - 1));
    }
  };

  const handleBackToMenu = () => {
    if (socket && roomCode) {
      leaveRoom(socket, roomCode);
    }
    setMyPlacement(null);
    setScreen("home");
    setResult(null);
  };

  const canAttack = isMyTurn && !pendingShot;

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col items-center px-3 py-4">
      {/* Turn indicator */}
      <div className="w-full max-w-md flex justify-center mb-2">
        <span
          className={`text-lg font-semibold uppercase tracking-wide px-4 py-2 rounded-lg ${
            isMyTurn ? "bg-[#1E3D2F] text-white" : "bg-stone-600/80 text-stone-200"
          }`}
        >
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </span>
      </div>
      <div className="flex gap-6 mb-3 text-sm text-text-main/80">
        <span>Your shots: {myShotCount}</span>
        <span>Opponent shots: {opponentShotCount}</span>
      </div>
      <div className="flex flex-1 flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
        <div className="flex flex-col items-center smooth-transition">
          {isMyTurn ? (
            <>
              <p className="text-xs text-text-main/65 mb-1">Tap a cell to fire</p>
              <BoardGrid
                title="Opponent’s board"
                board={opponentBoard}
                mode="attack"
                onCellClick={handleFireCell}
                disabled={!canAttack}
                sinkingAnimation={
                  sinkingAnimation?.board === "opponent" ? sinkingAnimation : null
                }
              />
            </>
          ) : (
            <>
              <p className="text-xs text-text-main/65 mb-1">Incoming shots</p>
              <BoardGrid
                title="Your board"
                board={ownBoard}
                mode="defense"
                disabled
                sinkingAnimation={
                  sinkingAnimation?.board === "own" ? sinkingAnimation : null
                }
              />
            </>
          )}
        </div>

        {/* Right side: Fleet status */}
        <div className="flex flex-col items-center border border-grid-deep/20 rounded-lg bg-grid-deep/5 px-3 py-2 min-w-[4.5rem]">
          <span className="text-xs font-medium text-text-main/80 uppercase tracking-wide mb-2">
            Fleet
          </span>
          <div className="flex flex-col gap-1">
            {FLEET_LEGEND.map((ship) => {
              const sunk = sunkOpponentShips.has(ship.id);
              return (
                <div
                  key={ship.id}
                  className={`flex items-center justify-center rounded border ${
                    sunk ? "bg-stone-800 border-stone-600 text-stone-400" : "bg-background/90 border-grid-deep/20"
                  }`}
                  title={sunk ? "Sunk" : "Alive"}
                >
                  {ship.shape === "L" ? (
                    <span className="inline-grid grid-cols-2 grid-rows-2 gap-px p-0.5 w-4 h-4">
                      <span className={sunk ? "bg-stone-600" : "bg-accent-secondary/70"} />
                      <span className={sunk ? "bg-stone-600" : "bg-accent-secondary/70"} />
                      <span className={sunk ? "bg-stone-600" : "bg-accent-secondary/70"} />
                      <span className="bg-transparent" />
                    </span>
                  ) : (
                    <span className="flex gap-px p-0.5">
                      {Array.from({ length: ship.size }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-2 rounded-sm ${sunk ? "bg-stone-600" : "bg-accent-secondary/70"}`}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBackToMenu}
        className="mt-4 text-sm rounded-full border border-grid-deep/20 text-text-main px-4 py-2 hover:bg-grid-deep/10 transition-colors"
      >
        Back to main menu
      </button>
    </div>
  );
};
