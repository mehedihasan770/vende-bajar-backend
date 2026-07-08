import mongoose, { Schema, Document } from "mongoose";

export interface IShippingConfig extends Document {
  division: "Rangpur" | "Other Divisions";
  configs: [
    {
      className: "standard" | "heavy" | "digital";
      price: number;
    }
  ];
  updatedBy: mongoose.Types.ObjectId;
}

const shippingConfigSchema = new Schema<IShippingConfig>(
  {
    division: {
      type: String,
      enum: ["Rangpur", "Other Divisions"],
      required: true,
      unique: true
    },
    configs: [
      {
        className: {
          type: String,
          enum: ["standard", "heavy", "digital"],
          required: true
        },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

const ShippingConfig = mongoose.models.ShippingConfig || mongoose.model<IShippingConfig>("ShippingConfig", shippingConfigSchema);

export default ShippingConfig;
