// Room and game state management
import { createInitialGameState, setPlayerPlacement, fireAt } from "./gameLogic.js";

const rooms = new Map(); // roomCode -> room object

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function createRoom(hostSocket, playerName) {
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room = {
    code: roomCode,
    hostId: hostSocket.id,
    guestId: null,
    players: {
      [hostSocket.id]: {
        id: hostSocket.id,
        name: playerName
      }
    },
    game: null
  };

  rooms.set(roomCode, room);
  hostSocket.join(roomCode);
  return room;
}

export function joinRoom(guestSocket, roomCode, playerName) {
  const room = rooms.get(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }
  if (room.guestId) {
    throw new Error("Room is full");
  }

  room.guestId = guestSocket.id;
  room.players[guestSocket.id] = {
    id: guestSocket.id,
    name: playerName
  };
  room.game = createInitialGameState([room.hostId, room.guestId]);

  guestSocket.join(roomCode);
  return room;
}

export function attachMatchRoom(roomCode, player1Socket, player2Socket, player1Name, player2Name) {
  const room = {
    code: roomCode,
    hostId: player1Socket.id,
    guestId: player2Socket.id,
    players: {
      [player1Socket.id]: { id: player1Socket.id, name: player1Name },
      [player2Socket.id]: { id: player2Socket.id, name: player2Name }
    },
    game: createInitialGameState([player1Socket.id, player2Socket.id])
  };
  rooms.set(roomCode, room);
  player1Socket.join(roomCode);
  player2Socket.join(roomCode);
  return room;
}

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function removeRoom(roomCode) {
  rooms.delete(roomCode);
}

export function handleShipPlacement(roomCode, playerId, ships) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) {
    throw new Error("Room or game not found");
  }

  const startedNow = setPlayerPlacement(room.game, playerId, ships);
  return { room, startedNow };
}

export function handleFire(roomCode, attackerId, x, y) {
  const room = rooms.get(roomCode);
  if (!room || !room.game) {
    throw new Error("Room or game not found");
  }

  const result = fireAt(room.game, attackerId, x, y);
  return { room, result };
}

