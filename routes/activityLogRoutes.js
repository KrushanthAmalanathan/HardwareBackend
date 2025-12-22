// backend/routes/activityLogRoutes.js
import express from "express";
import {
  addActivity,
  getActivities,
  getStats,
} from "../controllers/activityLogController.js";
import { protect,superAdminOnly, adminOrSuperAdmin }  from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addActivity);
router.get("/stats", protect,adminOrSuperAdmin, getStats);
router.get("/", protect, getActivities);


export default router;
