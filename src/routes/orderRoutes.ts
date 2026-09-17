import { Router } from "express";

import {
  create,
  getMyOrder,
  getMyOrders,
  getAll,
  getAdminOrder,
  updateStatus,
} from "../controllers/orderController";

import {
  protect,
  requireVerifiedEmail,
} from "../middleware/authMiddleware";

import {
  adminOnly,
} from "../middleware/adminMiddleware";

const router = Router();

/*
 * Every order route requires
 * authentication.
 */
router.use(protect);

/*
 * CUSTOMER ROUTES
 */

// Create new order
router.post(
  "/",
  requireVerifiedEmail,
  create
);

// Get logged-in customer's orders
router.get(
  "/my-orders",
  requireVerifiedEmail,
  getMyOrders
);

/*
 * ADMIN ROUTES
 */

/*
 * Paginated admin orders.
 *
 * Examples:
 *
 * /api/orders/admin/all
 *
 * /api/orders/admin/all?page=2&limit=20
 *
 * /api/orders/admin/all?orderStatus=pending
 *
 * /api/orders/admin/all?paymentStatus=paid
 *
 * /api/orders/admin/all?search=john
 */
router.get(
  "/admin/all",
  adminOnly,
  getAll
);

// Get one order as admin
router.get(
  "/admin/:id",
  adminOnly,
  getAdminOrder
);

// Update order status
router.patch(
  "/admin/:id/status",
  adminOnly,
  updateStatus
);

/*
 * CUSTOMER:
 * GET SINGLE ORDER
 *
 * Keep this route after the admin routes
 * so "/admin/..." is handled correctly.
 */
router.get(
  "/:id",
  requireVerifiedEmail,
  getMyOrder
);

export default router;