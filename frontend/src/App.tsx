import React, { useEffect } from "react";
import { useGame } from "./state/GameContext";

import { preloadGameSounds } from "./utils/gameSounds";

import { HomeScreen } from "./components/home/HomeScreen";
import { WaitingRoom } from "./components/waiting/WaitingRoom";
import { ShipPlacementScreen } from "./components/setup/ShipPlacement";
import { GameScreen } from "./components/game/GameScreen";
import { GameResultScreen } from "./components/result/GameResult";
import { LoginScreen } from "./components/auth/LoginScreen";
import { RegisterScreen } from "./components/auth/RegisterScreen";
import { ProfileScreen } from "./components/auth/ProfileScreen";

export const App: React.FC = () => {
  const { screen } = useGame();

  useEffect(() => {
    preloadGameSounds();
  }, []);

  if (screen === "waiting") return <WaitingRoom />;
  if (screen === "placement") return <ShipPlacementScreen />;
  if (screen === "game") return <GameScreen />;
  if (screen === "result") return <GameResultScreen />;
  if (screen === "login") return <LoginScreen />;
  if (screen === "register") return <RegisterScreen />;
  if (screen === "profile") return <ProfileScreen />;

  return <HomeScreen />;
};