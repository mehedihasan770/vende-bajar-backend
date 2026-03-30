import { Request, Response } from 'express';
import Product from '../models/Product';

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {email} = (req as any).user;
    req.body.vendorEmail = email;
    const { 
      name,
      description,
      category,
      brand,
      price,
      stock,
      thumbnail,
      sku,
      vendorEmail
    } = req.body;

    if (!name || !description || !category || !brand || !price || !stock || !thumbnail || !vendorEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields (Name, Description, Category, Brand, Price, Stock, Thumbnail)" 
      });
    }

    if (sku) {
      const isSkuExist = await Product.findOne({ sku });
      if (isSkuExist) {
        return res.status(400).json({ 
          success: false, 
          message: "Product with this SKU already exists!" 
        });
      }
    }

    const product = new Product(req.body);

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully! 🚀",
      data: savedProduct
    });

  } catch (error: any) {
    console.error("Error in Add Product:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not add product",
      error: error.message
    });
  }
};





export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ 
      isFeatured: true, 
      status: 'active' 
    })
    .select('name price oldPrice thumbnail rating numReviews category') 
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
  try {
    const { id } = req.params;
    console.log(id)
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found!' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};