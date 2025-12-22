import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive, // optional soft delete
} from "../controllers/productController.js";

import { protect, adminOrSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getProducts);
// Individual product view
router.get("/:id", getProductById);

router.post("/", protect, adminOrSuperAdmin, createProduct);
router.put("/:id", protect, adminOrSuperAdmin, updateProduct);

// Soft delete / activate (recommended)
router.patch("/:id/toggle", protect, adminOrSuperAdmin, toggleProductActive);

// Hard delete (optional – use carefully)
router.delete("/:id", protect, adminOrSuperAdmin, deleteProduct);

export default router;
