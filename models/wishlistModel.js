import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true });

export const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);
