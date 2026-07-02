import express from "express";
import { addCategory, getAllCategories } from "../controllers/categoryController";
import { verifyToken } from "../middlewares/verifyToken";
import { verifyAdmin } from "../middlewares/verifyAdmin";

const router = express.Router();

// Admin can add category
router.post("/add-category", verifyToken, verifyAdmin, addCategory);

// Anyone can get categories for dropdown
router.get("/get-categories", getAllCategories);

export default router;
