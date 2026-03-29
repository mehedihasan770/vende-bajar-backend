import mongoose, { Schema, Document, Model } from 'mongoose';

interface IReview {
  userId: mongoose.Types.ObjectId;
  userName: string;
  comment: string;
  userRating: number;
  date: Date;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  brand: string;
  price: number;
  oldPrice?: number;
  discountPercentage: number;
  costPrice?: number;
  stock: number;
  sku?: string;
  thumbnail: string;
  images: string[];
  videoUrl?: string;
  specifications: {
    color?: string[];
    size?: string[];
    material?: string;
    weight?: string;
  };
  isFeatured: boolean;
  isFlashSale: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  status: 'active' | 'inactive' | 'draft';
  rating: number;
  numReviews: number;
  reviews: IReview[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
}

const productSchema: Schema<IProduct> = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  brand: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  discountPercentage: { type: Number, default: 0 },
  costPrice: { type: Number },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, unique: true },
  thumbnail: { type: String, required: true },
  images: [{ type: String }],
  videoUrl: { type: String },
  specifications: {
    color: [{ type: String }],
    size: [{ type: String }],
    material: { type: String },
    weight: { type: String }
  },
  isFeatured: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: true },
  isBestSeller: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      comment: String,
      userRating: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  metaTitle: { type: String },
  metaDescription: { type: String },
  createdAt: { type: Date, default: Date.now }
});


productSchema.pre<IProduct>('save', async function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .split(' ')
      .join('-')
      .toLowerCase()
      .replace(/[^\w-]+/g, '');
  }
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;