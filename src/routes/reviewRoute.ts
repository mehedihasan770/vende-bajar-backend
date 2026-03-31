import express from 'express';
import { verifyToken } from '../middlewares/tokenvaryfie';
import { createReview } from '../controllers/reviewController';

const router = express.Router();

// Review Route
router.post('/add', verifyToken, createReview);

export default router;