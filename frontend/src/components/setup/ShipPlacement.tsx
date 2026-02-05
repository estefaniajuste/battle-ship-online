import React, { useEffect, useMemo, useState } from "react";
import { useGame, ShipPlacement as ShipPlacementType, ShipOrientation } from "../../state/GameContext";
import { placeShips } from "../../services/gameApi";
import { COLORS } from "../../theme/colors";

type ShipDef = { id: string; size: number; label: string; shape?: "L" };

const SHIP_DEFINITIONS: ShipDef[] = [
  { id: "battleship", size: 4, label: "Battleship" },
  { id: "cruiser", size: 3, label: "Cruiser" },
  { id: "submarine", size: 3, label: "Submarine" },
  { id: "destroyer", size: 2, label: "Destroyer" },
  { id: "patrol", size: 2, label: "Patrol" },
  { id: "dinghy1", size: 1, label: "Dinghy" },
  { id: "dinghy2", size: 1, label: "Dinghy" },
  { id: "lship", size: 3, label: "L-Shape", shape: "L" }
];

/** Placement order: 1×4, 2×3, 2×2, 2×1, 1×L */
const PLACEMENT_ORDER: readonly string[] = [
  "battleship", "cruiser", "submarine", "destroyer", "patrol", "dinghy1", "dinghy2", "lship"
];

const BOARD_SIZE = 10;
const UNPLACED = -1; // ships with x === UNPLACED are not on the board
const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ROW_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function isOnBoard(ship: { x: number; y: number }): boolean {
  return ship.x >= 0 && ship.y >= 0;
}

const L_OFFSETS: Array<Array<{ dx: number; dy: number }>> = [
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }]
];

const EIGHT_NEIGHBORS: Array<{ dx: number; dy: number }> = [
  { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
  { dx: 0, dy: -1 },                   { dx: 0, dy: 1 },
  { dx: 1, dy: -1 },  { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
];

function getShipCells(ship: ShipPlacementType, def: ShipDef): Array<[number, number]> {
  if (def.shape === "L") {
    const orient = typeof ship.orientation === "number" ? ship.orientation : 0;
    const offsets = L_OFFSETS[orient % 4];
    return offsets.map(({ dx, dy }) => [ship.x + dx, ship.y + dy]);
  }
  const cells: Array<[number, number]> = [];
  const h = ship.orientation === "horizontal";
  for (let i = 0; i < ship.size; i++) {
    cells.push([h ? ship.x + i : ship.x, h ? ship.y : ship.y + i]);
  }
  return cells;
}

/** Returns all cells adjacent (8-neighbor) to any cell in the list (1-cell water buffer). */
function getBufferAroundCells(cells: Array<[number, number]>): Array<[number, number]> {
  const set = new Set<string>();
  for (const [x, y] of cells) {
    for (const { dx, dy } of EIGHT_NEIGHBORS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        set.add(`${nx},${ny}`);
      }
    }
  }
  return Array.from(set).map((key) => {
    const [a, b] = key.split(",").map(Number);
    return [a, b] as [number, number];
  });
}

function getDef(shipId: string): ShipDef {
  const d = SHIP_DEFINITIONS.find((s) => s.id === shipId);
  if (!d) throw new Error(`Unknown ship: ${shipId}`);
  return d;
}

/** Build initial 10x10 board from placement: ship cells = "ship", rest = "unknown". Used for defense view. */
export function getPlacementBoard(placement: ShipPlacementType[]): ("unknown" | "ship")[][] {
  const board: ("unknown" | "ship")[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => "unknown")
  );
  for (const ship of placement) {
    if (!isOnBoard(ship)) continue;
    const def = getDef(ship.id);
    const cells = getShipCells(ship, def);
    for (const [cx, cy] of cells) {
      if (cx >= 0 && cx < BOARD_SIZE && cy >= 0 && cy < BOARD_SIZE) {
        board[cy][cx] = "ship";
      }
    }
  }
  return board;
}

