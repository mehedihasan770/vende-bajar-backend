import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuration
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route (সার্ভার চেক করার জন্য)
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