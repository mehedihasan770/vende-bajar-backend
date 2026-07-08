import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  groupOrderId: string;
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
    price: number;
    shippingClass: "standard" | "heavy" | "digital";
  }[];
  subtotal: number;
  paymentMethod: "cod" | "bkash";
  paymentStatus: "pending" | "paid" | "failed" | "not_applicable";
  orderStatus: "pending_payment" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentExpiresAt?: Date;
  bkashPaymentID?: string;
  bkashTrxID?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    groupOrderId: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        shippingClass: {
          type: String,
          enum: ["standard", "heavy", "digital"],
          required: true
        }
      }
    ],
    subtotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "bkash"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "not_applicable"],
      default: "pending"
    },
    orderStatus: {
      type: String,
      enum: ["pending_payment", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending_payment"
    },
    paymentExpiresAt: { type: Date },
    bkashPaymentID: { type: String },
    bkashTrxID: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export default Order;
