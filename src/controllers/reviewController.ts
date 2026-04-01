import { Request, Response } from "express";
import { AuthRequest, AuthUser } from "../middlewares/tokenvaryfie";
import { Review } from "../models/Review";
import Product from "../models/Product";

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment, productId } = req.body;

    console.log(rating)

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const { role, id } = req.user as AuthUser;

    if (role !== "user") {
      return res.status(403).json({
        success: false,
        message: `An ${role} is not allowed to add a review.`,
      });
    }

    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    if (comment.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Comment must be at least 10 characters long." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const existingReview = await Review.findOne({ userId: id, productId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });
    }

    const newReview = await Review.create(req.body);

    product.rating = (product.rating || 0) + Number(rating);
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully! ✅",
      data: newReview,
    });

  } catch (error: any) {
    console.error("Create Review Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not add Review",
      error: error.message,
    });
  }
};