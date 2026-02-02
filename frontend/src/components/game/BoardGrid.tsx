import React from "react";
import type { SinkingAnimation } from "../../types/game";

type CellStatus = "unknown" | "ship" | "hit" | "miss" | "sunk";

interface BoardGridProps {
  title: string;
  mode: "attack" | "defense";
  board: CellStatus[][];
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
  sinkingAnimation?: SinkingAnimation | null;
}

const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ROW_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const cellInSet = (x: number, y: number, cells: Array<{ x: number; y: number }>) =>
  cells.some((c) => c.x === x && c.y === y);

export const BoardGrid: React.FC<BoardGridProps> = ({
  title,
  board,
  mode,
  onCellClick,
  disabled,
  sinkingAnimation
}) => {
  const BOARD_SIZE = board.length || 10;
  const isOwnBoard = mode === "defense";
  const sinkingCells = sinkingAnimation?.cells ?? [];
  const sinkingPhase = sinkingAnimation?.phase ?? null;

  return (
    <div className="space-y-3 w-full max-w-[min(100%,20rem)]">
      <div className="text-center">
        <span className="text-sm font-medium text-text-main/80 uppercase tracking-wide">{title}</span>
      </div>
      <div>
        {/* Independent letters row: same total width as board, does NOT affect board layout */}
        <div className="flex">
          <div className="w-6 flex-shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 grid grid-cols-10">
            {COL_LABELS.slice(0, BOARD_SIZE).map((letter) => (
              <div
                key={letter}
                className="flex items-center justify-center text-xs font-medium text-text-main/80"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
        {/* Board: original layout – numbers column + 10×10 grid, untouched */}
        <div className="flex">
          <div className="flex flex-col w-6 flex-shrink-0">
            {ROW_LABELS.slice(0, BOARD_SIZE).map((num) => (
              <div
                key={num}
                className="h-7 flex items-center justify-center text-xs font-medium text-text-main/80"
              >
                {num}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-10 grid-rows-10 border border-grid-deep/20 rounded-lg overflow-hidden bg-grid-deep/5 flex-1 min-w-0">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
              const x = idx % BOARD_SIZE;
              const y = Math.floor(idx / BOARD_SIZE);
              const cell = board[y]?.[x] ?? "unknown";
              const isHit = cell === "hit";
              const isSunk = cell === "sunk";
              const isMiss = cell === "miss";
              const hasShip = cell === "ship";
              const isSinkingCell = cellInSet(x, y, sinkingCells);

              const common = "relative flex items-center justify-center w-7 h-7 flex-shrink-0 transition-all duration-200 border border-grid-deep/20";

              let stateClasses = "";
              if (isSinkingCell && sinkingPhase === "fire") {
                stateClasses = "cell-sunk-fire text-white";
              } else if (isSinkingCell && sinkingPhase === "burned") {
                stateClasses = "cell-sunk-burned";
              } else if (isOwnBoard) {
                if (isSunk) {
                  stateClasses = "bg-stone-800/95 border-stone-700 text-stone-400";
                } else if (isHit) {
                  stateClasses = "bg-accent-primary/80 border-accent-primary text-white";
                } else if (isMiss) {
                  stateClasses = "bg-grid-deep/20 border-grid-deep/30";
                } else if (hasShip) {
                  stateClasses = "bg-accent-secondary/60 border-accent-secondary/50";
                } else {
                  stateClasses = "bg-background/90";
                }
              } else {
                if (isSunk) {
                  stateClasses = "bg-stone-800/95 border-stone-700 text-stone-400";
                } else if (isHit) {
                  stateClasses = "bg-accent-primary/80 border-accent-primary text-white";
                } else if (isMiss) {
                  stateClasses = "bg-grid-deep/20 border-grid-deep/30";
                } else {
                  stateClasses = disabled
                    ? "bg-background/80 cursor-not-allowed opacity-70"
                    : "bg-background/90 hover:bg-accent-primary/20 hover:border-accent-primary/50 cursor-pointer active:scale-95";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={`${common} ${stateClasses}`}
                  onClick={
                    disabled || !onCellClick
                      ? undefined
                      : () => onCellClick(x, y)
                  }
                  disabled={disabled}
                  aria-label={
                    cell === "sunk"
                      ? "Sunk"
                      : cell === "hit"
                      ? "Hit"
                      : cell === "miss"
                      ? "Miss"
                      : disabled
                      ? "Unrevealed"
                      : "Fire here"
                  }
                >
                  {isSinkingCell && sinkingPhase === "fire" && (
                    <span className="text-sm leading-none opacity-90" aria-hidden>🔥</span>
                  )}
                  {isSunk && !isSinkingCell && <span className="text-xs font-bold" aria-hidden>✕</span>}
                  {isSinkingCell && sinkingPhase === "burned" && <span className="text-xs font-bold text-stone-500" aria-hidden>✕</span>}
                  {isHit && !isSunk && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" aria-hidden />}
                  {isMiss && <span className="w-1.5 h-1.5 rounded-full bg-sky-600/40 border border-sky-500/30" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
