// controllers/wishlistController.js
import mongoose from "mongoose";
import { WishlistItem } from "../models/wishlistModel.js";
import { Product } from "../models/productModel.js";

/**
 * GET /api/wishlist
 * Get logged-in user's wishlist
 */
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await WishlistItem.find({ user: userId })
      .populate({
        path: "product",
        match: { isActive: true },
      })
      .lean();

    // Remove null products (inactive/deleted)
    const cleanItems = items.filter(i => i.product);

    res.json(cleanItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wishlist" });
  }
};

/**
 * POST /api/wishlist
 * Body: { productId }
 */
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    // Ensure product exists & active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const item = await WishlistItem.create({
      user: userId,
      product: productId,
    });

    res.status(201).json(item);
  } catch (err) {
    // Duplicate (already in wishlist)
    if (err.code === 11000) {
      return res.status(409).json({ message: "Product already in wishlist" });
    }
    res.status(500).json({ message: "Error adding to wishlist" });
  }
};

/**
 * DELETE /api/wishlist/:productId
 * Remove one product from wishlist
 */
export const removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const removed = await WishlistItem.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!removed) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    res.json({ message: "Removed from wishlist", productId });
  } catch (err) {
    res.status(500).json({ message: "Error removing wishlist item" });
  }
};

/**
 * DELETE /api/wishlist
 * Clear entire wishlist
 */
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    await WishlistItem.deleteMany({ user: userId });

    res.json({ message: "Wishlist cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing wishlist" });
  }
};
