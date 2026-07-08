import express from "express";
import { testBkashToken } from "../controllers/bkashController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyAdmin } from "../middlewares/verifyAdmin";

const router = express.Router();

// Create payment - Protected (Any logged in user can initiate payment)
router.post("/create-payment", verifyToken, createPayment);

// Callback - Public (Called by bKash server)
router.get("/callback", bkashCallback);

// Only admin can test token generation directly
router.get("/test-token", verifyToken, verifyAdmin, testBkashToken);

export default router;
