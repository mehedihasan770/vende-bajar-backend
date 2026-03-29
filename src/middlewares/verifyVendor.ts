import { Request, Response, NextFunction } from 'express';

export const verifyVendor = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user && user.role === 'vendor') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied! Only vendors can add products."
    });
  }
};