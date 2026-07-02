import mongoose, { Schema, Document, Model } from "mongoose";

// =============================================================
// ✅ INTERFACES
// =============================================================

interface IVariant {
  sku?: string;
  attributes: {
    color?: string;
    size?: string;
  };
  priceOverride?: number;
  stock: number;
  images: string[];
  isDefault: boolean;
}

interface IPricing {
  basePrice: number;
  costPrice?: number;
  saleType?: "flash" | "regular";
  salePrice?: number;
  regularPrice?: number; // সাধারণ ডিসকাউন্ট প্রাইস
  saleStartDate?: Date;
  saleEndDate?: Date;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  sku?: string;
  tags: string[];
  category: mongoose.Types.ObjectId;
  subCategory?: string;
  thumbnail: string;
  images: string[];
  videoUrl?: string;
  pricing: IPricing;
  inventory: {
    stock: number;
    lowStockThreshold: number;
    isOutOfStock: boolean;
    allowBackorder: boolean;
  };
  hasVariants: boolean;
  variants: IVariant[];
  specifications: Map<string, string>;
  shipping: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  status: "draft" | "pending" | "active" | "inactive" | "archived";
  isFeatured: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  vendor: mongoose.Types.ObjectId;
  vendorEmail: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  rating: number;
  numReviews: number;
  totalSales: number;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  finalPrice: number;
  isSaleActive: boolean;
  isFlashSaleActive: boolean;
  discountPercentage: number;
  totalStock: number;
}

// =============================================================
// ✅ VARIANT SUB-SCHEMA
// =============================================================

const variantSchema = new Schema<IVariant>(
  {
    sku: { type: String, trim: true, uppercase: true },
    attributes: {
      color: { type: String, trim: true },
      size: { type: String, trim: true, uppercase: true },
    },
    priceOverride: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

// =============================================================
// ✅ MAIN PRODUCT SCHEMA
// =============================================================

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [5, "Name must be at least 5 characters"],
    },
    slug: { type: String, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    brand: { type: String, required: true },
    sku: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategory: { type: String, trim: true },
    thumbnail: { type: String, required: true },
    images: [{ type: String }],
    videoUrl: { type: String },
    pricing: {
      basePrice: { type: Number, required: true, min: 0.01 },
      costPrice: { type: Number, min: 0 },
      saleType: { type: String, enum: ["flash", "regular"], default: null },
      salePrice: { type: Number, min: 0 },
      regularPrice: { type: Number, min: 0 },
      saleStartDate: { type: Date },
      saleEndDate: { type: Date },
    },
    inventory: {
      stock: { type: Number, required: true, default: 0, min: 0 },
      lowStockThreshold: { type: Number, default: 10 },
      isOutOfStock: { type: Boolean, default: false },
      allowBackorder: { type: Boolean, default: false },
    },
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    specifications: { type: Map, of: String, default: {} },
    shipping: {
      weight: { type: Number, default: 0 },
      dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
    },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "inactive", "archived"],
      default: "pending",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorEmail: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // If flash sale is not active, remove unnecessary flash-related fields
        if (!ret.isFlashSaleActive) {
          if (ret.pricing) {
            delete ret.pricing.saleStartDate;
            delete ret.pricing.saleEndDate;
            delete ret.pricing.salePrice;
          }
        }
        // Always remove sensitive or unnecessary internal fields from JSON response
        if (ret.pricing) {
          delete ret.pricing.costPrice;
        }
        delete ret.status;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true },
  }
);

productSchema.index({ name: "text", description: "text", tags: "text" });

// =============================================================
// ✅ PRE-SAVE MIDDLEWARE
// =============================================================

productSchema.pre("save", async function (this: IProduct) {
  if (this.isModified("name") || !this.slug) {
    const baseSlug = this.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    let slug = baseSlug;
    let count = 1;
    const ProductModel = this.constructor as Model<IProduct>;
    while (await ProductModel.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }
    this.slug = slug;
  }

  const { saleType, salePrice, basePrice, saleStartDate, saleEndDate } = this.pricing;

  if (saleType === "flash") {
    if (!salePrice || !saleStartDate || !saleEndDate) {
      throw new Error("Flash sale requires sale price and dates");
    }
    if (saleStartDate >= saleEndDate) {
      throw new Error("Start date must be before end date");
    }
    const discountPercent = ((basePrice - salePrice) / basePrice) * 100;
    if (discountPercent < 15 || discountPercent > 75) {
      throw new Error(`Flash sale discount (${discountPercent.toFixed(1)}%) must be between 15% and 75%`);
    }
  }

  if (this.inventory) {
    const totalStock = this.hasVariants ? this.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : this.inventory.stock;
    this.inventory.isOutOfStock = totalStock <= 0;
  }

  this.hasVariants = this.variants.length > 0;
});

// =============================================================
// ✅ VIRTUALS
// =============================================================

const getSaleInfo = (product: IProduct) => {
  const now = new Date();
  const { saleType, salePrice, saleStartDate, saleEndDate, basePrice, regularPrice } = product.pricing || {};
  const isFlashActive = saleType === "flash" && salePrice && saleStartDate && saleEndDate && new Date(saleStartDate) <= now && new Date(saleEndDate) >= now;
  const isRegularActive = regularPrice && regularPrice < basePrice;
  return { isFlashActive, isRegularActive };
};

productSchema.virtual("isFlashSaleActive").get(function (this: IProduct) {
  return getSaleInfo(this).isFlashActive;
});

productSchema.virtual("isSaleActive").get(function (this: IProduct) {
  const { isFlashActive, isRegularActive } = getSaleInfo(this);
  return isFlashActive || isRegularActive;
});

productSchema.virtual("finalPrice").get(function (this: IProduct) {
  const { isFlashActive, isRegularActive } = getSaleInfo(this);
  if (isFlashActive) return this.pricing.salePrice;
  if (isRegularActive) return this.pricing.regularPrice;
  return this.pricing.basePrice;
});

productSchema.virtual("discountPercentage").get(function (this: IProduct) {
  const finalPrice = this.finalPrice;
  const basePrice = this.pricing?.basePrice;
  if (finalPrice < basePrice) {
    return Math.round(((basePrice - finalPrice) / basePrice) * 100);
  }
  return 0;
});

productSchema.virtual("totalStock").get(function (this: IProduct) {
  if (this.hasVariants && this.variants.length > 0) {
    return this.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }
  return this.inventory?.stock ?? 0;
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
