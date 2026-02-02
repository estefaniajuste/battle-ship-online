import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { createRoom, joinRoom, attachMatchRoom, getRoom, handleShipPlacement, handleFire, removeRoom } from "./rooms.js";
import { enqueuePlayer, removeFromQueue, tryMatch } from "./matchmaking.js";

const PORT = process.env.PORT || 4000;

const app = express();

// CORS totalmente abierto para evitar bloqueos entre Vercel y Render
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
  console.log("Client connected", socket.id);

  socket.on("createRoom", ({ playerName }, callback) => {
    try {
      const room = createRoom(socket, playerName || "Player");
      callback?.({ ok: true, roomCode: room.code, playerId: socket.id, players: room.players });
    } catch (err) {
      console.error(err);
      callback?.({ ok: false, error: err.message || "Failed to create room" });
    }
  });

  socket.on("joinRoom", ({ roomCode, playerName }, callback) => {
    try {
      const room = joinRoom(socket, roomCode, playerName || "Player");
      const playerCount = Object.keys(room.players).length;

      io.to(room.code).emit("room:playersUpdate", { players: room.players });

      // When room has 2 players, broadcast game_start so BOTH host and guest go to placement
      if (playerCount === 2) {
        io.to(room.code).emit("room:ready", {
          roomCode: room.code,
          players: room.players
        });
      }

      callback?.({ ok: true, roomCode: room.code, playerId: socket.id, players: room.players });
    } catch (err) {
      console.error(err);
      callback?.({ ok: false, error: err.message || "Failed to join room" });
    }
  });

  socket.on("queueMatch", ({ playerName }, callback) => {
    try {
      enqueuePlayer(socket, playerName || "Player");
      callback?.({ ok: true });

      const match = tryMatch();
      if (match) {
        const [p1, p2] = match;
        const roomCode = `M${Date.now().toString(36).toUpperCase()}`;
        const room = attachMatchRoom(roomCode, p1.socket, p2.socket, p1.playerName, p2.playerName);

        io.to(room.code).emit("match:found", {
          roomCode: room.code,
          players: room.players
        });
      }
    } catch (err) {
      console.error(err);
      callback?.({ ok: false, error: err.message || "Failed to queue" });
    }
  });

  socket.on("cancelQueue", () => {
    removeFromQueue(socket.id);
  });

  socket.on("placeShips", ({ roomCode, ships }, callback) => {
    try {
      const { room, startedNow } = handleShipPlacement(roomCode, socket.id, ships);
      io.to(room.code).emit("game:placementUpdate", {
        playersReady: {
          [room.hostId]: room.game.players[room.hostId].ready,
          [room.guestId]: room.game.players[room.guestId].ready
        }
      });

      if (startedNow) {
        io.to(room.code).emit("game:started", {
          currentTurn: room.game.currentTurn
        });
      }

      callback?.({ ok: true });
    } catch (err) {
      console.error(err);
      callback?.({ ok: false, error: err.message || "Invalid placement" });
    }
  });

  socket.on("fire", ({ roomCode, x, y }, callback) => {
    try {
      const { room, result } = handleFire(roomCode, socket.id, x, y);

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
        io.to(room.code).emit("game:over", {
          winnerId: result.winnerId
        });
      }

      callback?.({ ok: true, ...result });
    } catch (err) {
      console.error(err);
      callback?.({ ok: false, error: err.message || "Invalid move" });
    }
  });

  socket.on("leaveRoom", ({ roomCode }) => {
    if (!roomCode) return;
    socket.leave(roomCode);
    const room = getRoom(roomCode);
    if (room) {
      io.to(room.code).emit("room:opponentLeft");
      removeRoom(roomCode);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    removeFromQueue(socket.id);
    // Simple: notify any rooms where this player was present
    for (const [code, room] of io.sockets.adapter.rooms) {
      if (code.startsWith("M") || code.length === 6) {
        if (room.has(socket.id)) {
          io.to(code).emit("room:opponentLeft");
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Battle Ship backend listening on port ${PORT}`);
});

