import { Request, Response } from 'express';
import Slider from '../models/Slider';

export const updateSlider = async (req: Request, res: Response) => {
  try {
    const { slideNumber } = req.params;
    const updateData = req.body;
    console.log(updateData)

    const updatedSlide = await Slider.findOneAndUpdate(
      { slideNumber: Number(slideNumber) },
      updateData,
      { returnDocument: 'after', runValidators: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Slide ${slideNumber} updated successfully!`,
      data: updatedSlide
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update slide",
      error: error.message
    });
  }
};



export const getAllSliders = async (req: Request, res: Response) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ slideNumber: 1 });

    res.status(200).json({
      success: true,
      count: sliders.length,
      data: sliders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch slider data",
      error: error.message,
    });
  }
};