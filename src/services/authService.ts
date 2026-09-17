import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User";
import { queueEmail } from "../queues/emailQueue";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const PASSWORD_RESET_EXPIRY_MINUTES = 15;

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (
  userId: string,
  tokenVersion: number
) => {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not defined"
    );
  }

  return jwt.sign(
    {
      userId,
      tokenVersion,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};

// ==========================================
// GENERATE 6-DIGIT CODE
// ==========================================

const generateVerificationCode =
  (): string => {
    return crypto
      .randomInt(
        100000,
        1000000
      )
      .toString();
  };

// ==========================================
// HASH CODE
// ==========================================

const hashVerificationCode = (
  code: string
): string => {
  return crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
};

// ==========================================
// COMPARE HASHED CODES
// ==========================================

const compareHashedCodes = (
  storedCodeHash: string,
  submittedCode: string
): boolean => {
  const submittedCodeHash =
    hashVerificationCode(
      submittedCode
    );

  const storedHash =
    Buffer.from(
      storedCodeHash,
      "hex"
    );

  const submittedHash =
    Buffer.from(
      submittedCodeHash,
      "hex"
    );

  return (
    storedHash.length ===
      submittedHash.length &&
    crypto.timingSafeEqual(
      storedHash,
      submittedHash
    )
  );
};

// ==========================================
// QUEUE VERIFICATION EMAIL
// ==========================================

const sendVerificationEmail =
  async (
    name: string,
    email: string,
    code: string
  ) => {
    await queueEmail({
      to: email,

      subject:
        "Verify your SUMART email",

      html: `
        <div
          style="
            margin: 0;
            padding: 40px 20px;
            background-color: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
          "
        >
          <div
            style="
              max-width: 560px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              overflow: hidden;
            "
          >
            <div
              style="
                padding: 28px 32px;
                background-color: #16a34a;
                color: #ffffff;
              "
            >
              <div
                style="
                  font-size: 24px;
                  font-weight: 700;
                "
              >
                SUMART
              </div>

              <div
                style="
                  margin-top: 6px;
                  font-size: 14px;
                  color: #dcfce7;
                "
              >
                Smart Shopping Starts Here
              </div>
            </div>

            <div
              style="
                padding: 32px;
              "
            >
              <h1
                style="
                  margin: 0;
                  font-size: 24px;
                  line-height: 32px;
                "
              >
                Verify your email
              </h1>

              <p
                style="
                  margin: 20px 0 0;
                  font-size: 15px;
                  line-height: 24px;
                  color: #475569;
                "
              >
                Hi ${name},
              </p>

              <p
                style="
                  margin: 10px 0 0;
                  font-size: 15px;
                  line-height: 24px;
                  color: #475569;
                "
              >
                Thanks for creating a SUMART
                account. Enter the verification
                code below to confirm your email
                address.
              </p>

              <div
                style="
                  margin: 28px 0;
                  padding: 22px;
                  border-radius: 14px;
                  background-color: #f0fdf4;
                  text-align: center;
                "
              >
                <div
                  style="
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: #16a34a;
                    text-transform: uppercase;
                  "
                >
                  Verification Code
                </div>

                <div
                  style="
                    font-size: 34px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    color: #15803d;
                  "
                >
                  ${code}
                </div>
              </div>

              <p
                style="
                  margin: 0;
                  font-size: 14px;
                  line-height: 22px;
                  color: #64748b;
                "
              >
                This code expires in
                ${VERIFICATION_CODE_EXPIRY_MINUTES}
                minutes.
              </p>

              <p
                style="
                  margin: 16px 0 0;
                  font-size: 14px;
                  line-height: 22px;
                  color: #64748b;
                "
              >
                If you didn't create this
                SUMART account, you can safely
                ignore this email.
              </p>
            </div>

            <div
              style="
                border-top: 1px solid #e2e8f0;
                padding: 20px 32px;
                font-size: 12px;
                color: #94a3b8;
              "
            >
              © SUMART
            </div>
          </div>
        </div>
      `,
    });
  };

// ==========================================
// QUEUE PASSWORD RESET EMAIL
// ==========================================

const sendPasswordResetEmail =
  async (
    name: string,
    email: string,
    code: string
  ) => {
    await queueEmail({
      to: email,

      subject:
        "Reset your SUMART password",

      html: `
        <div
          style="
            margin: 0;
            padding: 40px 20px;
            background-color: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
          "
        >
          <div
            style="
              max-width: 560px;
              margin: 0 auto;
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              overflow: hidden;
            "
          >
            <div
              style="
                padding: 28px 32px;
                background-color: #16a34a;
                color: #ffffff;
              "
            >
              <div
                style="
                  font-size: 24px;
                  font-weight: 700;
                "
              >
                SUMART
              </div>

              <div
                style="
                  margin-top: 6px;
                  font-size: 14px;
                  color: #dcfce7;
                "
              >
                Smart Shopping Starts Here
              </div>
            </div>

            <div
              style="
                padding: 32px;
              "
            >
              <h1
                style="
                  margin: 0;
                  font-size: 24px;
                  line-height: 32px;
                "
              >
                Reset your password
              </h1>

              <p
                style="
                  margin: 20px 0 0;
                  font-size: 15px;
                  line-height: 24px;
                  color: #475569;
                "
              >
                Hi ${name},
              </p>

              <p
                style="
                  margin: 10px 0 0;
                  font-size: 15px;
                  line-height: 24px;
                  color: #475569;
                "
              >
                We received a request to reset
                the password for your SUMART
                account. Enter the code below
                to choose a new password.
              </p>

              <div
                style="
                  margin: 28px 0;
                  padding: 22px;
                  border-radius: 14px;
                  background-color: #f0fdf4;
                  text-align: center;
                "
              >
                <div
                  style="
                    margin-bottom: 8px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: #16a34a;
                    text-transform: uppercase;
                  "
                >
                  Password Reset Code
                </div>

                <div
                  style="
                    font-size: 34px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    color: #15803d;
                  "
                >
                  ${code}
                </div>
              </div>

              <p
                style="
                  margin: 0;
                  font-size: 14px;
                  line-height: 22px;
                  color: #64748b;
                "
              >
                This code expires in
                ${PASSWORD_RESET_EXPIRY_MINUTES}
                minutes.
              </p>

              <p
                style="
                  margin: 16px 0 0;
                  font-size: 14px;
                  line-height: 22px;
                  color: #64748b;
                "
              >
                If you didn't request a
                password reset, you can safely
                ignore this email. Your
                password will remain unchanged.
              </p>
            </div>

            <div
              style="
                border-top: 1px solid #e2e8f0;
                padding: 20px 32px;
                font-size: 12px;
                color: #94a3b8;
              "
            >
              © SUMART
            </div>
          </div>
        </div>
      `,
    });
  };

// ==========================================
// REGISTER USER
// ==========================================

export const registerUser =
  async (
    name: string,
    email: string,
    password: string
  ) => {
    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      throw new Error(
        "User with this email already exists"
      );
    }

    const verificationCode =
      generateVerificationCode();

    const hashedCode =
      hashVerificationCode(
        verificationCode
      );

    const verificationExpires =
      new Date(
        Date.now() +
          VERIFICATION_CODE_EXPIRY_MINUTES *
            60 *
            1000
      );

    const user =
      await User.create({
        name: cleanName,
        email: cleanEmail,
        password,

        isEmailVerified: false,

        emailVerificationCode:
          hashedCode,

        emailVerificationExpires:
          verificationExpires,

        tokenVersion: 0,
      });

    try {
      await sendVerificationEmail(
        user.name,
        user.email,
        verificationCode
      );
    } catch (error) {
      await User.findByIdAndDelete(
        user._id
      );

      throw error;
    }

    return {
      message:
        "Account created. Please check your email for your verification code.",

      email: user.email,

      requiresEmailVerification:
        true,
    };
  };

