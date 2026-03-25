import { Response } from 'express';
import { AuthRequest } from '../middlewares/tokenvaryfie';
import User from '../models/User';

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        // ১. টোকেন থেকে পাওয়া আইডি দিয়ে ডাটাবেসে খোঁজা
        const user = await User.findById(req.user?.id).select('-password -__v');

        // ২. ইউজার না পাওয়া গেলে এরর মেসেজ
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // ৩. সফল হলে ইউজার ডাটা পাঠানো
        return res.status(200).json({
            success: true,
            user: user
        });

    } catch (error: any) {
        // ৪. সার্ভার বা ডাটাবেস এরর হলে
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error",
            error: error.message 
        });
    }
};