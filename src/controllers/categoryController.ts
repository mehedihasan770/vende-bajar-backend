import { Request, Response } from "express";
import Category from "../models/Category";

// Add Category (Admin only)
export const addCategory = async (req: Request, res: Response) => {
  try {
    const { name, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "Category already exists" });
    }

    const category = await Category.create({ name, image });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: category,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Categories (For Dropdown)
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ status: "active" }).select("name slug");
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
