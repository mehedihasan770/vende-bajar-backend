import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  image?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, index: true },
    image: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: true,
  }
);

// Slug auto-generation middleware
categorySchema.pre<ICategory>("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.split(" ").join("-").toLowerCase().replace(/[^\w-]+/g, "");
  }
  next();
});

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);

export default Category;
