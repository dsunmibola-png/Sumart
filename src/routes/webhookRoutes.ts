import { Router } from "express";

import { paystackWebhook } from "../controllers/webhookController";

const router = Router();

router.post(
  "/paystack",
  paystackWebhook
);

export default router;