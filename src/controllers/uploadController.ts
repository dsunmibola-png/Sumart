import type { Request, Response } from "express";
import { Readable } from "stream";

import cloudinary from "../config/cloudinary";

import User from "../models/User";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const uploadProductImage = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
      });
    }

    const uploadFromBuffer = () =>
      new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder: "sumart/products",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(
                  new Error(
                    "Cloudinary upload failed"
                  )
                );

                return;
              }

              resolve({
                secure_url:
                  result.secure_url,
                public_id:
                  result.public_id,
              });
            }
          );

        Readable.from(req.file!.buffer).pipe(
          stream
        );
      });

    const result =
      await uploadFromBuffer();

    return res.status(200).json({
      message: "Image uploaded successfully",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Image upload failed";

    return res.status(400).json({
      message,
    });
  }
};

export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const uploadFromBuffer = () =>
      new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder: "sumart/avatars",
              resource_type: "image",

              transformation: [
                {
                  width: 500,
                  height: 500,
                  crop: "fill",
                  gravity: "auto",
                },
                {
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              if (!result) {
                reject(
                  new Error(
                    "Cloudinary upload failed"
                  )
                );

                return;
              }

              resolve({
                secure_url:
                  result.secure_url,
                public_id:
                  result.public_id,
              });
            }
          );

        Readable.from(
          req.file!.buffer
        ).pipe(stream);
      });

    const result =
      await uploadFromBuffer();

    user.avatar = result.secure_url;

    await user.save();

    return res.status(200).json({
      message:
        "Profile photo updated successfully",

      avatar: result.secure_url,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(
      "Avatar upload failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Avatar upload failed";

    return res.status(400).json({
      message,
    });
  }
};