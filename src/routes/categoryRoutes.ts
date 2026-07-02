import express from "express";
import { addCategory, getAllCategories } from "../controllers/categoryController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyAdmin } from "../middlewares/verifyAdmin";

const router = express.Router();

/**
 * @description Category Routes
 * POST: /api/v1/categories/add-category (Admin Only)
 * GET:  /api/v1/categories/get-categories (Public)
 */

router.post("/add-category", verifyToken, verifyAdmin, addCategory);
router.get("/get-categories", getAllCategories);

export default router;
