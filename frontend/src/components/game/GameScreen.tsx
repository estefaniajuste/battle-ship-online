import React from "react";
import { useGame } from "../../state/GameContext";
import { leaveRoom } from "../../services/gameApi";

export const GameScreen: React.FC = () => {
  const {
    isMyTurn,
    opponentName,
    socket,
    roomCode,
    setScreen,
    setResult
  } = useGame();

  const handleBackToMenu = () => {
    if (socket && roomCode) {
      leaveRoom(socket, roomCode);
    }
    setScreen("home");
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4">Partida en curso</h2>

      <div className="mb-4">
        <p className="text-lg">
          Oponente: <strong>{opponentName || "Esperando..."}</strong>
        </p>
      </div>

      <div className="mb-6">
        <p className="text-lg font-semibold">
          {isMyTurn ? "Es tu turno" : "Turno del oponente"}
        </p>
      </div>

      <button
        onClick={handleBackToMenu}
        className="mt-4 text-sm rounded-full border px-4 py-2"
      >
        Volver al menú principal
      </button>
    </div>
  );
};

