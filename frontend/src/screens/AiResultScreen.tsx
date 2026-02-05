import React from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/Button";
import { useGame } from "../state/GameContext";
import { GAME_COLORS } from "../theme/gameColors";

export const AiResultScreen: React.FC = () => {
  const { aiResult, aiMyShots, aiOpponentShots, setScreen, resetAIGame } = useGame();

  const isWinner = aiResult === "win";

  const handlePlayAgain = () => {
    resetAIGame();
    setScreen("ai_placement");
  };

  const handleBackToMenu = () => {
    resetAIGame();
    setScreen("home");
  };

  return (
    <MainLayout>
      <div className="flex flex-col items-center text-center gap-8 max-w-md mx-auto px-4">
        <div className="rounded-xl border border-grid-deep/20 bg-background/95 px-6 py-8 w-full space-y-6">
          <h2
            className="text-3xl font-bold uppercase tracking-wide"
            style={{ color: isWinner ? GAME_COLORS.resultWinner : GAME_COLORS.resultLoser }}
          >
            {isWinner ? "Victory" : "Defeat"}
          </h2>

          <p className="text-sm text-text-main/70 uppercase tracking-wide">Game over</p>

          <p className="text-base text-text-main/90">
            {isWinner ? "You sank all computer ships." : "The computer sank all your ships."}
          </p>

          <div className="flex justify-center gap-6 text-sm text-text-main/80 pt-2">
            <span>My shots: {aiMyShots}</span>
            <span>AI shots: {aiOpponentShots}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button variant="primary" onClick={handlePlayAgain} className="flex-1" size="lg">
            Play again
          </Button>
          <Button variant="ghost" onClick={handleBackToMenu} className="flex-1" size="lg">
            Back to menu
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
