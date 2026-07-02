import { Request, Response, NextFunction } from 'express';
import Slider from '../models/Slider';
import { AppError, catchAsync } from '../middlewares/errorMiddleware';

export const updateSlider = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { slideNumber } = req.params;

  const updatedSlide = await Slider.findOneAndUpdate(
    { slideNumber: Number(slideNumber) },
    req.body,
    { returnDocument: 'after', runValidators: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    message: `Slide ${slideNumber} updated successfully!`,
    data: updatedSlide
  });
});

export const getAllSliders = catchAsync(async (req: Request, res: Response) => {
  const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });

  res.status(200).json({
    success: true,
    count: sliders.length,
    data: sliders,
  });
});