import {
  Router,
} from "express";

import {
  getDashboard,
} from "../controllers/dashboardController";

import {
  protect,
} from "../middleware/authMiddleware";

import {
  adminOnly,
} from "../middleware/adminMiddleware";

const router = Router();

router.get(
  "/",
  protect,
  adminOnly,
  getDashboard
);

export default router;