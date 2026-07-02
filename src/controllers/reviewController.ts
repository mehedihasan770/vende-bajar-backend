import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/verifyToken";
import { Review } from "../models/Review";
import Product from "../models/Product";
import User from "../models/User";
import { AppError, catchAsync } from "../middlewares/errorMiddleware";

/**
 * @desc    Get all reviews for a specific product
 * @route   GET /api/v1/reviews/product/:productId
 */
export const getProductReviews = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { productId } = req.params;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("Valid Product ID is required.", 400));
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [total, reviews] = await Promise.all([
    Review.countDocuments({ productId }),
    Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const formattedReviews = reviews.map((review) => ({
    id: review._id?.toString(),
    user: review.userName || "Anonymous",
    userImage: review.userProfileImage,
    rating: review.rating,
    date: review.createdAt,
    comment: review.comment,
  }));

  return res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    data: formattedReviews,
  });
});

/**
 * @desc    Create a new review (Secure & Production Ready)
 * @route   POST /api/v1/reviews/add
 */
export const createReview = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { rating, comment, productId } = req.body;
  const userId = req.user?.id;

  if (!productId || !rating || !comment) {
    return next(new AppError("Please provide product ID, rating, and comment.", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return next(new AppError("Invalid product ID.", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const normalizedRating = Number(rating);
    if (normalizedRating < 1 || normalizedRating > 5) {
      throw new AppError("Rating must be between 1 and 5.", 400);
    }

    if (comment.trim().length < 10) {
      throw new AppError("Comment must be at least 10 characters.", 400);
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    const existingReview = await Review.findOne({ userId, productId }).session(session);
    if (existingReview) {
      throw new AppError("You have already reviewed this product.", 400);
    }

    const newReview = new Review({
      productId,
      userId,
      userName: user.fullName,
      userEmail: user.email,
      userProfileImage: user.profileImage,
      rating: normalizedRating,
      comment: comment.trim(),
    });

    await newReview.save({ session });

    const actualNumReviews = product.numReviews + 1;
    const actualSum = (product.rating * product.numReviews) + normalizedRating;
    const newRating = Number((actualSum / actualNumReviews).toFixed(1));

    await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          numReviews: actualNumReviews,
          rating: newRating,
        },
      },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Review added successfully! ✅", data: newReview });

  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});