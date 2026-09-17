import {
  Request,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";

import User from "../models/User";

export interface AuthenticatedRequest
  extends Request {
  userId?: string;
}

// ==========================================
// PROTECT
// Valid JWT + valid token version required
// ==========================================

export const protect =
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // ======================================
      // GET AUTHORIZATION HEADER
      // ======================================

      const authHeader =
        req.headers.authorization;

      if (
        !authHeader ||
        !authHeader.startsWith(
          "Bearer "
        )
      ) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized. No token provided.",
          });
      }

      // ======================================
      // EXTRACT TOKEN
      // ======================================

      const token =
        authHeader.split(" ")[1];

      if (!token) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized. No token provided.",
          });
      }

      const secret =
        process.env.JWT_SECRET;

      if (!secret) {
        throw new Error(
          "JWT_SECRET is not defined"
        );
      }

      // ======================================
      // VERIFY JWT
      // ======================================

      const decoded =
        jwt.verify(
          token,
          secret
        ) as {
          userId: string;
          tokenVersion?: number;
        };

      if (!decoded.userId) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized. Invalid token.",
          });
      }

      // ======================================
      // CHECK CURRENT USER + TOKEN VERSION
      // ======================================

      const user =
        await User.findById(
          decoded.userId
        ).select(
          "tokenVersion"
        );

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

      /*
       * Older SUMART accounts may not
       * physically have tokenVersion
       * stored in MongoDB yet.
       *
       * Treat those as version 0.
       */
      const currentTokenVersion =
        user.tokenVersion ?? 0;

      /*
       * Existing JWTs created before we
       * introduced tokenVersion also
       * won't contain the claim.
       *
       * Treat those as version 0.
       */
      const jwtTokenVersion =
        decoded.tokenVersion ?? 0;

      if (
        jwtTokenVersion !==
        currentTokenVersion
      ) {
        return res
          .status(401)
          .json({
            message:
              "Your session is no longer valid. Please sign in again.",
            code:
              "SESSION_INVALIDATED",
          });
      }

      // ======================================
      // ATTACH AUTHENTICATED USER ID
      // ======================================

      req.userId =
        decoded.userId;

      next();
    } catch (error) {
      return res
        .status(401)
        .json({
          message:
            "Not authorized. Invalid or expired token.",
        });
    }
  };

// ==========================================
// REQUIRE VERIFIED EMAIL
//
// Must be used AFTER protect.
// ==========================================

export const requireVerifiedEmail =
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
              "Not authorized.",
          });
      }

      const user =
        await User.findById(
          req.userId
        ).select(
          "isEmailVerified"
        );

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
        !user.isEmailVerified
      ) {
        return res
          .status(403)
          .json({
            message:
              "Please verify your email address to continue.",
            code:
              "EMAIL_NOT_VERIFIED",
          });
      }

      next();
    } catch (error) {
      console.error(
        "Failed to check email verification:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to verify account status.",
        });
    }
  };