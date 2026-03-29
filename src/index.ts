import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './lib/db';
import authRoutes from "./routes/authRoutes";
import userRouter from './routes/userRoute';
import productRoutes from './routes/productRoutes';

// Configuration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// mongodb
connectDB();

// auth route
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/user', userRouter);
app.use('/api/v1/products', productRoutes);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Vende Bajar Server is flying! 🚀',
    status: 'Ready for Development'
  });
});

// Server Listen
app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`-------------------------------------------`);
});