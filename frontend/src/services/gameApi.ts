import { Socket } from "socket.io-client";
import { ShipPlacement } from "../state/GameContext";

export function createRoom(socket: Socket, playerName: string) {
  return new Promise<{
    ok: boolean;
    roomCode?: string;
    playerId?: string;
    players?: any;
    error?: string;
  }>((resolve) => {
    socket.emit("createRoom", { playerName }, (response: any) => resolve(response));
  });
}

export function joinRoom(socket: Socket, roomCode: string, playerName: string) {
  return new Promise<{
    ok: boolean;
    roomCode?: string;
    playerId?: string;
    players?: any;
    error?: string;
  }>((resolve) => {
    socket.emit("joinRoom", { roomCode, playerName }, (response: any) => resolve(response));
  });
}

export function queueMatch(socket: Socket, playerName: string) {
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    socket.emit("queueMatch", { playerName }, (response: any) => resolve(response));
  });
}

export function cancelQueue(socket: Socket) {
  socket.emit("cancelQueue");
}

export function placeShips(socket: Socket, roomCode: string, ships: ShipPlacement[]) {
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    socket.emit("placeShips", { roomCode, ships }, (response: any) => resolve(response));
  });
}

export function fire(socket: Socket, roomCode: string, x: number, y: number) {
  return new Promise<{ ok: boolean; error?: string }>((resolve) => {
    socket.emit("fire", { roomCode, x, y }, (response: any) => resolve(response));
  });
}

export function leaveRoom(socket: Socket, roomCode: string) {
  socket.emit("leaveRoom", { roomCode });
}

