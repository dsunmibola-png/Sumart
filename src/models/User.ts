import mongoose, {
  Document,
  Schema,
} from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatar?: string;

  // Email verification
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;

  // Password reset
  passwordResetCode?: string;
  passwordResetExpires?: Date;

  // JWT/session invalidation
  tokenVersion: number;

  comparePassword(
    candidatePassword: string
  ): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [
        true,
        "Name is required",
      ],
      trim: true,
      minlength: [
        2,
        "Name must be at least 2 characters long",
      ],
      maxlength: [
        50,
        "Name cannot exceed 50 characters",
      ],
    },

    email: {
      type: String,
      required: [
        true,
        "Email is required",
      ],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [
        true,
        "Password is required",
      ],
      minlength: [
        6,
        "Password must be at least 6 characters long",
      ],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // EMAIL VERIFICATION
    // ==========================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      default: undefined,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: undefined,
      select: false,
    },

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    passwordResetCode: {
      type: String,
      default: undefined,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: undefined,
      select: false,
    },

    // ==========================================
    // JWT / SESSION VERSION
    // ==========================================

    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// HASH PASSWORD BEFORE SAVING
// ==========================================

userSchema.pre(
  "save",
  async function () {
    if (
      !this.isModified("password")
    ) {
      return;
    }

    const salt =
      await bcrypt.genSalt(10);

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );
  }
);

// ==========================================
// COMPARE PASSWORD
// ==========================================

userSchema.methods.comparePassword =
  async function (
    candidatePassword: string
  ): Promise<boolean> {
    return bcrypt.compare(
      candidatePassword,
      this.password
    );
  };

const User =
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;