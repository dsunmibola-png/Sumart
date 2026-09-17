import { Router } from "express";

import {
  register,
  login,
  getMe,
  resendVerificationEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

import {
  protect,
} from "../middleware/authMiddleware";

import {
  adminOnly,
} from "../middleware/adminMiddleware";

const router = Router();

/*
 * ==========================================
 * AUTHENTICATION
 * ==========================================
 */

// Register
router.post(
  "/register",
  register
);

// Login
router.post(
  "/login",
  login
);

/*
 * ==========================================
 * EMAIL VERIFICATION
 * ==========================================
 */

// Verify email
router.post(
  "/verify-email",
  verifyEmail
);

// Resend verification code
router.post(
  "/resend-verification",
  resendVerificationEmail
);

/*
 * ==========================================
 * PASSWORD RECOVERY
 * ==========================================
 */

// Request password reset code
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset password using code
router.post(
  "/reset-password",
  resetPassword
);

/*
 * ==========================================
 * CURRENT USER
 * ==========================================
 */

router.get(
  "/me",
  protect,
  getMe
);

/*
 * ==========================================
 * ADMIN TEST
 * ==========================================
 */

router.get(
  "/admin-test",
  protect,
  adminOnly,
  (_req, res) => {
    res.status(200).json({
      message:
        "Welcome Admin! 👑",
    });
  }
);

export default router;