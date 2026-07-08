import express from "express";
import { upsertShippingConfig, getAllShippingConfigs, getShippingConfigByDivision } from "../controllers/shippingController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyAdmin } from "../middlewares/verifyAdmin";

const router = express.Router();

// Public route to get shipping configs during checkout
router.get("/config", getAllShippingConfigs);
router.get("/config/:division", getShippingConfigByDivision);

// Protected routes - only Admin can manage shipping rates
router.post("/config", verifyToken, verifyAdmin, upsertShippingConfig);

export default router;
