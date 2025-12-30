// controllers/productController.js
import { Product } from "../models/productModel.js";
import { productImageUpload } from "../helper/productCloudinarySetUp.js";

/**
 * GET /api/products
 * Query params: search, type, category, sort, page, limit, active
 */
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      type,
      category,
      sort = "price-high",
      page = 1,
      limit = 50,
      active = "true", // "true" | "false" | "all"
    } = req.query;

    const filter = {};

    // Active filter
    if (active === "true") filter.isActive = true;
    else if (active === "false") filter.isActive = false;

    // Type/category filters
    if (type && type !== "all") filter.type = type;
    if (category && category !== "all") filter.category = category;

    // Search
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: regex },
        { category: regex },
        { type: regex },
        { brand: regex },
        { sku: regex },
      ];
    }

    let query = Product.find(filter);

    // Sort
    if (sort === "price-low") query = query.sort({ price: 1 });
    else if (sort === "price-high") query = query.sort({ price: -1 });
    else if (sort === "rating-high") query = query.sort({ rating: -1 });
    else if (sort === "newest") query = query.sort({ createdAt: -1 });
    else if (sort === "oldest") query = query.sort({ createdAt: 1 });

    // Pagination
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (e) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

/**
 * GET /api/products/:id
 * Individual view
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (e) {
    res.status(500).json({ message: "Error fetching product" });
  }
};

/**
 * POST /api/products
 * Create
 */
// @desc    Create a product (supports image upload)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    // When using multipart/form-data, all fields arrive as strings
    const {
      name,
      category,
      type,
      brand,
      sku,
      price,
      oldPrice,
      rating,
      badge,
      description,
      stock,
      isActive,
      image, // optional URL (fallback)
    } = req.body;

    // ✅ Upload file to Cloudinary if provided
    let imageUrl = image || "";
    if (req.file?.buffer) {
      const uploaded = await productImageUpload(req.file.buffer);
      imageUrl = uploaded?.secure_url || imageUrl;
    }

    const product = await Product.create({
      name: (name || "").trim(),
      category: (category || "").trim(),
      type: (type || "").trim(),
      brand: brand ? brand.trim() : undefined,
      sku: sku ? sku.trim() : undefined,
      price: price !== undefined ? Number(price) : 0,
      oldPrice: oldPrice !== undefined && oldPrice !== "" ? Number(oldPrice) : undefined,
      rating: rating !== undefined && rating !== "" ? Number(rating) : 0,
      badge: badge ? badge.trim() : undefined,
      image: imageUrl,
      description: description ? description.trim() : "",
      stock: stock !== undefined && stock !== "" ? Number(stock) : 0,
      isActive: isActive === "false" ? false : Boolean(isActive ?? true),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Invalid product data",
    });
  }
};

// @desc    Update a product (supports image upload)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name,
      category,
      type,
      brand,
      sku,
      price,
      oldPrice,
      rating,
      badge,
      description,
      stock,
      isActive,
      image, // optional URL (fallback)
    } = req.body;

    // ✅ Upload new image if provided
    let imageUrl = product.image;
    if (image && image.trim()) imageUrl = image.trim();
    if (req.file?.buffer) {
      const uploaded = await productImageUpload(req.file.buffer);
      imageUrl = uploaded?.secure_url || imageUrl;
    }

    product.name = name !== undefined ? name.trim() : product.name;
    product.category = category !== undefined ? category.trim() : product.category;
    product.type = type !== undefined ? type.trim() : product.type;
    product.brand = brand !== undefined ? (brand ? brand.trim() : "") : product.brand;
    product.sku = sku !== undefined ? (sku ? sku.trim() : "") : product.sku;

    if (price !== undefined && price !== "") product.price = Number(price);
    if (oldPrice !== undefined) {
      product.oldPrice = oldPrice === "" ? undefined : Number(oldPrice);
    }
    if (rating !== undefined && rating !== "") product.rating = Number(rating);
    if (badge !== undefined) product.badge = badge ? badge.trim() : "";
    if (description !== undefined) product.description = description ? description.trim() : "";
    if (stock !== undefined && stock !== "") product.stock = Number(stock);

    if (isActive !== undefined) {
      product.isActive = isActive === "false" ? false : Boolean(isActive);
    }

    product.image = imageUrl;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to update product",
    });
  }
};

/**
 * PATCH /api/products/:id
 * Partial update (same as updateProduct, but semantically PATCH)
 */
export const patchProduct = async (req, res) => {
  return updateProduct(req, res);
};

/**
 * DELETE /api/products/:id
 * Hard delete
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product deleted", id });
  } catch (e) {
    res.status(500).json({ message: "Error deleting product" });
  }
};

/**
 * PATCH /api/products/:id/toggle
 * Soft delete / restore via isActive
 */
export const toggleProductActive = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isActive = !product.isActive;
    await product.save();

    res.json(product);
  } catch (e) {
    res.status(500).json({ message: "Error toggling product active" });
  }
};
