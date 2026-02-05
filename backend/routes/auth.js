import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helper to generate a signed JWT for a user
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword
    });

    // For registration we can return profile without token; login endpoint gives token
    return res.status(201).json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("Error in /api/auth/register:", err);
    return res.status(500).json({ message: "Failed to register user" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error("Error in /api/auth/login:", err);
    return res.status(500).json({ message: "Failed to login" });
  }
});

// GET /api/auth/me (protected)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

export { router as authRouter };

