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

// ✅ uses your existing multer memory upload
import { upload } from "../helper/fileUploadMiddleware.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin protected + image upload
router.post("/", upload.single("image"), createProduct);
router.put("/:id", protect, adminOrSuperAdmin, upload.single("image"), updateProduct);

// Soft delete / activate (recommended)
router.patch("/:id/toggle", protect, adminOrSuperAdmin, toggleProductActive);
// Hard delete (optional – use carefully)
router.delete("/:id", protect, adminOrSuperAdmin, deleteProduct);

export default router;
