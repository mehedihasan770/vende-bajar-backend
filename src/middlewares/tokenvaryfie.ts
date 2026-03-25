import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.vende_token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Access denied. No token provided." 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: "Invalid or expired token." 
    });
  }
};