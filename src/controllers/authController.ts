import User from "../models/User";

import {
  Request,
  Response,
} from "express";

import {
  loginUser,
  registerUser,
  resendVerificationCode,
  verifyUserEmail,
  requestPasswordReset,
  resetUserPassword,
} from "../services/authService";

// ==========================================
// REGISTER
// ==========================================

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    const result =
      await registerUser(
        name,
        email,
        password
      );

    return res
      .status(201)
      .json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    return res.status(400).json({
      message,
    });
  }
};

// ==========================================
// VERIFY EMAIL
// ==========================================

export const verifyEmail = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      code,
    } = req.body;

    if (
      typeof email !== "string" ||
      typeof code !== "string" ||
      !email.trim() ||
      !code.trim()
    ) {
      return res.status(400).json({
        message:
          "Email and verification code are required",
      });
    }

    const result =
      await verifyUserEmail(
        email,
        code
      );

    return res
      .status(200)
      .json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify email";

    return res.status(400).json({
      message,
    });
  }
};

// ==========================================
// RESEND VERIFICATION CODE
// ==========================================

export const resendVerificationEmail =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
      } = req.body;

      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          message:
            "Email address is required",
        });
      }

      const result =
        await resendVerificationCode(
          email
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to resend verification code";

      return res.status(400).json({
        message,
      });
    }
  };

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
      } = req.body;

      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          message:
            "Email address is required",
        });
      }

      const result =
        await requestPasswordReset(
          email
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      /*
       * Don't expose internal queue,
       * database or account information.
       */
      console.error(
        "Forgot password error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to process password reset request. Please try again later.",
      });
    }
  };

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        email,
        code,
        newPassword,
      } = req.body;

      if (
        typeof email !== "string" ||
        typeof code !== "string" ||
        typeof newPassword !==
          "string" ||
        !email.trim() ||
        !code.trim() ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Email, reset code and new password are required",
        });
      }

      if (
        !/^\d{6}$/.test(
          code.trim()
        )
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid 6-digit reset code",
        });
      }

      if (
        newPassword.length < 6
      ) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters long",
        });
      }

      const result =
        await resetUserPassword(
          email,
          code,
          newPassword
        );

      return res
        .status(200)
        .json(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to reset password";

      return res.status(400).json({
        message,
      });
    }
  };

// ==========================================
// LOGIN
// ==========================================

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const result =
      await loginUser(
        email,
        password
      );

    return res.status(200).json({
      message:
        "Login successful",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong";

    /*
     * Give the frontend a stable
     * machine-readable error code.
     */
    const errorCode =
      error instanceof Error &&
      "code" in error &&
      typeof error.code ===
        "string"
        ? error.code
        : undefined;

    if (
      errorCode ===
      "EMAIL_NOT_VERIFIED"
    ) {
      return res.status(403).json({
        message,
        code:
          "EMAIL_NOT_VERIFIED",
      });
    }

    return res.status(401).json({
      message,
    });
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================

export const getMe = async (
  req: Request & {
    userId?: string;
  },
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          "Not authorized",
      });
    }

    const user =
      await User.findById(
        req.userId
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    return res.status(200).json({
      user: {
        id:
          user._id.toString(),

        name:
          user.name,

        email:
          user.email,

        role:
          user.role,

        avatar:
          user.avatar ?? "",

        isEmailVerified:
          user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(
      "Failed to get user:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to get user",
    });
  }
};