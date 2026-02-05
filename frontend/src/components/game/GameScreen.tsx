import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../../state/GameContext";
import { leaveRoom, fire } from "../../services/gameApi";
import { BoardGrid, CellStatus } from "./BoardGrid";
import { playHit, playMiss, playSunk } from "../../utils/gameSounds";
import { COLORS } from "../../theme/colors";

type SinkingAnimation = {
  phase: "fire" | "burned";
  cells: { x: number; y: number }[];
  board: "own" | "opponent";
};

export const GameScreen: React.FC = () => {
  const {
    isMyTurn,
    opponentName,
    socket,
    roomCode,
    setScreen,
    setResult,
    playerId,
    myPlacement
  } = useGame();

  const [myBoard, setMyBoard] = useState<CellStatus[][]>([]);
  const [enemyBoard, setEnemyBoard] = useState<CellStatus[][]>([]);
  const [sunkShips, setSunkShips] = useState<Set<string>>(new Set());

  const sinkingTimer = useRef<number | null>(null);

  useEffect(() => {
    const emptyBoard: CellStatus[][] = Array(10)
      .fill(null)
      .map(() => Array(10).fill("empty" as CellStatus));

    setEnemyBoard(emptyBoard);

    if (myPlacement && myPlacement.length > 0) {
      const boardWithShips = emptyBoard.map(row => [...row]);

      myPlacement.forEach(ship => {
        for (let i = 0; i < ship.size; i++) {
          const x =
            ship.orientation === "horizontal"
              ? ship.x + i
              : ship.x;

          const y =
            ship.orientation === "vertical"
              ? ship.y + i
              : ship.y;

          if (boardWithShips[y] && boardWithShips[y][x] !== undefined) {
            boardWithShips[y][x] = "ship";
          }
        }
      });

      setMyBoard(boardWithShips);
    } else {
      setMyBoard(emptyBoard);
    }
  }, [myPlacement]);

  useEffect(() => {
    if (!socket) return;

    const handleShotResult = (data: any) => {
      const {
        attackerId,
        x,
        y,
        hit,
        sunkShipId,
        sunkShipCells = [],
        autoRevealedWater = []
      } = data;

      if (sunkShipId) {
        setSunkShips(prev => new Set([...prev, sunkShipId]));
      }

      const isMe = attackerId === playerId;

      if (hit) {
        if (sunkShipId) {
          playSunk();
        } else {
          playHit();
        }
      } else {
        playMiss();
      }

      const applyShotToBoard = (prev: CellStatus[][]) => {
        const copy = prev.map(row => [...row]);

        if (sunkShipId && sunkShipCells.length > 0) {
          sunkShipCells.forEach((cell: any) => {
            copy[cell.y][cell.x] = "sunk";
          });
        } else {
          copy[y][x] = hit ? "hit" : "miss";
        }

        autoRevealedWater.forEach((cell: any) => {
          if (copy[cell.y][cell.x] === "empty") {
            copy[cell.y][cell.x] = "miss";
          }
        });

        return copy;
      };

      if (isMe) {
        setEnemyBoard(prev => applyShotToBoard(prev));
      } else {
        setMyBoard(prev => applyShotToBoard(prev));
      }
    };

    socket.on("game:shotResult", handleShotResult);

    return () => {
      socket.off("game:shotResult", handleShotResult);
    };
  }, [socket, playerId]);

  const handleBackToMenu = () => {
    if (socket && roomCode) {
      leaveRoom(socket, roomCode);
    }

    setScreen("home");
    setResult(null);
  };

  const handleFire = async (x: number, y: number) => {
    if (!socket || !roomCode || !isMyTurn) return;

    if (enemyBoard[y][x] !== "empty") return;

    await fire(socket, roomCode, x, y);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">

      <h2
        className="text-xl font-bold mb-4"
        style={{ color: COLORS.DARK_GREEN }}
      >
        Game in progress
      </h2>

      <div className="mb-4">
        <p className="text-lg" style={{ color: COLORS.DARK_GREEN }}>
          Opponent: <strong>{opponentName || "Waiting..."}</strong>
        </p>
      </div>

      <div className="mb-6">
        <p className="text-lg font-semibold" style={{ color: COLORS.DARK_GREEN }}>
          {isMyTurn ? "Your turn" : "Opponent's turn"}
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* MI TABLERO */}
        <div>
          <h3 style={{ color: COLORS.DARK_GREEN }} className="text-center mb-2">
            Your board
          </h3>

          <BoardGrid
            title="Your board"
            board={myBoard}
            mode="defense"
            disabled
          />
        </div>

        {/* TABLERO OPONENTE + LEYENDA */}
        <div className="flex">

          <div>
            <h3 style={{ color: COLORS.DARK_GREEN }} className="text-center mb-2">
              Opponent board
            </h3>

            <BoardGrid
              title="Opponent board"
              board={enemyBoard}
              mode="attack"
              onCellClick={handleFire}
              disabled={!isMyTurn}
            />
          </div>

          {/* LEYENDA - ALTURA INTERMEDIA AJUSTADA */}
          <div className="ml-3 mt-[110px] flex flex-col gap-[3px]">

            {[
              { id: "battleship", size: 4 },
              { id: "cruiser", size: 3 },
              { id: "submarine", size: 3 },
              { id: "destroyer", size: 2 },
              { id: "patrol", size: 2 },
              { id: "dinghy1", size: 1 },
              { id: "dinghy2", size: 1 }
            ].map((ship) => {
              const isSunk = sunkShips.has(ship.id);

              return (
                <div key={ship.id} className="flex gap-[2px]">
                  {Array.from({ length: ship.size }).map((_, i) => (
                    <div
                      key={i}
                      className="w-[9px] h-[9px] rounded-sm"
                      style={{
                        backgroundColor: isSunk
                          ? COLORS.DARK_BROWN
                          : COLORS.ORANGE
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {/* BARCO EN L */}
            <div className="mt-[4px]">
              <div className="grid grid-cols-2 gap-[2px] w-fit">
                {Array(3).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className="w-[9px] h-[9px]"
                    style={{
                      backgroundColor: sunkShips.has("lship")
                        ? COLORS.DARK_BROWN
                        : COLORS.ORANGE
                    }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      <button
        onClick={handleBackToMenu}
        className="mt-6 text-sm rounded-full border px-4 py-2"
        style={{
          color: COLORS.DARK_GREEN,
          borderColor: COLORS.DARK_GREEN
        }}
      >
        Back to main menu
      </button>
    </div>
  );
};