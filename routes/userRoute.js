import express from "express";
import {registerUser,loginUser,getUserProfile,uploadProfilePicture,updateUser,updateUserRole,getUsers,deleteUser} from "../controllers/userController.js";
import { protect,superAdminOnly, adminOrSuperAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../helper/cloudinarySetUp.js";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Routes
router.get("/",protect,adminOrSuperAdmin, getUsers); 
router.put('/:id/role',protect,adminOrSuperAdmin, updateUserRole);
router.get("/profile", protect, getUserProfile);
router.put("/update", protect, updateUser);
router.delete("/:id",protect,superAdminOnly, deleteUser);

// Upload Profile Picture Route
router.post("/upload-profile", protect, upload.single("profilePicture"), uploadProfilePicture);

export default router;
