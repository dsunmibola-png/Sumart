import { Response } from "express";
import type { Request } from "express";

import {
  createOrder,
  getUserOrderById,
  getUserOrders,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} from "../services/orderService";

interface AuthenticatedRequest
  extends Request {
  userId?: string;
}

/*
 * CREATE ORDER
 */
export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({
          message:
            "Not authorized",
        });
    }

    const {
      items,
      shippingAddress,
      paymentMethod,
    } = req.body;

    const order =
      await createOrder({
        userId:
          req.userId,

        items,

        shippingAddress,

        paymentMethod,
      });

    return res
      .status(201)
      .json({
        message:
          "Order placed successfully",

        order,
      });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to place order";

    return res
      .status(400)
      .json({
        message,
      });
  }
};

/*
 * ADMIN:
 * GET PAGINATED ORDERS
 *
 * Examples:
 *
 * /api/orders/admin/all
 *
 * /api/orders/admin/all?page=2
 *
 * /api/orders/admin/all?page=1&limit=20
 *
 * /api/orders/admin/all?orderStatus=pending
 *
 * /api/orders/admin/all?paymentStatus=paid
 *
 * /api/orders/admin/all?search=john
 */
export const getAll = async (
  req: Request,
  res: Response
) => {
  try {
    /*
     * Convert page and limit from query
     * strings into numbers.
     */
    const parsedPage =
      Number(req.query.page);

    const parsedLimit =
      Number(req.query.limit);

    const page =
      Number.isFinite(
        parsedPage
      ) &&
      parsedPage > 0
        ? Math.floor(
            parsedPage
          )
        : 1;

    const limit =
      Number.isFinite(
        parsedLimit
      ) &&
      parsedLimit > 0
        ? Math.floor(
            parsedLimit
          )
        : 20;

    const orderStatus =
      typeof req.query
        .orderStatus ===
      "string"
        ? req.query
            .orderStatus
        : undefined;

    const paymentStatus =
      typeof req.query
        .paymentStatus ===
      "string"
        ? req.query
            .paymentStatus
        : undefined;

    const search =
      typeof req.query
        .search ===
      "string"
        ? req.query.search
        : undefined;

    /*
     * Validate optional order status.
     */
    const allowedOrderStatuses =
      [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];

    if (
      orderStatus &&
      !allowedOrderStatuses.includes(
        orderStatus
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid order status",
        });
    }

    /*
     * Validate optional payment status.
     */
    const allowedPaymentStatuses =
      [
        "pending",
        "paid",
        "failed",
      ];

    if (
      paymentStatus &&
      !allowedPaymentStatuses.includes(
        paymentStatus
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Invalid payment status",
        });
    }

    const result =
      await getAllOrders({
        page,
        limit,
        orderStatus,
        paymentStatus,
        search,
      });

    return res
      .status(200)
      .json({
        orders:
          result.orders,

        pagination:
          result.pagination,
      });
  } catch (error) {
    console.error(
      "Failed to fetch admin orders:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to fetch orders",
      });
  }
};

/*
 * ADMIN:
 * GET SINGLE ORDER
 */
export const getAdminOrder =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const orderId =
        String(
          req.params.id
        );

      const order =
        await getAdminOrderById(
          orderId
        );

      return res
        .status(200)
        .json({
          order,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Order not found";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };

/*
 * ADMIN:
 * UPDATE ORDER STATUS
 */
export const updateStatus =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const orderId =
        String(
          req.params.id
        );

      const {
        status,
      } = req.body;

      const allowedStatuses =
        [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid order status",
          });
      }

      const order =
        await updateOrderStatus(
          orderId,
          status
        );

      return res
        .status(200)
        .json({
          message:
            "Order status updated successfully",

          order,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update order status";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };

/*
 * CUSTOMER:
 * GET THEIR ORDERS
 */
export const getMyOrders =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized",
          });
      }

      const orders =
        await getUserOrders(
          req.userId
        );

      return res
        .status(200)
        .json({
          orders,
        });
    } catch {
      return res
        .status(500)
        .json({
          message:
            "Failed to fetch orders",
        });
    }
  };

/*
 * CUSTOMER:
 * GET SINGLE ORDER
 */
export const getMyOrder =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized",
          });
      }

      const orderId =
        String(
          req.params.id
        );

      const order =
        await getUserOrderById(
          orderId,
          req.userId
        );

      return res
        .status(200)
        .json({
          order,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Order not found";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };