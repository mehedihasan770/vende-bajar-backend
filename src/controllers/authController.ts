import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // 1. Validation for essential fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password).',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ // 409: Conflict
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // 3. Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User in Database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || null,
      role: 'user',
      isVerified: false,
    });

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email },
      process.env.JWT_SECRET || 'vende_bajar_default_secret',
      { expiresIn: '7d' }
    );

    // 6. Success Response
    res.status(201).json({
      success: true,
      message: 'User registered successfully! ✅',
      token,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
      },
    });

  } catch (error: any) {
    // 7. Global Error Handler for Server
    console.error('Registration Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};






export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists (with password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 3. Update Last Login Date
    user.lastLogin = new Date();
    await user.save();

    // 4. Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      data: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};