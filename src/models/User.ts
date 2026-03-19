import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string | null;
  password: string;
  profileImage: string;
  role: 'user' | 'admin' | 'vendor';
  accountStatus: 'active' | 'suspended' | 'pending';
  isVerified: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  rating: number;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: null },
    password: { type: String, required: true, select: false },
    profileImage: { 
      type: String, 
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' 
    },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'vendor'], 
      default: 'user' 
    },
    accountStatus: { 
      type: String, 
      enum: ['active', 'suspended', 'pending'], 
      default: 'active' 
    },
    isVerified: { type: Boolean, default: false },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    rating: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now }
  },
  { 
    timestamps: true
  }
);

export default mongoose.model<IUser>('User', UserSchema);
