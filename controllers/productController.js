// controllers/productController.js
import { Product } from "../models/productModel.js";

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
export const createProduct = async (req, res) => {
  try {
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
      image,
      description,
      stock,
      isActive,
    } = req.body;

    // Basic validation
    if (!name || !category || !type) {
      return res.status(400).json({ message: "name, category, type are required" });
    }
    if (price === undefined || price === null || Number.isNaN(Number(price))) {
      return res.status(400).json({ message: "price is required and must be a number" });
    }

    // Optional uniqueness check for sku (since it's sparse + unique)
    if (sku) {
      const exists = await Product.findOne({ sku });
      if (exists) return res.status(409).json({ message: "SKU already exists" });
    }

    const doc = await Product.create({
      name: String(name).trim(),
      category: String(category).trim(),
      type: String(type).trim(),
      brand: brand ? String(brand).trim() : undefined,
      sku: sku ? String(sku).trim() : undefined,

      price: Number(price),
      oldPrice: oldPrice !== undefined && oldPrice !== null ? Number(oldPrice) : undefined,
      rating: rating !== undefined && rating !== null ? Number(rating) : undefined,
      badge,
      image,

      description,
      stock: stock !== undefined && stock !== null ? Number(stock) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json(doc);
  } catch (e) {
    // Handle Mongo duplicate key error
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Duplicate key (likely sku)" });
    }
    res.status(500).json({ message: "Error creating product" });
  }
};

/**
 * PUT /api/products/:id
 * Full update (replace fields provided, keep others)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const payload = {};
    const setIfDefined = (key, val) => {
      if (val !== undefined) payload[key] = val;
    };

    // Strings
    if (req.body.name !== undefined) setIfDefined("name", String(req.body.name).trim());
    if (req.body.category !== undefined) setIfDefined("category", String(req.body.category).trim());
    if (req.body.type !== undefined) setIfDefined("type", String(req.body.type).trim());
    if (req.body.brand !== undefined)
      setIfDefined("brand", req.body.brand ? String(req.body.brand).trim() : "");
    if (req.body.sku !== undefined)
      setIfDefined("sku", req.body.sku ? String(req.body.sku).trim() : undefined);

    // Numbers
    if (req.body.price !== undefined) setIfDefined("price", Number(req.body.price));
    if (req.body.oldPrice !== undefined)
      setIfDefined("oldPrice", req.body.oldPrice === null ? undefined : Number(req.body.oldPrice));
    if (req.body.rating !== undefined)
      setIfDefined("rating", req.body.rating === null ? 0 : Number(req.body.rating));
    if (req.body.stock !== undefined)
      setIfDefined("stock", req.body.stock === null ? 0 : Number(req.body.stock));

    // Others
    if (req.body.badge !== undefined) setIfDefined("badge", req.body.badge);
    if (req.body.image !== undefined) setIfDefined("image", req.body.image);
    if (req.body.description !== undefined) setIfDefined("description", req.body.description);
    if (req.body.isActive !== undefined) setIfDefined("isActive", Boolean(req.body.isActive));

    // If client tries to set sku, check uniqueness (optional but friendly)
    if (payload.sku) {
      const clash = await Product.findOne({ sku: payload.sku, _id: { $ne: id } }).lean();
      if (clash) return res.status(409).json({ message: "SKU already exists" });
    }

    const updated = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: "Duplicate key (likely sku)" });
    }
    res.status(500).json({ message: "Error updating product" });
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
