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
import { SoundManager } from "./components/audio/SoundManager";

export const App: React.FC = () => {
  const { screen } = useGame();

  useEffect(() => {
    preloadGameSounds();
  }, []);

  let content: JSX.Element;

  if (screen === "waiting") content = <WaitingRoom />;
  else if (screen === "placement") content = <ShipPlacementScreen />;
  else if (screen === "game") content = <GameScreen />;
  else if (screen === "result") content = <GameResultScreen />;
  else if (screen === "ai_placement") content = <AiPlacementScreen />;
  else if (screen === "ai_game") content = <AiGameScreen />;
  else if (screen === "ai_result") content = <AiResultScreen />;
  else if (screen === "login") content = <LoginScreen />;
  else if (screen === "register") content = <RegisterScreen />;
  else if (screen === "profile") content = <ProfileScreen />;
  else if (screen === "history") content = <HistoryScreen />;
  else if (screen === "stats") content = <StatsScreen />;
  else if (screen === "leaderboard") content = <LeaderboardScreen />;
  else content = <HomeScreen />;

  return (
    <>
      <SoundManager />
      {content}
    </>
  );
};
