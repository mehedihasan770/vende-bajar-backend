import mongoose, { Schema, Document, Model } from "mongoose";

// ভ্যারিয়েন্ট ইন্টারফেস
interface IVariant {
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  attributes: Map<string, string>;
  images: string[];
  isDefault: boolean;
}

export interface IProduct extends Document {
  vendor: mongoose.Types.ObjectId;
  vendorEmail: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  brand: string;
  tags: string[];
  keywords?: string;
  basePrice: number;
  salePrice?: number;
  saleType?: "flash" | "regular" | null;
  regularPrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  costPrice?: number;
  sku: string;
  hasVariants: boolean;
  variants: IVariant[];
  thumbnail: string;
  images: string[];
  videoUrl?: string;
  specifications: Map<string, string>;
  isFeatured: boolean;
  isFlashSale: boolean;
  status: "pending" | "approved" | "rejected" | "active" | "inactive" | "draft" | "archived";
  isDeleted: boolean;
  deletedAt?: Date;
  rating: number;
  numReviews: number;
  totalSales: number;
  viewCount: number;
  inventory: {
    stock: number;
    lowStockThreshold: number;
    isOutOfStock: boolean;
    allowBackorder: boolean;
  };
  shipping: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number; };
    shippingClass?: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  relatedProducts: mongoose.Types.ObjectId[];
  upsellProducts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  finalPrice: number;
  isSaleActive: boolean;
  isFlashSaleActive: boolean;
  discountPercentage: number;
  stock: number;
}

const variantSchema = new Schema({
  sku: { type: String, required: true, unique: true, sparse: true },
  price: { type: Number, required: true, min: 0.01 },
  salePrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  attributes: { type: Map, of: String },
  images: [{ type: String }],
  isDefault: { type: Boolean, default: false },
});

const productSchema: Schema<IProduct> = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vendorEmail: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true, index: "text" },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    brand: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    keywords: { type: String },
    basePrice: { type: Number, required: true, min: 0.01 },
    salePrice: { type: Number, min: 0 },
    saleType: { type: String, enum: ["flash", "regular"], index: true },
    regularPrice: { type: Number, min: 0 },
    saleStartDate: { type: Date },
    saleEndDate: { type: Date },
    costPrice: { type: Number, min: 0 },
    sku: { type: String, unique: true, sparse: true, index: true },
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    thumbnail: { type: String, required: true },
    images: [{ type: String }],
    videoUrl: { type: String },
    specifications: { type: Map, of: String, default: {} },
    isFeatured: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "inactive", "draft", "archived"],
      default: "pending",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    inventory: {
      stock: { type: Number, required: true, default: 0, min: 0 },
      lowStockThreshold: { type: Number, default: 10 },
      isOutOfStock: { type: Boolean, default: false },
      allowBackorder: { type: Boolean, default: false },
    },
    shipping: {
      weight: { type: Number, default: 0 },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
      shippingClass: { type: String },
    },
    metaTitle: { type: String },
    metaDescription: { type: String },
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    upsellProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });

// Middleware
productSchema.pre<IProduct>("save", function () {
  if (this.isModified("name")) {
    this.slug = this.name.split(" ").join("-").toLowerCase().replace(/[^\w-]+/g, "");
  }

  // Auto-set isOutOfStock based on inventory stock
  if (this.inventory) {
    this.inventory.isOutOfStock = this.inventory.stock <= 0;
  }
});

// Virtual for legacy/convenience stock access
productSchema.virtual("stock").get(function(this: IProduct) {
  return this.inventory?.stock;
}).set(function(this: IProduct, value: number) {
  if (this.inventory) {
    this.inventory.stock = value;
  }
});

// Helper for sales logic
const getActiveSaleInfo = (p: IProduct) => {
  const now = new Date();

  // Flash Sale is active only during dates
  const isFlashActive = (p.saleType === "flash" || (p.saleType == null && p.isFlashSale)) &&
                  p.salePrice != null && p.saleStartDate && p.saleEndDate &&
                  p.saleStartDate <= now && p.saleEndDate >= now;

  // Regular Sale is active if flash is not active and regularPrice exists
  const isRegularActive = p.regularPrice != null && p.regularPrice < p.basePrice;

  return { isFlashActive, isRegularActive };
};

productSchema.virtual("isFlashSaleActive").get(function (this: IProduct) {
  return getActiveSaleInfo(this).isFlashActive;
});

productSchema.virtual("isSaleActive").get(function (this: IProduct) {
  const { isFlashActive, isRegularActive } = getActiveSaleInfo(this);
  return isFlashActive || isRegularActive;
});

productSchema.virtual("finalPrice").get(function (this: IProduct) {
  const { isFlashActive, isRegularActive } = getActiveSaleInfo(this);

  // Priority 1: Active Flash Sale
  if (isFlashActive) return this.salePrice;

  // Priority 2: Regular Sale (if flash expired or not present)
  if (isRegularActive) return this.regularPrice;

  // Default: Base Price
  return this.basePrice;
});

productSchema.virtual("discountPercentage").get(function (this: IProduct) {
  const finalPrice = this.finalPrice;
  if (finalPrice < this.basePrice) {
    return Math.round(((this.basePrice - finalPrice) / this.basePrice) * 100);
  }
  return 0;
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
