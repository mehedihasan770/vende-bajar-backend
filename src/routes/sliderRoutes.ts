import express from 'express';
import { updateSlider, getAllSliders } from '../controllers/sliderController';
import { verifyToken } from '../middlewares/tokenvaryfie';
import { verifyAdmin } from '../middlewares/verifyAdmin'

const router = express.Router();

// স্লাইডার গেট করতে কোনো রেস্ট্রিকশন নেই (সবাই দেখবে)
router.get('/', getAllSliders);

// শুধুমাত্র অ্যাডমিন স্লাইডার আপডেট করতে পারবে
router.put('/:slideNumber', verifyToken, verifyAdmin, updateSlider);

export default router;