// ==========================================
// VERIFY USER EMAIL
// ==========================================

export const verifyUserEmail =
  async (
    email: string,
    code: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const cleanCode =
      code.trim();

    if (
      !/^\d{6}$/.test(
        cleanCode
      )
    ) {
      throw new Error(
        "Please enter a valid 6-digit verification code"
      );
    }

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+emailVerificationCode +emailVerificationExpires"
      );

    if (!user) {
      throw new Error(
        "Account not found"
      );
    }

    if (
      user.isEmailVerified
    ) {
      return {
        message:
          "Your email is already verified. You can sign in.",
      };
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires
    ) {
      throw new Error(
        "No active verification code found. Please request a new code."
      );
    }

    if (
      user.emailVerificationExpires.getTime() <
      Date.now()
    ) {
      throw new Error(
        "Verification code has expired. Please request a new code."
      );
    }

    const codeMatches =
      compareHashedCodes(
        user.emailVerificationCode,
        cleanCode
      );

    if (!codeMatches) {
      throw new Error(
        "Invalid verification code"
      );
    }

    user.isEmailVerified =
      true;

    user.emailVerificationCode =
      undefined;

    user.emailVerificationExpires =
      undefined;

    await user.save();

    return {
      message:
        "Email verified successfully. You can now sign in.",
    };
  };

// ==========================================
// RESEND VERIFICATION CODE
// ==========================================

