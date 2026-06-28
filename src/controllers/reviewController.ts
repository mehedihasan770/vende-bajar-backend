import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/verifyToken";
import { Review } from "../models/Review";
import Product from "../models/Product";
import User from "../models/User";

/**
 * @desc    Get all reviews for a specific product
 * @route   GET /api/v1/reviews/product/:productId
 */
export const getProductReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Valid Product ID is required." });
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

    // Format data for frontend
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Create a new review (Secure & Production Ready)
 * @route   POST /api/v1/reviews/add
 */
export const createReview = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rating, comment, productId } = req.body;
    const userId = req.user?.id;

    // 1. Basic Validation
    if (!productId || !rating || !comment) {
      return res.status(400).json({ success: false, message: "Please provide product ID, rating, and comment." });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID." });
    }

    // 2. Fetch User Data from DB (Prevent Data Spoofing)
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 3. Rating & Comment Validation
    const normalizedRating = Number(rating);
    if (normalizedRating < 1 || normalizedRating > 5) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    if (comment.trim().length < 10) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Comment must be at least 10 characters." });
    }

    // 4. Check if Product Exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    /*
    // ========================================================================
    // 4.5. Verified Purchase Check (Uncomment this after implementing Order module)
    // ========================================================================
    // import Order from "../models/Order"; // Need to import this at the top

    const hasOrdered = await Order.findOne({
      userId,
      "items.productId": productId,
      status: 'delivered'
    }).session(session);

    if (!hasOrdered) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received."
      });
    }
    // ========================================================================
    */

    // 5. Prevent Multiple Reviews from Same User on Same Product
    const existingReview = await Review.findOne({ userId, productId }).session(session);
    if (existingReview) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "You have already reviewed this product." });
    }

    // 6. Create Review with Secure Data
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

    // 7. Update Product Rating & numReviews Atomically
    await Product.findByIdAndUpdate(
      productId,
      [
        {
          $set: {
            numReviews: { $add: ["$numReviews", 1] },
            rating: {
              $round: [
                {
                  $divide: [
                    { $add: [{ $multiply: ["$rating", "$numReviews"] }, normalizedRating] },
                    { $add: ["$numReviews", 1] },
                  ],
                },
                1,
              ],
            },
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Review added successfully! ✅", data: newReview });

  } catch (error: any) {
    await session.abortTransaction();
    console.error("Create Review Error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ============================================================================
 * TODO: FUTURE APIS TO BE IMPLEMENTED FOR REVIEWS
 * ============================================================================
 *
 * 1. updateReview (PATCH) - Allow user to edit their rating/comment.
 * 2. deleteReview (DELETE) - Allow user or Admin to remove a review.
 * 3. getMyReviews (GET) - Fetch all reviews given by the logged-in user.
 * 4. toggleHelpful (PATCH) - Allow other users to mark a review as helpful.
 * 5. replyToReview (POST) - Allow Vendors/Admins to reply to a review.
 *
 * ============================================================================
 */
