import { Router } from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/productController";

import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/adminMiddleware";

const router = Router();

// Public routes
router.get("/", getAll);
router.get("/:id", getOne);

// Admin-only routes
router.post(
  "/",
  protect,
  adminOnly,
  create
);

router.put(
  "/:id",
  protect,
  adminOnly,
  update
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  remove
);

export default router;