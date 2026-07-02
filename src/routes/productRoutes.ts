import express from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyVendor } from "../middlewares/verifyVendor";
import {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  getFlashSaleProducts,
  getRelatedProducts,
  getProductById,
  getProductBySlug,
} from "../controllers/productController";

const router = express.Router();

// Public Routes
router.get("/", getAllProducts); // Get all products with filters, search, pagination
router.get("/featured", getFeaturedProducts);
router.get("/flash-sale", getFlashSaleProducts);
router.get("/related/:id", getRelatedProducts);
router.get("/s/:slug", getProductBySlug); // SEO Friendly route
router.get("/:id", getProductById); // Get by ID

// Protected Routes (Vendor/Admin Only)
router.post("/add", verifyToken, verifyVendor, createProduct);

export default router;
