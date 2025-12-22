// routes/meRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { User } from "../models/userModel.js";

const router = express.Router();

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-hashed_password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

export default router;
