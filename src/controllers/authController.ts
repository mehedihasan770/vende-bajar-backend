import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;

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
      role: role || 'user',
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