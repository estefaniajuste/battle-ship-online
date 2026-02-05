import express from "express";
import { GameResult } from "../models/GameResult.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/games
 * Registra el resultado de una partida (usuario logueado).
 * Body: { result: "win" | "lose", myShots: number, opponentShots: number }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { result, myShots, opponentShots } = req.body || {};
    const userId = req.user.id;

    if (!result || (result !== "win" && result !== "lose")) {
      return res.status(400).json({ message: "result must be 'win' or 'lose'" });
    }
    const my = Number(myShots);
    const opp = Number(opponentShots);
    if (Number.isNaN(my) || my < 0 || Number.isNaN(opp) || opp < 0) {
      return res.status(400).json({ message: "myShots and opponentShots must be non-negative numbers" });
    }

    const winnerUserId = result === "win" ? userId : null;
    const loserUserId = result === "lose" ? userId : null;
    const winnerShots = result === "win" ? my : opp;
    const loserShots = result === "lose" ? my : opp;

    const game = await GameResult.create({
      winnerUserId: winnerUserId || null,
      loserUserId: loserUserId || null,
      winnerShots,
      loserShots
    });

    return res.status(201).json({
      id: game._id.toString(),
      result,
      winnerShots: game.winnerShots,
      loserShots: game.loserShots,
      playedAt: game.playedAt
    });
  } catch (err) {
    console.error("Error in POST /api/games:", err);
    return res.status(500).json({ message: "Failed to save game result" });
  }
});

/**
 * GET /api/games/history
 * Devuelve el historial de partidas del usuario logueado.
 */
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const games = await GameResult.find({
      $or: [
        { winnerUserId: userId },
        { loserUserId: userId }
      ]
    })
      .sort({ playedAt: -1 })
      .limit(100)
      .lean();

    const list = games.map((g) => ({
      id: g._id.toString(),
      playedAt: g.playedAt,
      winnerShots: g.winnerShots,
      loserShots: g.loserShots,
      iWon: g.winnerUserId && g.winnerUserId.toString() === userId
    }));

    return res.json({ games: list });
  } catch (err) {
    console.error("Error in GET /api/games/history:", err);
    return res.status(500).json({ message: "Failed to fetch game history" });
  }
});

/**
 * GET /api/games/stats
 * Estadísticas del usuario logueado.
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const games = await GameResult.find({
      $or: [
        { winnerUserId: userId },
        { loserUserId: userId }
      ]
    }).lean();

    const totalGames = games.length;
    let totalWins = 0;
    let totalLosses = 0;
    let totalShots = 0;
    let bestGame = null;

    for (const g of games) {
      const won = g.winnerUserId && g.winnerUserId.toString() === userId;
      if (won) {
        totalWins += 1;
        totalShots += g.winnerShots;
        if (bestGame === null || g.winnerShots < bestGame) {
          bestGame = g.winnerShots;
        }
      } else {
        totalLosses += 1;
        totalShots += g.loserShots;
      }
    }

    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 1000) / 10 : 0;
    const averageShotsPerGame = totalGames > 0 ? Math.round((totalShots / totalGames) * 10) / 10 : 0;

    return res.json({
      totalGames,
      totalWins,
      totalLosses,
      winRate,
      averageShotsPerGame,
      bestGame
    });
  } catch (err) {
    console.error("Error in GET /api/games/stats:", err);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

/**
 * GET /api/games/leaderboard
 * Top 20 jugadores por win rate y luego por victorias.
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const winsAgg = await GameResult.aggregate([
      { $match: { winnerUserId: { $ne: null } } },
      { $group: { _id: "$winnerUserId", wins: { $sum: 1 } } }
    ]);
    const lossesAgg = await GameResult.aggregate([
      { $match: { loserUserId: { $ne: null } } },
      { $group: { _id: "$loserUserId", losses: { $sum: 1 } } }
    ]);

    const byId = new Map();
    for (const row of winsAgg) {
      byId.set(row._id.toString(), { wins: row.wins, losses: 0 });
    }
    for (const row of lossesAgg) {
      const id = row._id.toString();
      if (!byId.has(id)) byId.set(id, { wins: 0, losses: 0 });
      byId.get(id).losses += row.losses;
    }

    const userIds = [...byId.keys()];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const usernameById = new Map();
    for (const u of users) {
      usernameById.set(u._id.toString(), u.username);
    }

    const players = [];
    for (const [id, data] of byId) {
      const total = data.wins + data.losses;
      if (total === 0) continue;
      const winRate = Math.round((data.wins / total) * 1000) / 10;
      players.push({
        username: usernameById.get(id) || "Unknown",
        wins: data.wins,
        losses: data.losses,
        winRate
      });
    }

    players.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    });

    return res.json({
      players: players.slice(0, 20)
    });
  } catch (err) {
    console.error("Error in GET /api/games/leaderboard:", err);
    return res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

export { router as gamesRouter };
