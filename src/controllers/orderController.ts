import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import ShippingConfig from "../models/ShippingConfig";
import GroupOrder from "../models/GroupOrder";
import Order from "../models/Order";
import { AppError, catchAsync } from "../middlewares/errorMiddleware";
import { v4 as uuidv4 } from 'uuid';

// Helper: Calculate shipping charge based on division and items
const calculateShippingCharge = async (division: string, items: any[]) => {
  const targetDivision = division.toLowerCase().includes("rangpur") ? "Rangpur" : "Other Divisions";
  const shippingConfig = await ShippingConfig.findOne({ division: targetDivision });
  if (!shippingConfig) throw new AppError("Shipping configuration not found.", 404);

  const classes = items.map(item => item.shippingClass);
  if (classes.includes("heavy")) return shippingConfig.configs.find((c: any) => c.className === "heavy")?.price || 0;
  if (classes.includes("standard")) return shippingConfig.configs.find((c: any) => c.className === "standard")?.price || 0;
  return shippingConfig.configs.find((c: any) => c.className === "digital")?.price || 0;
};

// @desc    Create a new order (Supports Split Order & Atomic Stock)
// @route   POST /api/v1/orders/create
export const createOrder = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  const { items, shippingAddress, paymentMethod, idempotencyKey } = req.body;
  const userId = req.user.id;
  const groupOrderId = `GB-${uuidv4().split('-')[0].toUpperCase()}`;

  // 1. Idempotency Check
  const existingGroupOrder = await GroupOrder.findOne({ idempotencyKey });
  if (existingGroupOrder) return res.status(200).json({ success: true, message: "Order already processed", data: existingGroupOrder });

  // 2. Data Verification & Price Check
  const processedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || product.status !== 'active') return next(new AppError(`Product ${item.name} unavailable`, 404));
    processedItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.finalPrice,
      shippingClass: product.shippingClass,
      directPayment: product.directPayment
    });
  }

  // 3. Shipping & Payment Window
  const deliveryCharge = await calculateShippingCharge(shippingAddress.division, processedItems);
  const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins window

  // 4. MONGODB TRANSACTION START (Modern Industrial Way)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 4.1 Split Items into Groups
    const groupA = processedItems.filter(i => !i.directPayment); // Can be COD or bKash
    const groupB = processedItems.filter(i => i.directPayment);  // ONLY bKash

    const subOrders = [];

    // 4.2 Handle Group A (COD or bKash)
    if (groupA.length > 0) {
      const isCod = paymentMethod === 'cod';
      const subtotalA = groupA.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const orderA = await Order.create([{
        groupOrderId,
        user: userId,
        items: groupA,
        subtotal: subtotalA,
        paymentMethod: isCod ? 'cod' : 'bkash',
        paymentStatus: isCod ? 'not_applicable' : 'pending',
        orderStatus: isCod ? 'confirmed' : 'pending_payment',
        paymentExpiresAt: isCod ? undefined : paymentExpiresAt
      }], { session });
      subOrders.push(orderA[0]._id);
    }

    // 4.3 Handle Group B (Mandatory bKash)
    if (groupB.length > 0) {
      const subtotalB = groupB.reduce((acc, i) => acc + (i.price * i.quantity), 0);

      const orderB = await Order.create([{
        groupOrderId,
        user: userId,
        items: groupB,
        subtotal: subtotalB,
        paymentMethod: 'bkash',
        paymentStatus: 'pending',
        orderStatus: 'pending_payment',
        paymentExpiresAt
      }], { session });
      subOrders.push(orderB[0]._id);
    }

    // 4.4 ATOMIC STOCK DECREMENT
    for (const item of processedItems) {
      const result = await Product.findOneAndUpdate(
        { _id: item.product, "inventory.stock": { $gte: item.quantity } },
        { $inc: { "inventory.stock": -item.quantity } },
        { session, new: true }
      );
      if (!result) throw new AppError(`Stock ran out for ${item.name}`, 400);
    }

    // 4.5 Create Parent GroupOrder
    const totalAmount = processedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0) + deliveryCharge;
    const groupOrder = await GroupOrder.create([{
      groupOrderId,
      user: userId,
      shippingAddress,
      subOrders,
      totalAmount,
      deliveryCharge,
      idempotencyKey
    }], { session });

    // COMMIT ALL CHANGES
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order placed successfully! 🚀",
      data: {
        groupOrderId,
        totalAmount,
        paymentExpiresAt,
        requiresPayment: paymentMethod === 'bkash' || groupB.length > 0
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});
