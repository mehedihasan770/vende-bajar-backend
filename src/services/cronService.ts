import cron from "node-cron";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";

/**
 * @desc Auto-cancel expired orders and restore stock
 * Runs every 5 minutes
 */
export const initCronJobs = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running Cron Job: Checking for expired orders...");

    const now = new Date();
    const expiredOrders = await Order.find({
      orderStatus: "pending_payment",
      paymentExpiresAt: { $lt: now }
    });

    if (expiredOrders.length === 0) {
      console.log("✅ No expired orders found.");
      return;
    }

    console.log(`🧨 Found ${expiredOrders.length} expired orders. Starting cleanup...`);

    for (const order of expiredOrders) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // 1. Revert Stock for each product in the order
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { "inventory.stock": item.quantity } },
            { session }
          );
        }

        // 2. Mark Order as Cancelled
        order.orderStatus = "cancelled";
        await order.save({ session });

        await session.commitTransaction();
        console.log(`✅ Order ${order._id} cancelled and stock restored.`);
      } catch (error) {
        await session.abortTransaction();
        console.error(`❌ Failed to cleanup order ${order._id}:`, error);
      } finally {
        session.endSession();
      }
    }

    console.log("🏁 Cron Job cleanup finished.");
  });
};
