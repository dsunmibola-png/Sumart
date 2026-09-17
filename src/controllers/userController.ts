import {
  Request,
  Response,
} from "express";
import crypto from "crypto";

import User from "../models/User";
import {
  deleteUserAccount,
  getUsers,
} from "../services/userService";
import { queueEmail } from "../queues/emailQueue";

interface AuthenticatedRequest
  extends Request {
  userId?: string;
}

const VERIFICATION_CODE_EXPIRY_MINUTES =
  15;

// ==========================================
// HELPERS
// ==========================================

const generateVerificationCode =
  () => {
    return crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();
  };

const hashVerificationCode = (
  code: string
) => {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
};

const getVerificationExpiry =
  () => {
    return new Date(
      Date.now() +
        VERIFICATION_CODE_EXPIRY_MINUTES *
          60 *
          1000
    );
  };

const queueVerificationEmail =
  async (
    email: string,
    code: string
  ) => {
    await queueEmail({
      to: email,

      subject:
        "Verify your new SUMART email address",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 560px;
            margin: 0 auto;
            padding: 32px;
            color: #0f172a;
          "
        >
          <div
            style="
              background: #16a34a;
              padding: 24px;
              border-radius: 16px 16px 0 0;
              text-align: center;
            "
          >
            <h1
              style="
                color: #ffffff;
                margin: 0;
                font-size: 28px;
              "
            >
              SUMART
            </h1>
          </div>

          <div
            style="
              border: 1px solid #e2e8f0;
              border-top: 0;
              padding: 32px;
              border-radius: 0 0 16px 16px;
            "
          >
            <h2
              style="
                margin-top: 0;
                color: #0f172a;
              "
            >
              Verify your new email
            </h2>

            <p
              style="
                color: #475569;
                line-height: 1.6;
              "
            >
              You recently changed the
              email address on your SUMART
              account.
            </p>

            <p
              style="
                color: #475569;
                line-height: 1.6;
              "
            >
              Use the verification code
              below to confirm your new
              email address.
            </p>

            <div
              style="
                margin: 28px 0;
                padding: 20px;
                background: #f0fdf4;
                border-radius: 12px;
                text-align: center;
              "
            >
              <div
                style="
                  font-size: 32px;
                  font-weight: 700;
                  letter-spacing: 8px;
                  color: #16a34a;
                "
              >
                ${code}
              </div>
            </div>

            <p
              style="
                color: #64748b;
                font-size: 14px;
                line-height: 1.6;
              "
            >
              This code expires in
              ${VERIFICATION_CODE_EXPIRY_MINUTES}
              minutes.
            </p>

            <p
              style="
                color: #64748b;
                font-size: 14px;
                line-height: 1.6;
              "
            >
              If you did not make this
              change, please contact
              support.
            </p>
          </div>
        </div>
      `,
    });
  };

// ==========================================
// GET ALL USERS
// Admin only
// ==========================================

export const getAllUsers =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const pageValue =
        Number(req.query.page);

      const limitValue =
        Number(
          req.query.limit
        );

      const page =
        Number.isFinite(
          pageValue
        ) && pageValue > 0
          ? Math.floor(
              pageValue
            )
          : 1;

      const limit =
        Number.isFinite(
          limitValue
        ) && limitValue > 0
          ? Math.floor(
              limitValue
            )
          : 20;

      const search =
        typeof req.query
          .search === "string"
          ? req.query.search
          : undefined;

      const result =
        await getUsers({
          page,
          limit,
          search,
        });

      return res
        .status(200)
        .json({
          users:
            result.users,

          pagination:
            result.pagination,
        });
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to fetch users",
        });
    }
  };

// ==========================================
// UPDATE PROFILE
// Logged-in user only
// ==========================================

export const updateProfile =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized.",
          });
      }

      const {
        name,
        email,
      } = req.body;

      if (
        typeof name !==
          "string" ||
        typeof email !==
          "string"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Name and email are required.",
          });
      }

      const cleanName =
        name.trim();

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      // ======================================
      // VALIDATE NAME
      // ======================================

      if (
        cleanName.length <
          2 ||
        cleanName.length >
          50
      ) {
        return res
          .status(400)
          .json({
            message:
              "Name must be between 2 and 50 characters.",
          });
      }

      // ======================================
      // VALIDATE EMAIL
      // ======================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          cleanEmail
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Please enter a valid email address.",
          });
      }

      // ======================================
      // FIND CURRENT USER
      // ======================================

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res
          .status(404)
          .json({
            message:
              "User not found.",
          });
      }

      const emailChanged =
        cleanEmail !==
        user.email;

      // ======================================
      // NAME-ONLY UPDATE
      // ======================================

      if (!emailChanged) {
        user.name =
          cleanName;

        await user.save();

        return res
          .status(200)
          .json({
            message:
              "Profile updated successfully.",

            requiresEmailVerification:
              false,

            user: {
              id: user._id.toString(),
              name: user.name,
              email:
                user.email,
              role: user.role,
              avatar:
                user.avatar ??
                "",
              isEmailVerified:
                user.isEmailVerified,
            },
          });
      }

      // ======================================
      // CHECK NEW EMAIL
      // ======================================

      const emailExists =
        await User.findOne({
          email:
            cleanEmail,

          _id: {
            $ne: user._id,
          },
        });

      if (emailExists) {
        return res
          .status(409)
          .json({
            message:
              "An account with this email already exists.",
          });
      }

      // ======================================
      // CREATE VERIFICATION CODE
      // ======================================

      const verificationCode =
        generateVerificationCode();

      const hashedCode =
        hashVerificationCode(
          verificationCode
        );

      const verificationExpiry =
        getVerificationExpiry();

      /*
       * Queue the email BEFORE changing
       * the user's account.
       *
       * If Redis/BullMQ cannot accept
       * the email job, their existing
       * verified email stays untouched.
       */
      await queueVerificationEmail(
        cleanEmail,
        verificationCode
      );

      // ======================================
      // CHANGE EMAIL
      // ======================================

      user.name =
        cleanName;

      user.email =
        cleanEmail;

      user.isEmailVerified =
        false;

      user.emailVerificationCode =
        hashedCode;

      user.emailVerificationExpires =
        verificationExpiry;

      await user.save();

      return res
        .status(200)
        .json({
          message:
            "Profile updated. Please verify your new email address.",

          requiresEmailVerification:
            true,

          verificationEmail:
            cleanEmail,

          user: {
            id: user._id.toString(),
            name: user.name,
            email:
              user.email,
            role: user.role,
            avatar:
              user.avatar ??
              "",
            isEmailVerified:
              user.isEmailVerified,
          },
        });
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update profile.",
        });
    }
  };

// ==========================================
// DELETE PROFILE
// Logged-in customer only
// Requires current password
// ==========================================

export const deleteProfile =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res
          .status(401)
          .json({
            message:
              "Not authorized.",
          });
      }

      const { password } =
        req.body;

      if (
        typeof password !==
          "string" ||
        !password.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              "Your current password is required.",
          });
      }

      const result =
        await deleteUserAccount(
          userId,
          password
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete account";

      if (
        message ===
        "User not found"
      ) {
        return res
          .status(404)
          .json({
            message,
          });
      }

      if (
        message ===
        "Incorrect password"
      ) {
        return res
          .status(401)
          .json({
            message,
          });
      }

      if (
        message ===
        "Admin accounts cannot be deleted from this page"
      ) {
        return res
          .status(403)
          .json({
            message,
          });
      }

      console.error(
        "Failed to delete account:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete account.",
        });
    }
  };