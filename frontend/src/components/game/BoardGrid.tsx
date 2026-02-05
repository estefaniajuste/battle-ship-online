import React from "react";
import type { SinkingAnimation } from "../../types/game";
import { GAME_COLORS } from "../../theme/gameColors";

export type CellStatus = "empty" | "ship" | "hit" | "miss" | "sunk";
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
        <span
          className="text-sm font-medium uppercase tracking-wide"
          style={{ color: GAME_COLORS.label }}
        >
          {title}
        </span>
      </div>
      <div>
        {/* Independent letters row: same total width as board, does NOT affect board layout */}
        <div className="flex">
          <div className="w-6 flex-shrink-0" aria-hidden />
          <div className="flex-1 min-w-0 grid grid-cols-10">
            {COL_LABELS.slice(0, BOARD_SIZE).map((letter) => (
              <div
                key={letter}
                className="flex items-center justify-center text-xs font-medium"
                style={{ color: GAME_COLORS.label }}
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
                className="h-7 flex items-center justify-center text-xs font-medium"
                style={{ color: GAME_COLORS.label }}
              >
                {num}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-10 grid-rows-10 border rounded-lg overflow-hidden bg-grid-deep/5 flex-1 min-w-0"
            style={{ borderColor: GAME_COLORS.label }}
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
              const x = idx % BOARD_SIZE;
              const y = Math.floor(idx / BOARD_SIZE);
              const cell = board[y]?.[x] ?? "unknown";
              const isHit = cell === "hit";
              const isSunk = cell === "sunk";
              const isMiss = cell === "miss";
              const hasShip = cell === "ship";
              const isSinkingCell = cellInSet(x, y, sinkingCells);

              const common = "relative flex items-center justify-center w-7 h-7 flex-shrink-0 transition-all duration-200 border";

              let stateClasses = "";
              const inlineStyle: React.CSSProperties = { borderColor: GAME_COLORS.gridLine };

              if (isSinkingCell && sinkingPhase === "fire") {
                stateClasses = "cell-sunk-fire text-white";
              } else if (isSinkingCell && sinkingPhase === "burned") {
                stateClasses = "cell-sunk-burned";
              } else if (isSunk) {
                inlineStyle.backgroundColor = GAME_COLORS.sunk;
                inlineStyle.borderColor = GAME_COLORS.sunkBorder;
                inlineStyle.color = GAME_COLORS.sunkText;
              } else if (isHit) {
                inlineStyle.backgroundColor = GAME_COLORS.hit;
                inlineStyle.borderColor = GAME_COLORS.hit;
                inlineStyle.color = GAME_COLORS.hitText;
              } else if (isMiss) {
                inlineStyle.backgroundColor = GAME_COLORS.miss;
                inlineStyle.borderColor = GAME_COLORS.missBorder;
              } else if (isOwnBoard && hasShip) {
                inlineStyle.backgroundColor = GAME_COLORS.ship;
                inlineStyle.borderColor = GAME_COLORS.ship;
              } else {
                inlineStyle.backgroundColor = GAME_COLORS.emptyCell;
                if (!isOwnBoard && disabled) {
                  inlineStyle.opacity = GAME_COLORS.disabledOpacity;
                  stateClasses = "cursor-not-allowed";
                } else if (!isOwnBoard) {
                  stateClasses = "cursor-pointer active:scale-95 attack-cell-hover";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  className={common + (stateClasses ? ` ${stateClasses}` : "")}
                  style={inlineStyle}
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
                  {isMiss && (
                    <span
                      className="w-1.5 h-1.5 rounded-full border"
                      style={{ backgroundColor: GAME_COLORS.missDot, borderColor: GAME_COLORS.missDotBorder }}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
