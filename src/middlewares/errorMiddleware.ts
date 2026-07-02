import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // অপারেশনাল এরর (যেমন ইউজার ইনপুট ভুল)
    Error.captureStackTrace(this, this.constructor);
  }
}

// মঙ্গুস এরর হ্যান্ডলারসমূহ
const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401);

// ডেভেলপমেন্ট এরর রেসপন্স (সব বিস্তারিত দেখাবে)
const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// প্রোডাকশন এরর রেসপন্স (ইউজার ফ্রেন্ডলি মেসেজ)
const sendErrorProd = (err: any, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // আননোন এরর (সার্ভার সাইড সিক্রেট ফাঁস করবে না)
    console.error("ERROR 💥", err);
    res.status(500).json({
      success: false,
      message: "Something went very wrong!",
    });
  }
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// CatchAsync Wrapper (সব কন্ট্রোলারের জন্য)
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
