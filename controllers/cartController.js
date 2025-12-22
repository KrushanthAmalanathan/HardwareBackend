// controllers/cartController.js
import mongoose from "mongoose";
import { CartItem } from "../models/cartItemModel.js";
import { Product } from "../models/productModel.js";

/**
 * Helper: build cart summary for header
 */
async function buildCartSummary(userId) {
  const items = await CartItem.find({ user: userId })
    .populate({ path: "product", match: { isActive: true } })
    .lean();

  // Remove null products (inactive/deleted)
  const clean = items.filter(i => i.product);

  const count = clean.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const total = clean.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.product.price) || 0),
    0
  );

  return { items: clean, count, total };
}

/**
 * GET /api/cart
 * Returns items + {count, total}
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const summary = await buildCartSummary(userId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart" });
  }
};

/**
 * POST /api/cart
 * Body: { productId, quantity }
 * Adds or increments existing
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const qty = Math.max(parseInt(quantity, 10) || 1, 1);

    // Ensure product exists & active
    const product = await Product.findOne({ _id: productId, isActive: true }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Upsert: if exists -> increment, else -> create
    const item = await CartItem.findOne({ user: userId, product: productId });

    if (item) {
      item.quantity = Math.max((item.quantity || 0) + qty, 1);
      await item.save();
    } else {
      await CartItem.create({ user: userId, product: productId, quantity: qty });
    }

    const summary = await buildCartSummary(userId);
    res.status(201).json(summary);
  } catch (err) {
    if (err?.code === 11000) {
      // Rare race condition; return current cart
      const summary = await buildCartSummary(req.user.id);
      return res.status(409).json({ message: "Cart item already exists", ...summary });
    }
    res.status(500).json({ message: "Error adding to cart" });
  }
};

/**
 * PATCH /api/cart/:id
 * Body: { quantity }
 * Updates qty for a cart item by cartItem _id
 */
export const updateCartQty = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      return res.status(400).json({ message: "quantity must be >= 1" });
    }

    const item = await CartItem.findOne({ _id: id, user: userId });
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    item.quantity = qty;
    await item.save();

    const summary = await buildCartSummary(userId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Error updating cart quantity" });
  }
};

/**
 * DELETE /api/cart/:id
 * Removes a cart item by cartItem _id
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }

    const removed = await CartItem.findOneAndDelete({ _id: id, user: userId });
    if (!removed) return res.status(404).json({ message: "Cart item not found" });

    const summary = await buildCartSummary(userId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Error removing cart item" });
  }
};

/**
 * DELETE /api/cart
 * Clears user's cart
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await CartItem.deleteMany({ user: userId });
    res.json({ message: "Cart cleared", items: [], count: 0, total: 0 });
  } catch (err) {
    res.status(500).json({ message: "Error clearing cart" });
  }
};
