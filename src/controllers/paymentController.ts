import { Request, Response } from "express";

import {
  initializePayment,
  verifyPayment,
} from "../services/paymentService";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const initialize = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }

    const payment = await initializePayment({
      orderId,
      userId: req.userId,
    });

    return res.status(200).json({
      message: "Payment initialized successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to initialize payment";

    return res.status(400).json({
      message,
    });
  }
};

export const verify = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    const reference = String(req.params.reference);

    const order = await verifyPayment(
      reference,
      req.userId
    );

    return res.status(200).json({
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify payment";

    return res.status(400).json({
      message,
    });
  }
};
