import { Request, Response, NextFunction } from "express";
import Product from "../models/Product";
import Category from "../models/Category";
import { AppError, catchAsync } from "../middlewares/errorMiddleware";

const CARD_SELECT = "name thumbnail rating numReviews brand slug shortDescription category pricing.basePrice pricing.salePrice pricing.saleType pricing.saleStartDate pricing.saleEndDate pricing.regularPrice";

// @desc    Create a new product
export const createProduct = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  const { id, email } = req.user;

  // 1. Check if Category exists
  if (req.body.category) {
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) return next(new AppError("The selected category is invalid or does not exist.", 400));
  }

  // 2. Prevent duplicate SKUs in Variants array
  if (req.body.variants && req.body.variants.length > 0) {
    const skus = req.body.variants.map((v: any) => v.sku).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      return next(new AppError("Each product variant must have a unique SKU.", 400));
    }
  }

  // 3. Destructure and force system fields
  const product = new Product({
    ...req.body,
    vendor: id,
    vendorEmail: email,
    createdBy: id,
    status: "pending",
    isDeleted: false // Prevent bypass soft delete on create
  });

  await product.save();

  res.status(201).json({
    success: true,
    message: "Product submitted successfully for approval! ✅",
    data: product
  });
});

// @desc    Get all products (Paginated & Protected)
export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  let { page = 1, limit = 12, search, category, brand, minPrice, maxPrice, sort } = req.query;

  // Security Fix: Hard cap on limit and page to prevent abuse
  const finalLimit = Math.min(Math.max(1, Number(limit) || 12), 50);
  const finalPage = Math.max(1, Number(page) || 1);

  const query: any = { isDeleted: false, status: "active" };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search as string, "i")] } }
    ];
  }

  if (category) query.category = category;
  if (brand) query.brand = brand;

  if (minPrice || maxPrice) {
    query["pricing.basePrice"] = {};
    if (minPrice) query["pricing.basePrice"].$gte = Number(minPrice);
    if (maxPrice) query["pricing.basePrice"].$lte = Number(maxPrice);
  }

  let sortBy: any = { createdAt: -1 };
  if (sort === "price_low") sortBy = { "pricing.basePrice": 1 };
  if (sort === "price_high") sortBy = { "pricing.basePrice": -1 };
  if (sort === "rating") sortBy = { rating: -1 };

  const skip = (finalPage - 1) * finalLimit;
  const products = await Product.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(finalLimit)
    .select(CARD_SELECT)
    .populate("category", "name slug");

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit)
    },
    data: products,
  });
});

export const getFeaturedProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await Product.find({
    isFeatured: true,
    status: "active",
    isDeleted: false,
  })
    .select(CARD_SELECT)
    .populate("category", "name slug")
    .limit(10);

  res.status(200).json({ success: true, count: products.length, data: products });
});

export const getFlashSaleProducts = catchAsync(async (req: Request, res: Response) => {
  const now = new Date();
  const products = await Product.find({
    "pricing.saleType": "flash",
    "pricing.saleStartDate": { $lte: now },
    "pricing.saleEndDate": { $gte: now },
    status: "active",
    isDeleted: false,
  })
  .select(CARD_SELECT)
  .populate("category", "name slug")
  .sort({ "pricing.salePrice": 1 });

  res.status(200).json({ success: true, count: products.length, data: products });
});

export const getRelatedProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const product = await Product.findById(id).select("category");
  if (!product) return next(new AppError("Product not found!", 404));

  const products = await Product.find({
    category: product.category,
    _id: { $ne: id },
    status: "active",
    isDeleted: false,
  })
    .select(CARD_SELECT)
    .populate("category", "name slug")
    .limit(10);

  res.status(200).json({ success: true, count: products.length, data: products });
});

export const getProductById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
    .populate("vendor", "fullName profileImage email")
    .populate("category", "name slug");

  if (!product) return next(new AppError("Product not found!", 404));

  res.status(200).json({ success: true, data: product });
});

export const getProductBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findOne({ slug: req.params.slug, isDeleted: false })
    .populate("vendor", "fullName profileImage email")
    .populate("category", "name slug");

  if (!product) return next(new AppError("Product not found!", 404));

  res.status(200).json({ success: true, data: product });
});
