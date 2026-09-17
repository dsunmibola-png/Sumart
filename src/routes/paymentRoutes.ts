import { Router } from "express";

import {
  initialize,
  verify,
} from "../controllers/paymentController";

import {
  protect,
  requireVerifiedEmail,
} from "../middleware/authMiddleware";

const router = Router();

/*
 * Every payment route requires
 * authentication.
 */
router.use(protect);

/*
 * CUSTOMER PAYMENT ROUTES
 *
 * The customer must also have a
 * currently verified email address.
 */

// Initialize Paystack payment
router.post(
  "/initialize",
  requireVerifiedEmail,
  initialize
);

// Verify Paystack payment
router.get(
  "/verify/:reference",
  requireVerifiedEmail,
  verify
);

export default router;