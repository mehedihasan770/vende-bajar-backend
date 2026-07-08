import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { catchAsync, AppError } from "../middlewares/errorMiddleware";

import Order from "../models/Order";
import mongoose from "mongoose";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout";

// Helper to get bKash Auth Token
export const getBkashToken = async () => {
  try {
    const { data } = await axios.post(
      `${BKASH_BASE_URL}/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      },
      {
        headers: {
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD,
        },
      }
    );
    return data.id_token;
  } catch (error: any) {
    console.error("bKash Grant Token Error:", error.response?.data || error.message);
    throw new AppError("Failed to authenticate with bKash", 500);
  }
};

// @desc    Create bKash Payment
// @route   POST /api/v1/bkash/create-payment
export const createPayment = catchAsync(async (req: any, res: Response, next: NextFunction) => {
  const { amount, groupOrderId } = req.body;
  const idToken = await getBkashToken();

  try {
    const { data } = await axios.post(
      `${BKASH_BASE_URL}/create`,
      {
        amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: groupOrderId,
        callbackURL: `${process.env.BACKEND_URL}/api/v1/bkash/callback`,
      },
      {
        headers: {
          Authorization: idToken,
          "X-APP-Key": process.env.BKASH_APP_KEY,
        },
      }
    );

    // Link this paymentID with all orders in this group
    await Order.updateMany(
      { groupOrderId, paymentMethod: "bkash", paymentStatus: "pending" },
      { bkashPaymentID: data.paymentID }
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("bKash Create Payment Error:", error.response?.data || error.message);
    next(new AppError("Failed to create bKash payment", 500));
  }
});

// @desc    bKash Payment Callback
// @route   GET /api/v1/bkash/callback
export const bkashCallback = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { paymentID, status } = req.query;
  const idToken = await getBkashToken();

  if (status === "success") {
    try {
      // 1. Execute Payment with bKash
      const { data: executeData } = await axios.post(
        `${BKASH_BASE_URL}/execute`,
        { paymentID },
        {
          headers: {
            Authorization: idToken,
            "X-APP-Key": process.env.BKASH_APP_KEY,
          },
        }
      );

      // 2. If Execute is successful, update all related orders atomically
      if (executeData.statusCode === "0000") {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          await Order.updateMany(
            { bkashPaymentID: paymentID },
            {
              paymentStatus: "paid",
              orderStatus: "confirmed",
              bkashTrxID: executeData.trxID
            },
            { session }
          );

          await session.commitTransaction();
          session.endSession();

          // Redirect to frontend success page
          return res.redirect(`${process.env.FRONTEND_URL}/payment/success?groupOrderId=${executeData.merchantInvoiceNumber}`);
        } catch (dbError) {
          await session.abortTransaction();
          session.endSession();
          throw dbError;
        }
      } else {
        // bKash execution failed (e.g. insufficient balance)
        return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?message=${executeData.statusMessage}`);
      }
    } catch (error: any) {
      console.error("bKash Execute Error:", error.response?.data || error.message);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?message=Transaction failed`);
    }
  } else {
    // User cancelled or payment failed at bKash end
    return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?message=Payment ${status}`);
  }
});

// @desc    Test bKash Token Generation
export const testBkashToken = catchAsync(async (req: Request, res: Response) => {
  const token = await getBkashToken();
  res.status(200).json({
    success: true,
    token: token.substring(0, 10) + "..." // Hide most for security
  });
});
