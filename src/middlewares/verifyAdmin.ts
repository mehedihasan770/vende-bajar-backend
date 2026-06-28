import { Response, NextFunction } from 'express';
import { AuthRequest } from './verifyToken';

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (user && user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access Denied! Admin power required for this action."
    });
  }
};
