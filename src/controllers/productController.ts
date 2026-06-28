import { Request, Response } from "express";
import Product from "../models/Product";

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products/add
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { id, email } = (req as any).user;
    const {
      name, description, shortDescription, category, subCategory,
      brand, basePrice, salePrice, saleType, regularPrice,
      saleStartDate, saleEndDate, costPrice, sku, hasVariants,
      variants, thumbnail, images, videoUrl, specifications,
      isFeatured, isFlashSale, inventory, shipping, metaTitle, metaDescription
    } = req.body;

    // 1. Basic Validation
    if (!name || !description || !category || !brand || !basePrice || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Name, Description, Category, Brand, Base Price, Thumbnail",
      });
    }

    // 2. Business Logic Validation
    if (saleType === "flash") {
      if (!isFlashSale || !salePrice || !saleStartDate || !saleEndDate) {
        return res.status(400).json({
          success: false,
          message: "Flash sale requires salePrice, saleStartDate and saleEndDate.",
        });
      }
      const discount = ((basePrice - salePrice) / basePrice) * 100;
      if (discount > 35) {
        return res.status(400).json({
          success: false,
          message: "Flash sale discount cannot exceed 35%.",
        });
      }
    }

    // 3. Prepare Data
    const productData = {
      vendor: id,
      vendorEmail: email,
      createdBy: id,
      name, description, shortDescription, category, subCategory,
      brand, basePrice, salePrice, saleType, regularPrice,
      saleStartDate, saleEndDate, costPrice, sku, hasVariants,
      variants, thumbnail, images, videoUrl, specifications,
      isFeatured, isFlashSale,
      inventory: {
        stock: Number(inventory?.stock || 0),
        lowStockThreshold: Number(inventory?.lowStockThreshold || 10),
        allowBackorder: Boolean(inventory?.allowBackorder),
      },
      shipping, metaTitle, metaDescription,
      status: "pending" // Admin approval needed
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product submitted successfully! Pending admin approval. 🚀",
      data: savedProduct,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? "Duplicate SKU or Slug" : "Server Error",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all products with Search, Filter & Pagination
 * @route   GET /api/v1/products
 */
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const query: any = { isDeleted: false, status: "active" };

    // Search by name or tags
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } }
      ];
    }

    // Filter by Category & Brand
    if (category) query.category = category;
    if (brand) query.brand = brand;

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    // Sorting Logic
    let sortBy: any = { createdAt: -1 };
    if (sort === "price_low") sortBy = { basePrice: 1 };
    if (sort === "price_high") sortBy = { basePrice: -1 };
    if (sort === "rating") sortBy = { rating: -1 };
    if (sort === "oldest") sortBy = { createdAt: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .select("name basePrice salePrice thumbnail rating category brand slug inventory.isOutOfStock");

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
  }
};

/**
 * @desc    Get Featured Products
 */
export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      isFeatured: true,
      status: "active",
      isDeleted: false,
    })
      .select("name basePrice salePrice thumbnail rating numReviews category slug")
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to fetch featured products", error: error.message });
  }
};

/**
 * @desc    Get Flash Sale Products
 */
export const getFlashSaleProducts = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const products = await Product.find({
      isFlashSale: true,
      saleType: "flash",
      saleStartDate: { $lte: now },
      saleEndDate: { $gte: now },
      status: "active",
      isDeleted: false,
    })
    .select("name basePrice salePrice thumbnail saleEndDate inventory.stock slug")
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching flash sale", error: error.message });
  }
};

/**
 * @desc    Get Single Product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("vendor", "fullName profileImage email");

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Product not found!" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching product", error: error.message });
  }
};

/**
 * ============================================================================
 * TODO: FUTURE APIS TO BE IMPLEMENTED FOR A PROFESSIONAL E-COMMERCE SYSTEM
 * ============================================================================
 *
 * 1.  updateProduct (PATCH) - Modify price, stock, or details by Vendor/Admin.
 * 2.  deleteProduct (DELETE) - Soft delete product (set isDeleted: true).
 * 3.  getProductBySlug (GET) - Fetch product by URL-friendly slug for SEO.
 * 4.  getRelatedProducts (GET) - Fetch products in the same category/brand.
 * 5.  updateProductStatus (PATCH/ADMIN) - Admin approves or rejects products.
 * 6.  getVendorProducts (GET) - List all products belonging to the logged-in vendor.
 * 7.  bulkUpdateProducts (PATCH) - Update multiple products at once (e.g., price change).
 * 8.  toggleFeaturedStatus (PATCH) - Quickly make a product featured or not.
 * 9.  getInventoryStats (GET) - Summary of low stock and out of stock products.
 * 10. addReview/getReviews (Handled in Review Controller, but linked to Product).
 *
 * ============================================================================
 */
