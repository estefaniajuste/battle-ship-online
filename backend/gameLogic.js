// Core Battleship game logic and validation

export const BOARD_SIZE = 10;

// New balanced fleet: 1×4, 2×3, 2×2, 2×1, 1×L (3 cells)
export const SHIP_DEFINITIONS = [
  { id: "battleship", size: 4 },
  { id: "cruiser", size: 3 },
  { id: "submarine", size: 3 },
  { id: "destroyer", size: 2 },
  { id: "patrol", size: 2 },
  { id: "dinghy1", size: 1 },
  { id: "dinghy2", size: 1 },
  { id: "lship", size: 3, shape: "L" }
];

// L-shape cell offsets by orientation (anchor at top-left of bounding box)
// 0: (0,0),(1,0),(0,1)  1: (0,0),(0,1),(1,1)  2: (0,1),(1,0),(1,1)  3: (0,0),(1,0),(1,1)
const L_OFFSETS = [
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }]
];

const EIGHT_NEIGHBORS = [
  { dx: -1, dy: -1 }, { dx: -1, dy: 0 }, { dx: -1, dy: 1 },
  { dx: 0, dy: -1 },                   { dx: 0, dy: 1 },
  { dx: 1, dy: -1 },  { dx: 1, dy: 0 }, { dx: 1, dy: 1 }
];

function getShipCells(ship, def) {
  if (def.shape === "L") {
    const orient = typeof ship.orientation === "number" ? ship.orientation : 0;
    const offsets = L_OFFSETS[orient % 4];
    return offsets.map(({ dx, dy }) => ({ x: ship.x + dx, y: ship.y + dy }));
  }
  const cells = [];
  for (let i = 0; i < def.size; i++) {
    const cx = ship.orientation === "horizontal" ? ship.x + i : ship.x;
    const cy = ship.orientation === "vertical" ? ship.y + i : ship.y;
    cells.push({ x: cx, y: cy });
  }
  return cells;
}

/** Returns all cells that are adjacent (8-neighbor) to any cell in the list (1-cell water buffer). */
function getBufferAroundCells(cells) {
  const set = new Set();
  for (const { x, y } of cells) {
    for (const { dx, dy } of EIGHT_NEIGHBORS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        set.add(`${nx},${ny}`);
      }
    }
  }
  return Array.from(set).map((key) => {
    const [nx, ny] = key.split(",").map(Number);
    return { x: nx, y: ny };
  });
}

export function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      hasShip: false,
      hit: false,
      miss: false
    }))
  );
}

export function applyShipsToBoard(ships) {
  const board = createEmptyBoard();
  const shipMap = {};
  const forbidden = new Set(); // cells and 1-cell buffer from already-placed ships

  for (const def of SHIP_DEFINITIONS) {
    const ship = ships.find((s) => s.id === def.id);
    if (!ship) {
      throw new Error(`Missing ship: ${def.id}`);
    }

    const cells = getShipCells(ship, def);

    for (const { x: cx, y: cy } of cells) {
      if (cx < 0 || cy < 0 || cx >= BOARD_SIZE || cy >= BOARD_SIZE) {
        throw new Error("Ship out of bounds");
      }
      if (board[cy][cx].hasShip) {
        throw new Error("Ships cannot overlap");
      }
      if (forbidden.has(`${cx},${cy}`)) {
        throw new Error("Ships must have a one-cell water buffer between them");
      }
    }

    for (const { x: cx, y: cy } of cells) {
      board[cy][cx].hasShip = true;
      board[cy][cx].shipId = def.id;
      forbidden.add(`${cx},${cy}`);
    }
    const bufferCells = getBufferAroundCells(cells);
    for (const { x: bx, y: by } of bufferCells) {
      forbidden.add(`${bx},${by}`);
    }

    shipMap[def.id] = {
      id: def.id,
      size: cells.length,
      hits: 0
    };
  }

  return { board, shipMap };
}

export function createInitialGameState(playerIds) {
  return {
    players: {
      [playerIds[0]]: {
        board: null,
        ships: null,
        ready: false
      },
      [playerIds[1]]: {
        board: null,
        ships: null,
        ready: false
      }
    },
    currentTurn: null,
    winner: null,
    started: false
  };
}

export function setPlayerPlacement(game, playerId, ships) {
  const { board, shipMap } = applyShipsToBoard(ships);
  game.players[playerId].board = board;
  game.players[playerId].ships = shipMap;
  game.players[playerId].ready = true;

  const [p1, p2] = Object.keys(game.players);
  if (game.players[p1].ready && game.players[p2].ready) {
    game.started = true;
    game.currentTurn = Math.random() < 0.5 ? p1 : p2;
  }

  return game.started;
}

export function fireAt(game, attackerId, x, y) {
  if (!game.started || game.winner) {
    throw new Error("Game is not active");
  }

  if (game.currentTurn !== attackerId) {
    throw new Error("Not your turn");
  }

  const defenderId = Object.keys(game.players).find((id) => id !== attackerId);
  const defender = game.players[defenderId];

  if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
    throw new Error("Shot out of bounds");
  }

  const cell = defender.board[y][x];
  if (cell.hit || cell.miss) {
    throw new Error("Cell already targeted");
  }

  let result = {
    hit: false,
    miss: false,
    sunkShipId: null,
    sunkShipCells: [],
    gameOver: false,
    winnerId: null,
    autoRevealedWater: []
  };

  if (cell.hasShip) {
    cell.hit = true;
    result.hit = true;
    const shipId = cell.shipId;
    const ship = defender.ships[shipId];
    ship.hits += 1;

    if (ship.hits >= ship.size) {
      result.sunkShipId = shipId;
      const sunkCells = [];
      for (let cy = 0; cy < BOARD_SIZE; cy++) {
        for (let cx = 0; cx < BOARD_SIZE; cx++) {
          if (defender.board[cy][cx].shipId === shipId) {
            sunkCells.push({ x: cx, y: cy });
          }
        }
      }
      result.sunkShipCells = sunkCells;
      const bufferCells = getBufferAroundCells(sunkCells);
      for (const { x: bx, y: by } of bufferCells) {
        const c = defender.board[by][bx];
        if (!c.hasShip && !c.hit && !c.miss) {
          c.miss = true;
          result.autoRevealedWater.push({ x: bx, y: by });
        }
      }
      const allSunk = Object.values(defender.ships).every((s) => s.hits >= s.size);
      if (allSunk) {
        game.winner = attackerId;
        result.gameOver = true;
        result.winnerId = attackerId;
      }
    }
  } else {
    cell.miss = true;
    result.miss = true;
  }

  // Classic Battleship: turn changes only on miss; hit (including sink) keeps the same player
  if (!result.gameOver && result.miss) {
    game.currentTurn = defenderId;
  }

  return result;
}
