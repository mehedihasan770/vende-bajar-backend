import { Response, NextFunction } from 'express';
import { AuthRequest } from './verifyToken';

export const verifyVendor = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  // Allowing both 'vendor' and 'admin' because admin usually has all access
  if (user && (user.role === 'vendor' || user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied! Only vendors or admins can perform this action."
    });
  }
};
