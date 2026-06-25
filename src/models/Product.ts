import mongoose, { Schema, Document, Model } from 'mongoose';

// ভ্যারিয়েন্ট ইন্টারফেস (কালার, সাইজ বা অন্য অপশনের জন্য)
interface IVariant {
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  attributes: Map<string, string>; // e.g., { "color": "Red", "size": "XL" }
  images: string[];
  isDefault: boolean;
}

export interface IProduct extends Document {
  // Identity & Ownership
  vendor: mongoose.Types.ObjectId;
  vendorEmail: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;

  // Basic Info
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId; // Reference to Category Model
  subCategory?: string;
  brand: string;
  tags: string[];
  keywords?: string;

  // Pricing & Stock (Main/Default)
  basePrice: number;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  costPrice?: number;
  stock: number;
  sku: string;

  // Variants
  hasVariants: boolean;
  variants: IVariant[];

  // Media
  thumbnail: string;
  images: string[];
  videoUrl?: string;
  specifications: Map<string, string>;

  // Marketing & Flags
  isFeatured: boolean;
  isFlashSale: boolean;
  discountPercentage: number;

  // Status & Management
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'draft' | 'archived';
  isDeleted: boolean;
  deletedAt?: Date;

  // Metrics & Analytics
  rating: number;
  numReviews: number;
  totalSales: number;
  viewCount: number;

  // Inventory & Shipping
  inventory: {
    lowStockThreshold: number;
    isOutOfStock: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight?: number; // In KG or Gram
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingClass?: string; // e.g., "Heavy Load", "Fragile"
  };

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Linked Products (Cross-sell/Up-sell)
  relatedProducts: mongoose.Types.ObjectId[];
  upsellProducts: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema({
  sku: { type: String, required: true, unique: true, sparse: true },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  attributes: { type: Map, of: String },
  images: [{ type: String }],
  isDefault: { type: Boolean, default: false }
});

const productSchema: Schema<IProduct> = new Schema({
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendorEmail: { type: String, required: true, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  name: { type: String, required: true, trim: true, index: 'text' },
  slug: { type: String, unique: true, lowercase: true, index: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  subCategory: { type: String },
  brand: { type: String, required: true, index: true },
  tags: [{ type: String, index: true }],
  keywords: { type: String },

  basePrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  saleStartDate: { type: Date },
  saleEndDate: { type: Date },
  costPrice: { type: Number, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  sku: { type: String, unique: true, sparse: true, index: true },

  hasVariants: { type: Boolean, default: false },
  variants: [variantSchema],

  thumbnail: { type: String, required: true },
  images: [{ type: String }],
  videoUrl: { type: String },
  specifications: { type: Map, of: String, default: {} },

  isFeatured: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive', 'draft', 'archived'],
    default: 'pending',
    index: true
  },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },

  inventory: {
    lowStockThreshold: { type: Number, default: 5 },
    isOutOfStock: { type: Boolean, default: false },
    allowBackorder: { type: Boolean, default: false }
  },
  shipping: {
    weight: { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 }
    },
    shippingClass: { type: String }
  },

  metaTitle: { type: String },
  metaDescription: { type: String },

  relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  upsellProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Middleware: Slug generation and Stock Management
productSchema.pre<IProduct>('save', async function () {
  if (this.isModified('name')) {
    this.slug = this.name
      .split(' ')
      .join('-')
      .toLowerCase()
      .replace(/[^\w-]+/g, '');
  }

  // Stock status logic
  if (this.stock <= 0) {
    this.inventory.isOutOfStock = true;
  } else {
    this.inventory.isOutOfStock = false;
  }

  // Discount calculation
  if (this.basePrice > 0 && this.salePrice) {
    this.discountPercentage = Math.round(((this.basePrice - this.salePrice) / this.basePrice) * 100);
  }
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product;
