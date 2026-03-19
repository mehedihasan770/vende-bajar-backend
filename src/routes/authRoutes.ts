import express from 'express';
import { loginUser, registerUser } from '../controllers/authController';

const router = express.Router();

// auth route
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;