/** Generate a fully valid random placement for all ships (no overlaps, 1-cell buffer, in bounds). */
function generateRandomPlacement(): ShipPlacementType[] {
  const forbidden = new Set<string>();
  const placements: ShipPlacementType[] = [];
  const defs = [...SHIP_DEFINITIONS].sort(() => Math.random() - 0.5);

  for (const def of defs) {
    let placed = false;
    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      const orientation: ShipOrientation = def.shape === "L"
        ? (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3)
        : (Math.random() < 0.5 ? "horizontal" : "vertical");
      const ship: ShipPlacementType = { id: def.id, size: def.size, x, y, orientation };
      const cells = getShipCells(ship, def);
      let out = false;
      for (const [cx, cy] of cells) {
        if (cx < 0 || cy < 0 || cx >= BOARD_SIZE || cy >= BOARD_SIZE) {
          out = true;
          break;
        }
      }
      if (out) continue;
      let hit = false;
      for (const [cx, cy] of cells) {
        if (forbidden.has(`${cx},${cy}`)) {
          hit = true;
          break;
        }
      }
      if (hit) continue;
      const buffer = getBufferAroundCells(cells);
      placements.push(ship);
      for (const [cx, cy] of cells) forbidden.add(`${cx},${cy}`);
      for (const [bx, by] of buffer) forbidden.add(`${bx},${by}`);
      placed = true;
    }
    if (!placed) return generateRandomPlacement();
  }
  return placements;
}

