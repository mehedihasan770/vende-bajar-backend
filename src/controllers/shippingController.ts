import { Request, Response, NextFunction } from "express";
import ShippingConfig from "../models/ShippingConfig";
import { AppError, catchAsync } from "../middlewares/errorMiddleware";

// @desc    Update or create shipping configuration
// @route   POST /api/shipping/config
// @access  Admin
export const upsertShippingConfig = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  const { division, configs } = req.body;
  const adminId = req.user.id;

  if (!division || !configs || !Array.isArray(configs)) {
    return next(new AppError("Invalid shipping configuration data.", 400));
  }

  const shippingConfig = await ShippingConfig.findOneAndUpdate(
    { division },
    { division, configs, updatedBy: adminId },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `Shipping configuration for ${division} updated successfully.`,
    data: shippingConfig
  });
});

// @desc    Get all shipping configurations
// @route   GET /api/shipping/config
// @access  Public (to show on checkout)
export const getAllShippingConfigs = catchAsync(async (req: Request, res: Response) => {
  const configs = await ShippingConfig.find().populate("updatedBy", "fullName email");

  res.status(200).json({
    success: true,
    data: configs
  });
});

// @desc    Get shipping config for a specific division
// @route   GET /api/shipping/config/:division
export const getShippingConfigByDivision = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { division } = req.params;

  const config = await ShippingConfig.findOne({ division });
  if (!config) {
    return next(new AppError("Shipping configuration not found for this division.", 404));
  }

  res.status(200).json({
    success: true,
    data: config
  });
});
