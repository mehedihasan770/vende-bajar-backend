import express from 'express';
import { verifyToken } from '../middlewares/tokenvaryfie';
import { verifyVendor } from '../middlewares/verifyVendor';
import { createProduct } from '../controllers/productController';

const router = express.Router();

// Get User Route
router.post('/add', verifyToken, verifyVendor, createProduct);

export default router;