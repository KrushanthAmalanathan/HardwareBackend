// routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addToCart,
  updateCartQty,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getCart);          // {items, count, total}
router.post("/", addToCart);       // {productId, quantity}
router.patch("/:id", updateCartQty);
router.delete("/:id", removeCartItem);
router.delete("/", clearCart);

export default router;