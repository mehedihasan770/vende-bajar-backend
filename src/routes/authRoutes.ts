import express from 'express';
import { loginUser, registerUser } from '../controllers/authController';
import { getMe } from '../controllers/userController';

const router = express.Router();

// auth route
router.post('/register', registerUser);
router.post('/login', loginUser);

// Get User Route
router.post('/me', getMe);

export default router;