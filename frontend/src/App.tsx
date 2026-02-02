import React from "react";
import { useGame } from "./state/GameContext";
import { HomeScreen } from "./components/home/HomeScreen";
import { WaitingRoom } from "./components/waiting/WaitingRoom";
import { ShipPlacementScreen } from "./components/setup/ShipPlacement";
import { GameScreen } from "./components/game/GameScreen";
import { GameResultScreen } from "./components/result/GameResult";

export const App: React.FC = () => {
  const { screen } = useGame();

  if (screen === "waiting") return <WaitingRoom />;
  if (screen === "placement") return <ShipPlacementScreen />;
  if (screen === "game") return <GameScreen />;
  if (screen === "result") return <GameResultScreen />;
  return <HomeScreen />;
};

