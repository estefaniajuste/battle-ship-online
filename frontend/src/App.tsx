import React, { useEffect } from "react";
import { useGame } from "./state/GameContext";

import { preloadGameSounds } from "./utils/gameSounds";

import { HomeScreen } from "./components/home/HomeScreen";
import { WaitingRoom } from "./components/waiting/WaitingRoom";
import { ShipPlacementScreen } from "./components/setup/ShipPlacement";
import { GameScreen } from "./components/game/GameScreen";
import { GameResultScreen } from "./components/result/GameResult";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { AiPlacementScreen } from "./screens/AiPlacementScreen";
import { AiGameScreen } from "./screens/AiGameScreen";
import { AiResultScreen } from "./screens/AiResultScreen";

export const App: React.FC = () => {
  const { screen } = useGame();

  useEffect(() => {
    preloadGameSounds();
  }, []);

  if (screen === "waiting") return <WaitingRoom />;
  if (screen === "placement") return <ShipPlacementScreen />;
  if (screen === "game") return <GameScreen />;
  if (screen === "result") return <GameResultScreen />;
  if (screen === "ai_placement") return <AiPlacementScreen />;
  if (screen === "ai_game") return <AiGameScreen />;
  if (screen === "ai_result") return <AiResultScreen />;
  if (screen === "login") return <LoginScreen />;
  if (screen === "register") return <RegisterScreen />;
  if (screen === "profile") return <ProfileScreen />;
  if (screen === "history") return <HistoryScreen />;
  if (screen === "stats") return <StatsScreen />;
  if (screen === "leaderboard") return <LeaderboardScreen />;

  return <HomeScreen />;
};