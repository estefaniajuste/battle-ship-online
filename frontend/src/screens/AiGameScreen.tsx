import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "../state/GameContext";
import { BoardGrid } from "../components/game/BoardGrid";
import { getShipAtCellFromPlacement, getShipCellsFromPlacement } from "../components/setup/ShipPlacement";
import { playHit, playMiss, playSunk } from "../utils/gameSounds";
import { GAME_COLORS } from "../theme/gameColors";
import type { SinkingAnimation } from "../types/game";

const BOARD_SIZE = 10;

function allAIShipsSunk(
  aiShipPlacement: NonNullable<ReturnType<typeof useGame>["aiShipPlacement"]>,
  aiBoard: ReturnType<typeof useGame>["aiBoard"]
): boolean {
  for (const ship of aiShipPlacement) {
    const cells = getShipCellsFromPlacement(aiShipPlacement, ship.id);
    const allHit = cells.every(([cx, cy]) => aiBoard[cy]?.[cx] === "hit" || aiBoard[cy]?.[cx] === "sunk");
    if (!allHit) return false;
  }
  return true;
}

function allPlayerShipsSunk(
  myPlacement: NonNullable<ReturnType<typeof useGame>["myPlacement"]>,
  playerBoardState: ReturnType<typeof useGame>["playerBoardState"]
): boolean {
  for (const ship of myPlacement) {
    const cells = getShipCellsFromPlacement(myPlacement, ship.id);
    const allHit = cells.every(([cx, cy]) => playerBoardState[cy]?.[cx] === "hit" || playerBoardState[cy]?.[cx] === "sunk");
    if (!allHit) return false;
  }
  return true;
}

