import { Request, Response, NextFunction } from 'express';

export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user && user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access Denied! Admin power required for this action."
    });
  }
};