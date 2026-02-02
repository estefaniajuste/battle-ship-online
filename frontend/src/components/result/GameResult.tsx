import React from "react";
import { MainLayout } from "../layout/MainLayout";
import { Button } from "../ui/Button";
import { useGame } from "../../state/GameContext";
import { leaveRoom } from "../../services/gameApi";

export const GameResultScreen: React.FC = () => {
  const {
    result,
    setResult,
    setScreen,
    socket,
    roomCode,
    playerName,
    opponentName,
    finalMyShots,
    finalOpponentShots
  } = useGame();

  // Personalized message: winner id from backend vs current player id (already in result)
  const isWinner = result === "win";
  const winnerName = isWinner ? playerName : opponentName;

  const handlePlayAgain = () => {
    if (socket && roomCode) leaveRoom(socket, roomCode);
    setResult(null);
    setScreen("home");
  };

  const handleMainMenu = () => {
    if (socket && roomCode) leaveRoom(socket, roomCode);
    setResult(null);
    setScreen("home");
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center text-center gap-8 max-w-md mx-auto px-4">
        <div className="rounded-xl border border-grid-deep/20 bg-background/95 px-6 py-8 w-full space-y-6">
          {/* Personalized outcome – clear at a glance */}
          <h2
            className={`text-3xl font-bold uppercase tracking-wide ${
              isWinner ? "text-[#1E3D2F]" : "text-stone-600"
            }`}
          >
            {isWinner ? "You win" : "You lose"}
          </h2>

          <p className="text-sm text-text-main/70 uppercase tracking-wide">Game over</p>

          <p className="text-base text-text-main/90">
            Winner: <span className="font-semibold text-text-main">{winnerName || "—"}</span>
          </p>

          {/* Final shot counters */}
          <div className="flex justify-center gap-6 text-sm text-text-main/80 pt-2">
            <span>Your shots: {finalMyShots}</span>
            <span>Opponent shots: {finalOpponentShots}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button variant="primary" onClick={handlePlayAgain} className="flex-1" size="lg">
            Play again
          </Button>
          <Button variant="ghost" onClick={handleMainMenu} className="flex-1" size="lg">
            Main menu
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
