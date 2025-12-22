import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeWishlistItem,
  clearWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeWishlistItem);
router.delete("/", clearWishlist);

export default router;