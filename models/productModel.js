import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },    // e.g. "Roofing Sheets"
    type: { type: String, required: true },        // e.g. "Roofing", "Cement"
    brand: { type: String },                       // e.g. "Rhino"
    sku: { type: String, unique: true, sparse: true },

    price: { type: Number, required: true },
    oldPrice: { type: Number },
    rating: { type: Number, default: 0 },
    badge: { type: String },                       // "SAVE 10%" etc
    image: { type: String },                       // URL/path

    description: { type: String },                 // for ProductInfo modal
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);