export const resendVerificationCode =
  async (
    email: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+emailVerificationCode +emailVerificationExpires"
      );

    if (!user) {
      throw new Error(
        "Account not found"
      );
    }

    if (
      user.isEmailVerified
    ) {
      throw new Error(
        "This email is already verified"
      );
    }

    const verificationCode =
      generateVerificationCode();

    const hashedCode =
      hashVerificationCode(
        verificationCode
      );

    const verificationExpires =
      new Date(
        Date.now() +
          VERIFICATION_CODE_EXPIRY_MINUTES *
            60 *
            1000
      );

    /*
     * Queue first so a temporary queue
     * failure does not invalidate the
     * previous verification code.
     */
    await sendVerificationEmail(
      user.name,
      user.email,
      verificationCode
    );

    user.emailVerificationCode =
      hashedCode;

    user.emailVerificationExpires =
      verificationExpires;

    await user.save();

    return {
      message:
        "A new verification code has been sent to your email.",

      email: user.email,
    };
  };

// ==========================================
// REQUEST PASSWORD RESET
// ==========================================

export const requestPasswordReset =
  async (
    email: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    /*
     * Always use the same public response
     * whether the account exists or not.
     */
    const response = {
      message:
        "If an account exists for this email, password reset instructions have been sent.",
    };

    if (!cleanEmail) {
      return response;
    }

    const user =
      await User.findOne({
        email: cleanEmail,
      });

    if (!user) {
      return response;
    }

    const resetCode =
      generateVerificationCode();

    const hashedCode =
      hashVerificationCode(
        resetCode
      );

    const resetExpires =
      new Date(
        Date.now() +
          PASSWORD_RESET_EXPIRY_MINUTES *
            60 *
            1000
      );

    /*
     * Queue before replacing an existing
     * reset code.
     */
    await sendPasswordResetEmail(
      user.name,
      user.email,
      resetCode
    );

    user.passwordResetCode =
      hashedCode;

    user.passwordResetExpires =
      resetExpires;

    await user.save();

    return response;
  };

// ==========================================
// RESET USER PASSWORD
// ==========================================

export const resetUserPassword =
  async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const cleanCode =
      code.trim();

    if (
      !/^\d{6}$/.test(
        cleanCode
      )
    ) {
      throw new Error(
        "Please enter a valid 6-digit reset code"
      );
    }

    if (
      typeof newPassword !==
        "string" ||
      newPassword.length < 6
    ) {
      throw new Error(
        "Password must be at least 6 characters long"
      );
    }

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+passwordResetCode +passwordResetExpires"
      );

    if (
      !user ||
      !user.passwordResetCode ||
      !user.passwordResetExpires
    ) {
      throw new Error(
        "Invalid or expired password reset code"
      );
    }

    // ======================================
    // CHECK EXPIRY
    // ======================================

    if (
      user.passwordResetExpires.getTime() <
      Date.now()
    ) {
      user.passwordResetCode =
        undefined;

      user.passwordResetExpires =
        undefined;

      await user.save();

      throw new Error(
        "Password reset code has expired. Please request a new code."
      );
    }

    // ======================================
    // CHECK RESET CODE
    // ======================================

    const codeMatches =
      compareHashedCodes(
        user.passwordResetCode,
        cleanCode
      );

    if (!codeMatches) {
      throw new Error(
        "Invalid or expired password reset code"
      );
    }

    // ======================================
    // CHANGE PASSWORD
    // ======================================

    /*
     * Do not hash the password here.
     *
     * User.ts automatically hashes
     * modified passwords before save.
     */
    user.password =
      newPassword;

    // Reset codes are single-use.
    user.passwordResetCode =
      undefined;

    user.passwordResetExpires =
      undefined;

    // ======================================
    // INVALIDATE EXISTING JWTs
    // ======================================

    /*
     * Every JWT issued before this reset
     * contains the previous tokenVersion.
     *
     * Incrementing it invalidates all
     * previously issued sessions once
     * protect checks the version.
     */
    user.tokenVersion =
      (user.tokenVersion ?? 0) + 1;

    await user.save();

    return {
      message:
        "Password reset successfully. You can now sign in with your new password.",
    };
  };

// ==========================================
// LOGIN USER
// ==========================================

export const loginUser =
  async (
    email: string,
    password: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: cleanEmail,
      });

    if (!user) {
      throw new Error(
        "Invalid email or password"
      );
    }

    const isPasswordValid =
      await user.comparePassword(
        password
      );

    if (!isPasswordValid) {
      throw new Error(
        "Invalid email or password"
      );
    }

    if (
      !user.isEmailVerified
    ) {
      const error =
        new Error(
          "Please verify your email before signing in."
        ) as Error & {
          code?: string;
        };

      error.code =
        "EMAIL_NOT_VERIFIED";

      throw error;
    }

    // ======================================
    // GENERATE VERSIONED JWT
    // ======================================

    const token =
      generateToken(
        user._id.toString(),
        user.tokenVersion ?? 0
      );

    return {
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

      token,
    };
  };