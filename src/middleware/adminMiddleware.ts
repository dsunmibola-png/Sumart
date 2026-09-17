import {
  Request,
  Response,
  NextFunction,
} from "express";

import User from "../models/User";

interface AuthenticatedRequest
  extends Request {
  userId?: string;
}

export const adminOnly =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
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

      // Only fetch the field required
      // for this authorization check.
      const user =
        await User.findById(
          req.userId
        ).select("role");

      if (!user) {
        return res
          .status(401)
          .json({
            message:
              "Account no longer exists.",
            code:
              "ACCOUNT_NOT_FOUND",
          });
      }

      if (
        user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({
            message:
              "Access denied. Admins only.",
          });
      }

      next();
    } catch (error) {
      console.error(
        "Failed to verify admin access:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to verify admin access",
        });
    }
  };