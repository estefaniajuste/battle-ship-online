import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import {
  createRoom,
  joinRoom,
  attachMatchRoom,
  getRoom,
  handleShipPlacement,
  handleFire,
  removeRoom
} from "./rooms.js";

import { enqueuePlayer, removeFromQueue, tryMatch } from "./matchmaking.js";

const PORT = process.env.PORT || 4000;

const app = express();

// CORS abierto para evitar bloqueos entre Vercel y Render
app.use(cors());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Battle Ship backend running" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("createRoom", ({ playerName }, callback) => {
    try {
      console.log("🏠 createRoom solicitado por:", socket.id);

      const room = createRoom(socket, playerName || "Player");

      callback?.({
        ok: true,
        roomCode: room.code,
        playerId: socket.id,
        players: room.players
      });

    } catch (err) {
      console.error("❌ Error en createRoom:", err);
      callback?.({ ok: false, error: err.message || "Failed to create room" });
    }
  });

  socket.on("joinRoom", ({ roomCode, playerName }, callback) => {
    try {
      console.log("👥 joinRoom:", socket.id, "uniéndose a", roomCode);

      const room = joinRoom(socket, roomCode, playerName || "Player");
      const playerCount = Object.keys(room.players).length;

      io.to(room.code).emit("room:playersUpdate", { players: room.players });

      if (playerCount === 2) {
        console.log("✅ Sala lista con 2 jugadores. Enviando room:ready");

        io.to(room.code).emit("room:ready", {
          roomCode: room.code,
          players: room.players
        });
      }

      callback?.({
        ok: true,
        roomCode: room.code,
        playerId: socket.id,
        players: room.players
      });

    } catch (err) {
      console.error("❌ Error en joinRoom:", err);
      callback?.({ ok: false, error: err.message || "Failed to join room" });
    }
  });

  socket.on("queueMatch", ({ playerName }, callback) => {
    try {
      console.log("🎯 queueMatch por:", socket.id);

      enqueuePlayer(socket, playerName || "Player");
      callback?.({ ok: true });

      const match = tryMatch();

      if (match) {
        console.log("🤝 Match encontrado entre dos jugadores");

        const [p1, p2] = match;
        const roomCode = `M${Date.now().toString(36).toUpperCase()}`;

        const room = attachMatchRoom(
          roomCode,
          p1.socket,
          p2.socket,
          p1.playerName,
          p2.playerName
        );

        io.to(room.code).emit("match:found", {
          roomCode: room.code,
          players: room.players
        });
      }

    } catch (err) {
      console.error("❌ Error en queueMatch:", err);
      callback?.({ ok: false, error: err.message || "Failed to queue" });
    }
  });

  socket.on("cancelQueue", () => {
    console.log("🚫 cancelQueue por:", socket.id);
    removeFromQueue(socket.id);
  });

  socket.on("placeShips", ({ roomCode, ships }, callback) => {
    try {
      console.log("📦 placeShips recibido de:", socket.id);
      console.log("Barcos enviados:", ships);

      const { room, startedNow } = handleShipPlacement(
        roomCode,
        socket.id,
        ships
      );

      console.log("Estado ready tras placeShips:", {
        hostId: room.hostId,
        guestId: room.guestId,
        hostReady: room.game.players[room.hostId]?.ready,
        guestReady: room.game.players[room.guestId]?.ready,
        startedNow
      });

      io.to(room.code).emit("game:placementUpdate", {
        playersReady: {
          [room.hostId]: room.game.players[room.hostId].ready,
          [room.guestId]: room.game.players[room.guestId].ready
        }
      });

      if (startedNow) {
        console.log("🚀 EMITIENDO game:started a la sala:", room.code);
        console.log("Turno inicial será:", room.game.currentTurn);

        io.to(room.code).emit("game:started", {
          currentTurn: room.game.currentTurn
        });
      } else {
        console.log("⏳ Aún no están listos ambos jugadores");
      }

      callback?.({ ok: true });

    } catch (err) {
      console.error("❌ Error en placeShips:", err);
      callback?.({ ok: false, error: err.message || "Invalid placement" });
    }
  });

  socket.on("fire", ({ roomCode, x, y }, callback) => {
    try {
      console.log("🔥 FIRE desde:", socket.id, "en", roomCode, x, y);

      const { room, result } = handleFire(roomCode, socket.id, x, y);

      console.log("Resultado del disparo:", result);

      io.to(room.code).emit("game:shotResult", {
        attackerId: socket.id,
        x,
        y,
        ...result,
        sunkShipCells: result.sunkShipCells || [],
        autoRevealedWater: result.autoRevealedWater || [],
        currentTurn: room.game.currentTurn
      });

      if (result.gameOver) {
        console.log("🏁 Juego terminado. Ganador:", result.winnerId);

        io.to(room.code).emit("game:over", {
          winnerId: result.winnerId
        });
      }

      callback?.({ ok: true, ...result });

    } catch (err) {
      console.error("❌ Error en fire:", err);
      callback?.({ ok: false, error: err.message || "Invalid move" });
    }
  });

  socket.on("leaveRoom", ({ roomCode }) => {
    if (!roomCode) return;

    console.log("🚪 leaveRoom:", socket.id, "de", roomCode);

    socket.leave(roomCode);

    const room = getRoom(roomCode);
    if (room) {
      io.to(room.code).emit("room:opponentLeft");
      removeRoom(roomCode);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);

    removeFromQueue(socket.id);

    for (const [code, room] of io.sockets.adapter.rooms) {
      if (code.startsWith("M") || code.length === 6) {
        if (room.has(socket.id)) {
          console.log("🚪 Notificando salida por desconexión en sala:", code);
          io.to(code).emit("room:opponentLeft");
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Battle Ship backend listening on port ${PORT}`);
});
