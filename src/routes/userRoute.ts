import express from 'express';
import { getMe } from '../controllers/userController';
import { verifyToken } from '../middlewares/tokenvaryfie';

const router = express.Router();

// Get User Route
router.get('/me', verifyToken, getMe);

export default router;