import { Router } from "express";

import {
  deleteProfile,
  getAllUsers,
  updateProfile,
} from "../controllers/userController";

import {
  protect,
} from "../middleware/authMiddleware";

import {
  adminOnly,
} from "../middleware/adminMiddleware";

const router = Router();

router.patch(
  "/profile",
  protect,
  updateProfile
);

router.delete(
  "/profile",
  protect,
  deleteProfile
);

router.get(
  "/",
  protect,
  adminOnly,
  getAllUsers
);

export default router;