import express from 'express';
import { verifyToken } from '../middlewares/tokenvaryfie';
import { verifyVendor } from '../middlewares/verifyVendor';
import { createProduct, getFeaturedProducts, getProductById } from '../controllers/productController';

const router = express.Router();

// product Route
router.post('/add', verifyToken, verifyVendor, createProduct);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

export default router;