import React from "react";
import { useGame, type BoardCellState, type ShipPlacement } from "../state/GameContext";
import { ShipPlacementScreen, getPlacementBoard, generateRandomPlacement } from "../components/setup/ShipPlacement";

export const AiPlacementScreen: React.FC = () => {
  const { startAIGame } = useGame();

  const handleStartAiGame = (playerPlacement: ShipPlacement[]) => {
    const aiPlacement = generateRandomPlacement();
    const raw = getPlacementBoard(playerPlacement);
    const initialPlayerBoard: BoardCellState[][] = raw.map((row) =>
      row.map((c) => (c === "ship" ? "ship" : "empty") as BoardCellState)
    );
    startAIGame(aiPlacement, initialPlayerBoard);
  };

  return <ShipPlacementScreen aiMode onStartAiGame={handleStartAiGame} />;
};
