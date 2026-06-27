import { Response } from "express";
import { AuthRequest, AuthUser } from "../middlewares/tokenvaryfie";
import { Review } from "../models/Review";
import Product from "../models/Product";

export const getProductReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map((review) => ({
      id: review._id?.toString(),
      user: review.userName || "Anonymous",
      rating: review.rating,
      date: review.createdAt
        ? new Date(review.createdAt).toLocaleDateString("bn-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "",
      comment: review.comment,
      helpful: 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedReviews.length,
      data: formattedReviews,
    });
  } catch (error: any) {
    console.error("Get Product Reviews Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch reviews",
      error: error.message,
    });
  }
};

export const createReview = async (req: AuthRequest, res: Response) => {
  console.log("=========================================");
  console.log(`🚀 API Called: POST /api/v1/review/create`);
  console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
  console.log(`👤 User Info:`, req.user);
  console.log("=========================================");

  try {
    const { rating, comment, productId } = req.body;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access." });
    }

    const { role, id } = req.user as AuthUser;

    if (role !== "user") {
      return res.status(403).json({
        success: false,
        message: `An ${role} is not allowed to add a review.`,
      });
    }

    if (!productId || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const normalizedRating = Number(rating);
    if (
      !Number.isFinite(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Comment must be at least 10 characters long.",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const existingReview = await Review.findOne({ userId: id, productId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const newReview = await Review.create({
      ...req.body,
      rating: normalizedRating,
      comment: trimmedComment,
    });

    const currentReviewCount = product.numReviews || 0;
    const currentAverageRating = product.rating || 0;
    const updatedAverageRating =
      currentReviewCount === 0
        ? normalizedRating
        : (currentAverageRating * currentReviewCount + normalizedRating) /
          (currentReviewCount + 1);

    product.rating = Number(updatedAverageRating.toFixed(1));
    product.numReviews = currentReviewCount + 1;
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
