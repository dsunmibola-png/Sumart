import { Router } from "express";

import {
  uploadAvatar,
  uploadProductImage,
} from "../controllers/uploadController";

import {
  upload,
} from "../middleware/uploadMiddleware";

import {
  protect,
} from "../middleware/authMiddleware";

import {
  adminOnly,
} from "../middleware/adminMiddleware";

const router = Router();

// ==========================================
// PRODUCT IMAGE
// Admin only
// ==========================================

router.post(
  "/product-image",
  protect,
  adminOnly,
  upload.single("image"),
  uploadProductImage
);

// ==========================================
// PROFILE AVATAR
// Any authenticated account
// ==========================================

router.post(
  "/avatar",
  protect,
  upload.single("image"),
  uploadAvatar
);

export default router;