export const ShipPlacementScreen: React.FC = () => {
  const { socket, roomCode, playersReady, playerId, setMyPlacement } = useGame();
  const [orientation, setOrientation] = useState<ShipOrientation>("horizontal");
  const [currentPlacementIndex, setCurrentPlacementIndex] = useState(0);
  const [dragShipId, setDragShipId] = useState<string | null>(null);
  const [dragStartCell, setDragStartCell] = useState<{ x: number; y: number } | null>(null);
  const [dragMouseMoved, setDragMouseMoved] = useState(false);
  const [ships, setShips] = useState<ShipPlacementType[]>(() =>
    SHIP_DEFINITIONS.map((def) => ({
      id: def.id,
      size: def.size,
      x: UNPLACED,
      y: UNPLACED,
      orientation: (def.shape === "L" ? 0 : "horizontal") as ShipOrientation
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [rotationRejectedShipId, setRotationRejectedShipId] = useState<string | null>(null);

  const currentShipIdInSequence = PLACEMENT_ORDER[Math.min(currentPlacementIndex, 7)];
  const activeShipId = currentShipIdInSequence;
  const currentShipUnplaced = (() => {
    const s = ships.find((x) => x.id === currentShipIdInSequence);
    return s ? !isOnBoard(s) : false;
  })();

  useEffect(() => {
    const ship = ships.find((s) => s.id === currentShipIdInSequence);
    if (ship) setOrientation(ship.orientation);
  }, [currentPlacementIndex, currentShipIdInSequence, ships]);

  const overlapsOrOutOfBounds = (ship: ShipPlacementType, allShips: ShipPlacementType[]) => {
    if (!isOnBoard(ship)) return false;
    const def = getDef(ship.id);
    const cells = getShipCells(ship, def);
    for (const [cx, cy] of cells) {
      if (cx < 0 || cy < 0 || cx >= BOARD_SIZE || cy >= BOARD_SIZE) return true;
    }
    const shipAndBuffer = new Set(cells.map(([a, b]) => `${a},${b}`));
    for (const [bx, by] of getBufferAroundCells(cells)) {
      shipAndBuffer.add(`${bx},${by}`);
    }
    for (const other of allShips) {
      if (other.id === ship.id || !isOnBoard(other)) continue;
      const otherCells = getShipCells(other, getDef(other.id));
      for (const [ox, oy] of otherCells) {
        if (shipAndBuffer.has(`${ox},${oy}`)) return true;
      }
    }
    return false;
  };

  const getNextOrientation = (ship: ShipPlacementType): ShipOrientation => {
    const def = getDef(ship.id);
    if (def.shape === "L") {
      const o = typeof ship.orientation === "number" ? ship.orientation : 0;
      return ((o + 1) % 4) as ShipOrientation;
    }
    return ship.orientation === "horizontal" ? "vertical" : "horizontal";
  };

  const wouldRotateBeValid = (shipId: string, currentShips: ShipPlacementType[]): boolean => {
    const ship = currentShips.find((s) => s.id === shipId);
    if (!ship) return false;
    const rotated: ShipPlacementType = {
      ...ship,
      orientation: getNextOrientation(ship)
    };
    const others = currentShips.filter((s) => s.id !== shipId);
    return !overlapsOrOutOfBounds(rotated, [...others, rotated]);
  };

  /** Try to find a valid position for the ship after rotation (same orientation, shifted x/y). */
  const tryFindValidRotatedPosition = (shipId: string, currentShips: ShipPlacementType[]): ShipPlacementType | null => {
    const ship = currentShips.find((s) => s.id === shipId);
    if (!ship) return null;
    const newOrientation = getNextOrientation(ship);
    const rotated: ShipPlacementType = { ...ship, orientation: newOrientation };
    const others = currentShips.filter((s) => s.id !== shipId);

    const deltas: Array<[number, number]> = [
      [0, 0], [-1, 0], [1, 0], [0, -1], [0, 1],
      [-2, 0], [2, 0], [0, -2], [0, 2],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
      [-2, -1], [2, -1], [-2, 1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2],
      [-3, 0], [3, 0], [0, -3], [0, 3]
    ];
    for (const [dx, dy] of deltas) {
      const candidate: ShipPlacementType = { ...rotated, x: ship.x + dx, y: ship.y + dy };
      if (!overlapsOrOutOfBounds(candidate, [...others, candidate])) return candidate;
    }
    return null;
  };

  const tryRotateShip = (shipId: string): boolean => {
    if (isLocked) return false;
    const ship = ships.find((s) => s.id === shipId);
    if (!ship) return false;
    const newOrientation = getNextOrientation(ship);
    if (!isOnBoard(ship)) {
      setRotationRejectedShipId(null);
      setOrientation(newOrientation);
      setShips((prev) =>
        prev.map((s) => (s.id === shipId ? { ...s, orientation: newOrientation } : s))
      );
      return true;
    }
    if (wouldRotateBeValid(shipId, ships)) {
      setRotationRejectedShipId(null);
      setOrientation(newOrientation);
      setShips((prev) =>
        prev.map((s) => (s.id === shipId ? { ...s, orientation: newOrientation } : s))
      );
      return true;
    }
    const adjusted = tryFindValidRotatedPosition(shipId, ships);
    if (adjusted) {
      setRotationRejectedShipId(null);
      setOrientation(adjusted.orientation);
      setShips((prev) =>
        prev.map((s) => (s.id === shipId ? adjusted : s))
      );
      return true;
    }
    return false;
  };

  const getShipAtCell = (x: number, y: number): ShipPlacementType | null => {
    for (const ship of ships) {
      if (!isOnBoard(ship)) continue;
      const def = getDef(ship.id);
      const cells = getShipCells(ship, def);
      if (cells.some(([cx, cy]) => cx === x && cy === y)) return ship;
    }
    return null;
  };

  const handleCellMouseDown = (x: number, y: number) => {
    if (isLocked) return;
    const shipAtCell = getShipAtCell(x, y);
    if (shipAtCell && isOnBoard(shipAtCell)) {
      setDragShipId(shipAtCell.id);
      setDragStartCell({ x, y });
      setDragMouseMoved(false);
    }
  };

  const handleCellMouseMove = () => {
    if (dragShipId) setDragMouseMoved(true);
  };

  const handleCellMouseUp = (x: number, y: number) => {
    if (!dragShipId || !dragStartCell) return;
    const ship = ships.find((s) => s.id === dragShipId);
    if (!ship || !isOnBoard(ship)) {
      setDragShipId(null);
      setDragStartCell(null);
      return;
    }
    const sameCell = x === dragStartCell.x && y === dragStartCell.y;
    if (!dragMouseMoved && sameCell) {
      tryRotateShip(dragShipId);
    } else if (dragMouseMoved || !sameCell) {
      const moved = { ...ship, x, y, orientation: ship.orientation };
      const others = ships.filter((s) => s.id !== dragShipId);
      if (!overlapsOrOutOfBounds(moved, [...others, moved])) {
        setShips((prev) =>
          prev.map((s) => (s.id === dragShipId ? moved : s))
        );
      }
    }
    setDragShipId(null);
    setDragStartCell(null);
  };

  const handleCellClick = (x: number, y: number) => {
    if (isLocked) return;
    if (dragShipId) return;
    const shipAtCell = getShipAtCell(x, y);
    if (shipAtCell) return;

    setRotationRejectedShipId(null);
    const currentShip = ships.find((s) => s.id === currentShipIdInSequence);
    if (!currentShip || isOnBoard(currentShip)) return;
    const moved = { ...currentShip, x, y, orientation };
    const others = ships.filter((s) => s.id !== currentShipIdInSequence);
    if (overlapsOrOutOfBounds(moved, [...others, moved])) return;
    setShips((prev) =>
      prev.map((ship) => (ship.id === currentShipIdInSequence ? moved : ship))
    );
    if (currentPlacementIndex < 8) {
      setCurrentPlacementIndex((i) => i + 1);
      const nextId = PLACEMENT_ORDER[currentPlacementIndex + 1];
      const nextDef = nextId ? SHIP_DEFINITIONS.find((d) => d.id === nextId) : null;
      setOrientation(
        nextDef?.shape === "L" ? (0 as ShipOrientation) : ("horizontal" as ShipOrientation)
      );
    }
  };

  const handleRotate = () => {
    if (isLocked) return;
    const rotated = tryRotateShip(activeShipId);
    if (!rotated) setRotationRejectedShipId(activeShipId);
    else setRotationRejectedShipId(null);
  };


  const allShipsPlaced = useMemo(() => ships.every((s) => isOnBoard(s)), [ships]);
  const isValidPlacement = useMemo(
    () => allShipsPlaced && ships.every((ship) => !overlapsOrOutOfBounds(ship, ships)),
    [ships, allShipsPlaced]
  );

  const handleRandomize = () => {
    if (isLocked) return;
    setShips(generateRandomPlacement());
    setRotationRejectedShipId(null);
    setCurrentPlacementIndex(8);
    setDragShipId(null);
    setDragStartCell(null);
  };

  const handleConfirm = async () => {
    if (!socket || !roomCode || !allShipsPlaced || !isValidPlacement) return;
    setSubmitting(true);
    const placed = ships.filter(isOnBoard);
    await placeShips(socket, roomCode, placed);
    setMyPlacement(placed);
    setSubmitting(false);
  };

  const myReady = useMemo(
    () => (playerId ? playersReady[playerId] : false),
    [playersReady, playerId]
  );
  const isLocked = myReady;

  const cellIsOccupied = (x: number, y: number) =>
    ships.some(
      (ship) =>
        isOnBoard(ship) &&
        getShipCells(ship, getDef(ship.id)).some(([cx, cy]) => cx === x && cy === y)
    );

  const cellIsActive = (x: number, y: number) => {
    const activeShip = ships.find((s) => s.id === activeShipId);
    if (!activeShip || !isOnBoard(activeShip)) return false;
    return getShipCells(activeShip, getDef(activeShip.id)).some(([cx, cy]) => cx === x && cy === y);
  };

  const previewShipId = dragShipId ?? (currentShipUnplaced ? currentShipIdInSequence : null);
  const previewAtHover = useMemo(() => {
    if (!hoverCell || !previewShipId) return null;
    const ship = ships.find((s) => s.id === previewShipId);
    if (!ship) return null;
    const orient = dragShipId ? ship.orientation : orientation;
    const candidate: ShipPlacementType = { ...ship, x: hoverCell.x, y: hoverCell.y, orientation: orient };
    const others = ships.filter((s) => s.id !== previewShipId && isOnBoard(s));
    const invalid = overlapsOrOutOfBounds(candidate, [...others, candidate]);
    const cells = getShipCells(candidate, getDef(ship.id));
    return { cells, invalid };
  }, [hoverCell, previewShipId, ships, orientation, dragShipId]);

  const cellIsPreviewInvalid = (x: number, y: number) =>
    !!previewAtHover?.invalid && previewAtHover.cells.some(([cx, cy]) => cx === x && cy === y);

  const cellIsPreviewValid = (x: number, y: number) =>
    !!previewAtHover && !previewAtHover.invalid && previewAtHover.cells.some(([cx, cy]) => cx === x && cy === y);

  const cellIsInvalidPlaced = (x: number, y: number) => {
    const ship = getShipAtCell(x, y);
    if (!ship) return false;
    return overlapsOrOutOfBounds(ship, ships);
  };

  return (
    <div className="min-h-screen bg-background text-text-main flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <h1
          className="text-xl font-semibold tracking-wide"
          style={{ color: COLORS.DARK_GREEN }}
        >
          Place your fleet
        </h1>

        <div className="flex flex-col items-center">
          <div className="flex">
            <div className="w-6 flex-shrink-0" aria-hidden />
            {COL_LABELS.map((letter) => (
              <div
                key={letter}
                className="w-7 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0"
                style={{ color: COLORS.DARK_GREEN }}
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex flex-col w-6 flex-shrink-0">
              {ROW_LABELS.map((num) => (
                <div
                  key={num}
                  className="h-7 flex items-center justify-center text-xs font-medium"
                  style={{ color: COLORS.DARK_GREEN }}
                >
                  {num}
                </div>
              ))}
            </div>
            <div
              className="grid grid-cols-10 grid-rows-10 border rounded-lg overflow-hidden bg-grid-deep/10"
              style={{ borderColor: COLORS.DARK_GREEN }}
              onMouseLeave={() => setHoverCell(null)}
              onMouseMove={handleCellMouseMove}
            >
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
                const x = idx % BOARD_SIZE;
                const y = Math.floor(idx / BOARD_SIZE);
                const active = cellIsActive(x, y);
                const occupied = cellIsOccupied(x, y);
                const previewInvalid = cellIsPreviewInvalid(x, y);
                const previewValid = cellIsPreviewValid(x, y);
                const invalidPlaced = cellIsInvalidPlaced(x, y);
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleCellClick(x, y)}
                    onMouseDown={() => handleCellMouseDown(x, y)}
                    onMouseUp={() => handleCellMouseUp(x, y)}
                    onMouseEnter={() => !isLocked && setHoverCell({ x, y })}
                    className={`w-7 h-7 flex-shrink-0 border transition-colors select-none ${
                      isLocked ? "cursor-default" : "cursor-pointer hover:ring-1 hover:ring-accent-primary/50 hover:ring-inset"
                    } ${
                      previewValid
                        ? "bg-green-500/35 border-green-600/60"
                        : previewInvalid
                        ? "bg-red-500/35 border-red-600/60"
                        : invalidPlaced
                        ? "bg-amber-500/20 border-amber-500/50"
                        : active
                        ? "bg-accent-primary/25 border-accent-primary/60"
                        : occupied
                        ? "bg-background/90"
                        : "bg-background/90"
                    }`}
                    style={{
                      // Softer inner grid lines: same DARK_GREEN tone with low opacity
                      borderColor: "rgba(30, 61, 47, 0.25)",
                      backgroundColor: occupied && !previewValid && !previewInvalid && !invalidPlaced && !active
                        ? COLORS.ORANGE
                        : undefined
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between px-1">
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: COLORS.DARK_GREEN }}
            >
              Fleet
            </span>
            {!isLocked && (
              <button
                type="button"
                onClick={handleRotate}
                className="text-xs rounded-full border px-3 py-1.5 hover:bg-grid-deep/10 transition-colors"
                style={{ borderColor: COLORS.DARK_GREEN, color: COLORS.DARK_GREEN }}
              >
                Rotate current
              </button>
            )}
          </div>
          <div className="space-y-1.5" role="list" aria-label="Fleet list">
            {SHIP_DEFINITIONS.map((ship) => {
              const currentShip = ships.find((s) => s.id === ship.id);
              const isCurrentInSequence =
                currentPlacementIndex < 8 && ship.id === currentShipIdInSequence;
              const rotationRejected = ship.id === rotationRejectedShipId;
              const isL = ship.shape === "L";
              const orient = isL && currentShip && typeof currentShip.orientation === "number"
                ? currentShip.orientation
                : 0;
              return (
                <div
                  key={ship.id}
                  role="listitem"
                  className={`w-full flex items-center justify-between rounded-lg border-2 px-4 py-2 text-left text-sm transition-all cursor-default ${
                    rotationRejected
                      ? "border-red-500 bg-red-500/15"
                      : isCurrentInSequence
                      ? "border-accent-primary bg-accent-primary/15 ring-2 ring-accent-primary/30"
                      : "border-grid-deep/20 bg-white/80 opacity-80"
                  }`}
                >
                  <span className="font-medium text-text-main flex items-center gap-2">
                    {ship.label}
                    {isCurrentInSequence && (
                      <span className="text-xs font-normal text-accent-primary uppercase tracking-wide">
                        Place next
                      </span>
                    )}
                  </span>
                  {isL ? (
                    <span
                      className="inline-grid gap-px w-5 h-5"
                      style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}
                    >
                      {L_OFFSETS[orient % 4].map(({ dx, dy }, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-sm flex-shrink-0 ${
                            rotationRejected ? "bg-red-500" : isCurrentInSequence ? "bg-accent-primary" : ""
                          }`}
                          style={{
                            gridColumn: dx + 1,
                            gridRow: dy + 1,
                            backgroundColor:
                              rotationRejected || isCurrentInSequence
                                ? undefined
                                : COLORS.ORANGE
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span
                      className={`flex gap-px ${
                        currentShip?.orientation === "vertical" ? "flex-col" : "flex-row"
                      }`}
                    >
                      {Array.from({ length: ship.size }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2.5 h-2 rounded-sm flex-shrink-0 ${
                            rotationRejected ? "bg-red-500" : isCurrentInSequence ? "bg-accent-primary" : ""
                          }`}
                          style={{
                            backgroundColor:
                              rotationRejected || isCurrentInSequence
                                ? undefined
                                : COLORS.ORANGE
                          }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {rotationRejectedShipId && (
            <p className="text-xs text-red-600 font-medium mt-1.5 px-1" role="alert">
              Cannot rotate here – not enough space
            </p>
          )}
        </div>

        <div className="w-full max-w-sm space-y-1.5">
          <button
            type="button"
            onClick={handleRandomize}
            disabled={isLocked}
            className="w-full rounded-full border-2 border-[#8B6F47] text-[#8B6F47] bg-transparent px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all hover:bg-[#8B6F47]/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Randomize fleet
          </button>
          <p className="text-xs text-text-main/55 text-center -mt-0.5">
            Try different layouts
          </p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allShipsPlaced || !isValidPlacement || submitting || isLocked}
            className="w-full rounded-full bg-[#1E3D2F] text-white px-6 py-3 text-sm font-medium uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2A523F] disabled:hover:bg-[#1E3D2F]"
          >
            {isLocked
              ? "Waiting for opponent…"
              : submitting
              ? "Confirming…"
              : "Confirm placement"}
          </button>
          <p className="text-xs text-text-main/55 text-center">
            {!allShipsPlaced && "Click the board to place the highlighted ship. Drag a placed ship to move it; click on a placed ship to rotate it. One-cell water gap."}
            {allShipsPlaced && !isValidPlacement && "Adjust ships so none overlap and each has a water gap."}
            {isValidPlacement && !isLocked && "All ships placed. Drag to move, click on a ship to rotate. Confirm to lock your board."}
            {isLocked && "Your fleet is locked."}
          </p>
        </div>
      </div>
    </div>
  );
};