export const AiGameScreen: React.FC = () => {
  const {
    aiShipPlacement,
    aiBoard,
    setAiBoard,
    playerBoardState,
    setPlayerBoardState,
    aiShots,
    setAiShots,
    setAiMyShots,
    setAiOpponentShots,
    aiMyShots,
    aiOpponentShots,
    setScreen,
    setAiResult,
    myPlacement
  } = useGame();

  const aiTurnTimeout = useRef<number | null>(null);
  const sinkingTimerRef = useRef<number[]>([]);
  const [sinkingAnimation, setSinkingAnimation] = useState<SinkingAnimation | null>(null);

  const runSinkingAnimation = useCallback((cells: Array<[number, number]>, board: "own" | "opponent") => {
    sinkingTimerRef.current.forEach((id) => window.clearTimeout(id));
    sinkingTimerRef.current = [];
    const cellObjects = cells.map(([cx, cy]) => ({ x: cx, y: cy }));
    setSinkingAnimation({ phase: "fire", cells: cellObjects, board });
    const t1 = window.setTimeout(() => {
      setSinkingAnimation((prev) => (prev ? { ...prev, phase: "burned" } : null));
    }, 1200);
    const t2 = window.setTimeout(() => setSinkingAnimation(null), 1800);
    sinkingTimerRef.current = [t1, t2];
  }, []);

  const runAITurn = useCallback(() => {
    if (!myPlacement || !aiShipPlacement) return;
    const tried = new Set(aiShots.map((s) => `${s.x},${s.y}`));
    const available: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (tried.has(`${x},${y}`)) continue;
        available.push({ x, y });
      }
    }
    if (available.length === 0) return;
    const cell = available[Math.floor(Math.random() * available.length)];

    const ship = getShipAtCellFromPlacement(myPlacement, cell.x, cell.y);
    setPlayerBoardState((prev) => {
      const next = prev.map((row) => [...row]);
      if (ship) {
        next[cell.y][cell.x] = "hit";
        const cells = getShipCellsFromPlacement(myPlacement, ship.id);
        const allHit = cells.every(([cx, cy]) => next[cy][cx] === "hit" || next[cy][cx] === "sunk");
        if (allHit) {
          cells.forEach(([cx, cy]) => {
            next[cy][cx] = "sunk";
          });
          playSunk();
        } else {
          playHit();
        }
      } else {
        next[cell.y][cell.x] = "miss";
        playMiss();
      }
      if (allPlayerShipsSunk(myPlacement, next)) {
        setScreen("ai_result");
        setAiResult("lose");
      }
      return next;
    });
    if (ship) {
      const cells = getShipCellsFromPlacement(myPlacement, ship.id);
      const wouldBeSunk = cells.every(
        ([cx, cy]) =>
          (cx === cell.x && cy === cell.y) ||
          playerBoardState[cy]?.[cx] === "hit" ||
          playerBoardState[cy]?.[cx] === "sunk"
      );
      if (wouldBeSunk) {
        runSinkingAnimation(cells, "own");
      }
    }
    setAiShots((prev) => [...prev, cell]);
    setAiOpponentShots(aiOpponentShots + 1);
  }, [aiShipPlacement, aiShots, myPlacement, setAiShots, setPlayerBoardState, setScreen, setAiResult, aiOpponentShots, playerBoardState, runSinkingAnimation]);

  useEffect(() => {
    return () => {
      if (aiTurnTimeout.current != null) window.clearTimeout(aiTurnTimeout.current);
      sinkingTimerRef.current.forEach((id) => window.clearTimeout(id));
      sinkingTimerRef.current = [];
    };
  }, []);

  const handlePlayerFire = useCallback(
    (x: number, y: number) => {
      if (!aiShipPlacement) return;
      if (aiBoard[y][x] !== "empty") return;

      const ship = getShipAtCellFromPlacement(aiShipPlacement, x, y);

      const sunkCells = ship ? getShipCellsFromPlacement(aiShipPlacement, ship.id) : [];
      const wouldSinkShip =
        ship &&
        sunkCells.length > 0 &&
        sunkCells.every(
          ([cx, cy]) =>
            (cx === x && cy === y) || aiBoard[cy]?.[cx] === "hit" || aiBoard[cy]?.[cx] === "sunk"
        );

      setAiBoard((prev) => {
        const next = prev.map((row) => [...row]);
        if (ship) {
          next[y][x] = "hit";
          const cells = getShipCellsFromPlacement(aiShipPlacement, ship.id);
          const allHit = cells.every(([cx, cy]) => {
            const c = next[cy]?.[cx];
            return c === "hit" || c === "sunk" || (cx === x && cy === y);
          });
          if (allHit) {
            cells.forEach(([cx, cy]) => {
              next[cy][cx] = "sunk";
            });
            playSunk();
            if (allAIShipsSunk(aiShipPlacement, next)) {
              setScreen("ai_result");
              setAiResult("win");
            }
          } else {
            playHit();
          }
        } else {
          next[y][x] = "miss";
          playMiss();
        }
        return next;
      });
      if (wouldSinkShip && sunkCells.length > 0) {
        runSinkingAnimation(sunkCells, "opponent");
      }
      setAiMyShots(aiMyShots + 1);

      const isWin = ship
        ? (() => {
            const cells = getShipCellsFromPlacement(aiShipPlacement, ship.id);
            const wouldBeSunk =
              cells.length > 0 &&
              cells.every(
                ([cx, cy]) =>
                  (cx === x && cy === y) || aiBoard[cy]?.[cx] === "hit" || aiBoard[cy]?.[cx] === "sunk"
              );
            if (wouldBeSunk) {
              const next = aiBoard.map((row) => [...row]);
              next[y][x] = "hit";
              cells.forEach(([cx, cy]) => {
                next[cy][cx] = "sunk";
              });
              return allAIShipsSunk(aiShipPlacement, next);
            }
            return false;
          })()
        : false;
      if (!isWin) {
        aiTurnTimeout.current = window.setTimeout(runAITurn, 600);
      }
    },
    [aiShipPlacement, aiBoard, aiMyShots, setAiBoard, setAiMyShots, setScreen, setAiResult, runAITurn, runSinkingAnimation]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <h2 className="text-xl font-bold mb-4" style={{ color: GAME_COLORS.label }}>
        Game vs Computer
      </h2>
      <p className="text-sm text-text-main/80 mb-6">Your turn — click a cell on the opponent board to fire.</p>

      <div className="flex gap-6 items-start">
        <div>
          <BoardGrid
            title="Your board"
            board={playerBoardState}
            mode="defense"
            disabled
            sinkingAnimation={sinkingAnimation?.board === "own" ? sinkingAnimation : null}
          />
        </div>
        <div>
          <BoardGrid
            title="Computer board"
            board={aiBoard}
            mode="attack"
            onCellClick={handlePlayerFire}
            disabled={false}
            sinkingAnimation={sinkingAnimation?.board === "opponent" ? sinkingAnimation : null}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-4 text-sm text-text-main/80">
        <span>My shots: {aiMyShots}</span>
        <span>AI shots: {aiOpponentShots}</span>
      </div>

      <button
        type="button"
        onClick={() => {
          if (aiTurnTimeout.current != null) window.clearTimeout(aiTurnTimeout.current);
          setScreen("home");
        }}
        className="mt-6 text-sm rounded-full border px-4 py-2"
        style={{ color: GAME_COLORS.label, borderColor: GAME_COLORS.label }}
      >
        Back to menu
      </button>
    </div>
  );
};
