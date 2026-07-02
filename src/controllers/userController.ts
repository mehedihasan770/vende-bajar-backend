import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/verifyToken';
import User from '../models/User';
import { AppError, catchAsync } from '../middlewares/errorMiddleware';

export const getMe = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?.id).select('-password -__v');

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    return res.status(200).json({
        success: true,
        user: user
    });
});