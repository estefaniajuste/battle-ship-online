// Simple in-memory matchmaking queue

const queue = [];

export function enqueuePlayer(socket, playerName) {
  // Avoid duplicates
  if (queue.some((entry) => entry.socket.id === socket.id)) {
    return;
  }
  queue.push({ socket, playerName });
}

export function removeFromQueue(socketId) {
  const index = queue.findIndex((entry) => entry.socket.id === socketId);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

export function tryMatch() {
  if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    return [p1, p2];
  }
  return null;
}

