import express from "express";
import { verifyToken } from "../middlewares/tokenvaryfie";
import {
  createReview,
  getProductReviews,
} from "../controllers/reviewController";

const router = express.Router();

// Review Route
router.get("/product/:productId", getProductReviews);
router.post("/add", verifyToken, createReview);

export default router;
