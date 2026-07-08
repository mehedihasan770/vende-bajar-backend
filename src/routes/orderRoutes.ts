import express from "express";
import { createOrder } from "../controllers/orderController";
import { verifyToken } from "../middlewares/verifyToken";

const router = express.Router();

// All order routes are protected as they require a logged-in user
router.use(verifyToken);

// @desc    Create a new order (Split Order supported)
router.post("/create", createOrder);

export default router;
