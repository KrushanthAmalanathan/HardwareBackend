import express from "express";
import { rotateRefresh, revokeRefreshJti } from "../controllers/tokenController.js";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET } from "../config.js";

const router = express.Router();

/**
 * POST /auth/refresh-token
 * - Reads httpOnly cookie 'refreshToken'
 * - Verifies & rotates refresh token
 * - Sets a new refresh cookie
 * - Returns a fresh access token
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const { accessToken, refreshToken } = await rotateRefresh(token);

    // Set rotated refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/auth/tokens/refresh-token",
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    const status = err.status || 401;
    return res.status(status).json({ message: "Invalid or expired refresh token" });
  }
});

/**
 * POST /auth/logout
 * - Revokes current refresh token
 * - Clears cookie
 */
router.post("/logout", (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET);
      revokeRefreshJti(payload.jti);
    } catch {
      // ignore verify errors, still clear cookie
    }
  }

  res.clearCookie("refreshToken", { path: "/auth/tokens/refresh-token" });
  return res.status(200).json({ message: "Logged out" });
});

export default router;
