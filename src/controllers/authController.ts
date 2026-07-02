import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError, catchAsync } from '../middlewares/errorMiddleware';

export const registerUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return next(new AppError('Please provide all required fields (name, email, password).', 400));
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User with this email already exists.', 409));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword,
    phone: phone || null,
    role: 'user',
    isVerified: false,
  });

  const token = jwt.sign(
    { id: newUser._id, role: newUser.role, email: newUser.email, fullName: newUser.fullName },
    process.env.JWT_SECRET || 'vende_bajar_default_secret',
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully! ✅',
    token,
    data: {
      id: newUser._id,
      name: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      accountStatus: newUser.accountStatus,
    },
  });
});

export const loginUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email, fullName: user.fullName  },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful! Welcome back.',
    token,
    data: { id: user._id, name: user.fullName, email: user.email, role: user.role }
  });
});