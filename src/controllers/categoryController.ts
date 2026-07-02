import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";
import { AppError, catchAsync } from "../middlewares/errorMiddleware";

// @desc    Add Category
export const addCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, image } = req.body;
  if (!name) return next(new AppError("Category name is required", 400));

  const existingCategory = await Category.findOne({ name: name.trim() });
  if (existingCategory) return next(new AppError("This category already exists", 400));

  const category = new Category({ name: name.trim(), image, status: "active" });
  await category.save();

  res.status(201).json({ success: true, message: "Category created", data: category });
});

// @desc    Get All Categories (Universal Fetch)
export const getAllCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const skip = (page - 1) * limit;

  // ফিক্স: যদি কোনো ক্যাটাগরিতে স্ট্যাটাস মিসিং থাকে তবে তা ঠিক করা
  await Category.updateMany({ status: { $exists: false } }, { $set: { status: "active" } });

  // সব ক্যাটাগরি নিয়ে আসা (নিশ্চিত করা যে ডাটা আছে কি না)
  const categories = await Category.find({})
    .select("name slug _id status")
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Category.countDocuments({});

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});
