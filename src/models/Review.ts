import mongoose, { Schema, model, models, Model } from "mongoose";

export interface IReview {
  productId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  userName: string;
  userEmail: string;
  userProfileImage?: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { 
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    userName: { 
      type: String, 
      required: true 
    },
    userEmail: { 
      type: String, 
      required: true 
    },
    userProfileImage: { 
      type: String,
      required: true
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      required: true, 
      minlength: 10 
    },
  },
  { 
    timestamps: true 
  }
);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review: Model<IReview> = models.Review || model<IReview>("Review", ReviewSchema);
