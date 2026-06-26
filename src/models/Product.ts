import mongoose, { Schema, Document, Model } from "mongoose";

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
  category: string;
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
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "inactive"
    | "draft"
    | "archived";
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
  isDefault: { type: Boolean, default: false },
});

const productSchema: Schema<IProduct> = new Schema(
  {
    // Vendor/auth itself sets these values during creation
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // input from logged-in vendor auth
    vendorEmail: { type: String, required: true, trim: true }, // input from auth/session
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // system: created by current user
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }, // system: updated on edit

    // Product identity fields from vendor form
    name: { type: String, required: true, trim: true, index: "text" }, // required input
    slug: { type: String, unique: true, lowercase: true, index: true }, // system-generated from name
    description: { type: String, required: true }, // required input
    shortDescription: { type: String }, // optional input
    category: {
      type: String,
      required: true,
      index: true,
    }, // required input
    subCategory: { type: String }, // optional input
    brand: { type: String, required: true, index: true }, // required input
    tags: [{ type: String, index: true }], // optional input list
    keywords: { type: String }, // optional input

    // Pricing and stock inputs
    basePrice: { type: Number, required: true, min: 0 }, // required input
    salePrice: { type: Number, min: 0 }, // optional input
    saleStartDate: { type: Date }, // optional input
    saleEndDate: { type: Date }, // optional input
    costPrice: { type: Number, min: 0 }, // optional input
    stock: { type: Number, required: true, default: 0, min: 0 }, // required input
    sku: { type: String, unique: true, sparse: true, index: true }, // optional input

    // Variant support
    hasVariants: { type: Boolean, default: false }, // optional flag from vendor
    variants: [variantSchema], // optional array of variant objects

    // Media and specification inputs
    thumbnail: { type: String, required: true }, // required input URL
    images: [{ type: String }], // optional gallery URLs input
    videoUrl: { type: String }, // optional input URL
    specifications: { type: Map, of: String, default: {} }, // optional key/value inputs

    // Marketing/flag inputs
    isFeatured: { type: Boolean, default: false }, // optional input
    isFlashSale: { type: Boolean, default: false }, // optional input
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 }, // system-calculated

    // System status fields
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "active",
        "inactive",
        "draft",
        "archived",
      ],
      default: "pending",
      index: true,
    }, // system-managed status
    isDeleted: { type: Boolean, default: false, index: true }, // system-managed soft delete
    deletedAt: { type: Date }, // system-managed timestamp

    // System metrics fields
    rating: { type: Number, default: 0, min: 0, max: 5 }, // system-updated rating
    numReviews: { type: Number, default: 0 }, // system-tracked
    totalSales: { type: Number, default: 0 }, // system-tracked
    viewCount: { type: Number, default: 0 }, // system-tracked

    // Inventory configuration
    inventory: {
      lowStockThreshold: { type: Number, default: 5 }, // optional input
      isOutOfStock: { type: Boolean, default: false }, // system-updated based on stock
      allowBackorder: { type: Boolean, default: false }, // optional input
    },
    shipping: {
      weight: { type: Number, default: 0 }, // optional input
      dimensions: {
        length: { type: Number, default: 0 }, // optional input
        width: { type: Number, default: 0 }, // optional input
        height: { type: Number, default: 0 }, // optional input
      },
      shippingClass: { type: String }, // optional input
    },

    // SEO fields from vendor
    metaTitle: { type: String }, // optional input
    metaDescription: { type: String }, // optional input

    // Optional product relations
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }], // optional input references
    upsellProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }], // optional input references
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
productSchema.index({ name: "text", description: "text", tags: "text" });

// Middleware: Slug generation and Stock Management
productSchema.pre<IProduct>("save", async function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .split(" ")
      .join("-")
      .toLowerCase()
      .replace(/[^\w-]+/g, "");
  }

  // Stock status logic
  if (this.stock <= 0) {
    this.inventory.isOutOfStock = true;
  } else {
    this.inventory.isOutOfStock = false;
  }

  // Discount calculation
  if (this.basePrice > 0 && this.salePrice) {
    this.discountPercentage = Math.round(
      ((this.basePrice - this.salePrice) / this.basePrice) * 100,
    );
  }
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
