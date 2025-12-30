import jwt from "jsonwebtoken";
import {User} from "../models/userModel.js";

/**
 * protect: verifies Bearer token and attaches req.user
 * verifyToken: alias of protect (for older route files)
 */
export const protect = async (req, res, next) => {
  let token;

  // Accept: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // fetch user and omit password
    req.user = await User.findById(decoded.id).select("-hashed_password -password");

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Alias exports for compatibility
export const verifyToken = protect;

/**
 * optionalAuth: if token exists, attach req.user; if not, continue as guest.
 */
export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-hashed_password -password");
  } catch (e) {
    // ignore invalid token for optional auth
  }
  next();
};

/**
 * Admin check:
 * supports role values: "Admin", "SuperAdmin", "admin", "superadmin"
 */
export const adminOrSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "admin" || role === "superadmin") return next();
  return res.status(403).json({ message: "Not authorized as admin" });
};

// Alias exports for compatibility
export const isAdmin = adminOrSuperAdmin;

export const superAdminOnly = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase();
  if (role === "superadmin") return next();
  return res.status(403).json({ message: "Not authorized as super admin" });
};
