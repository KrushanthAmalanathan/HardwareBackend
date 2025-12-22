import jwt from "jsonwebtoken";
import { JWT_SECRET,JWT_REFRESH_SECRET } from "../config.js";
import { v4 as uuidv4 } from "uuid";
import { User } from "../models/userModel.js";

// 15 min access tokens
export const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m", jwtid: uuidv4() }
  );
};

// 7 day refresh tokens
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { sub: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d", jwtid: uuidv4() }
  );
};

// ----- Simple revocation store (in-memory) -----
// Replace with Redis/db in production and add TTL ≈ refresh token TTL
const revokedRefreshJtis = new Set();
export const revokeRefreshJti = (jti) => {
  if (jti) revokedRefreshJtis.add(jti);
};

// ----- Verify refresh token and rotate -----
export const rotateRefresh = async (token) => {
  const payload = jwt.verify(token, JWT_REFRESH_SECRET); // throws if invalid/expired

  if (revokedRefreshJtis.has(payload.jti)) {
    const err = new Error("Refresh token revoked");
    err.status = 403;
    throw err;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    const err = new Error("User not found");
    err.status = 401;
    throw err;
  }

  // rotate
  revokeRefreshJti(payload.jti);
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};
