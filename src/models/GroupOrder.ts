import mongoose, { Schema, Document } from "mongoose";

export interface IGroupOrder extends Document {
  groupOrderId: string;
  user: mongoose.Types.ObjectId;
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    address: string;
  };
  subOrders: mongoose.Types.ObjectId[];
  totalAmount: number;
  deliveryCharge: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupOrderSchema = new Schema<IGroupOrder>(
  {
    groupOrderId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      division: { type: String, required: true },
      address: { type: String, required: true },
    },
    subOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const GroupOrder = mongoose.models.GroupOrder || mongoose.model<IGroupOrder>("GroupOrder", groupOrderSchema);
export default GroupOrder;
