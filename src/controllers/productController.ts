import { Request, Response } from 'express';
import Product from '../models/Product';

export const createProduct = async (req: Request, res: Response) => {
  console.log("=========================================");
  console.log(`🚀 API Called: POST /api/v1/products/add`);
  console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
  console.log(`👤 User from Token:`, (req as any).user);
  console.log("=========================================");

  try {
    // verifyToken middleware provides user info in req.user
    const { id, email } = (req as any).user;
    // ... rest of the code

    const {
      name,
      description,
      category,
      brand,
      basePrice,
      stock,
      thumbnail,
      sku
    } = req.body;

    // 1. Basic Validation
    if (!name || !description || !category || !brand || !basePrice || stock === undefined || !thumbnail) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields! (Name, Description, Category, Brand, Base Price, Stock, Thumbnail)"
      });
    }

    // 2. SKU Uniqueness Check (if provided)
    if (sku) {
      const isSkuExist = await Product.findOne({ sku });
      if (isSkuExist) {
        return res.status(400).json({ 
          success: false, 
          message: "Product with this SKU already exists!"
        });
      }
    }

    // 3. Prepare Product Data according to Professional Schema
    const productData = {
      ...req.body,
      vendor: id, // Link to User ID from token
      vendorEmail: email,
      createdBy: id,
      basePrice: Number(basePrice),
      salePrice: req.body.salePrice ? Number(req.body.salePrice) : undefined,
      stock: Number(stock),
      // Use status from body if provided, otherwise default to 'pending'
      status: req.body.status || 'pending'
    };

    const product = new Product(productData);
    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product submitted successfully! It is pending for admin approval. 🚀",
      data: savedProduct
    });

  } catch (error: any) {
    console.error("Error in Add Product:", error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' ? "Validation Error: Please check your input data" : "Server Error: Could not add product",
      error: error.message
    });
  }
};





export const getFeaturedProducts = async (req: Request, res: Response) => {
  console.log("=========================================");
  console.log(`🚀 API Called: GET /api/v1/products/featured`);
  console.log("=========================================");

  try {
    const products = await Product.find({ 
      isFeatured: true, 
      status: 'approved',
      isDeleted: false
    })
    .select('name basePrice salePrice thumbnail rating numReviews category discountPercentage brand shortDescription')
    .sort({ createdAt: -1 })
    .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  console.log("=========================================");
  console.log(`🚀 API Called: GET /api/v1/products/${req.params.id}`);
  console.log(`🆔 Params ID:`, req.params.id);
  console.log("=========================================");

  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('vendor', 'fullName profileImage email')
      .populate('category', 'name');

    if (!product || product.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found!'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not fetch product',
      error: error.message
    });
  }
};
