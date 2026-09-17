import { Request, Response } from "express";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/productService";

// Create a product
export const create = async (
  req: Request,
  res: Response
) => {
  try {
    const product =
      await createProduct(
        req.body
      );

    return res
      .status(201)
      .json({
        message:
          "Product created successfully",

        product,
      });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product";

    return res
      .status(400)
      .json({
        message,
      });
  }
};

// Get paginated products
export const getAll = async (
  req: Request,
  res: Response
) => {
  try {
    const pageValue =
      Number(
        req.query.page
      );

    const limitValue =
      Number(
        req.query.limit
      );

    const page =
      Number.isFinite(
        pageValue
      ) &&
      pageValue > 0
        ? Math.floor(
            pageValue
          )
        : 1;

    const limit =
      Number.isFinite(
        limitValue
      ) &&
      limitValue > 0
        ? Math.floor(
            limitValue
          )
        : 20;

    const category =
      typeof req.query
        .category ===
      "string"
        ? req.query.category
        : undefined;

    const search =
      typeof req.query
        .search ===
      "string"
        ? req.query.search
        : undefined;

    const sort =
      typeof req.query
        .sort ===
      "string"
        ? req.query.sort
        : "newest";

    const featured =
      typeof req.query
        .featured ===
      "string"
        ? req.query.featured ===
          "true"
        : undefined;

    const inStock =
      typeof req.query
        .inStock ===
      "string"
        ? req.query.inStock ===
          "true"
        : undefined;

    const result =
      await getAllProducts({
        page,
        limit,
        category,
        search,
        sort,
        featured,
        inStock,
      });

    return res
      .status(200)
      .json({
        products:
          result.products,

        pagination:
          result.pagination,
      });
  } catch (error) {
    console.error(
      "Failed to fetch products:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Failed to fetch products",
      });
  }
};

// Get a single product
export const getOne =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const productId =
        String(
          req.params.id
        );

      const product =
        await getProductById(
          productId
        );

      return res
        .status(200)
        .json({
          product,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Product not found";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };

// Update a product
export const update =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const productId =
        String(
          req.params.id
        );

      const product =
        await updateProduct(
          productId,
          req.body
        );

      return res
        .status(200)
        .json({
          message:
            "Product updated successfully",

          product,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update product";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };

// Delete a product
export const remove =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const productId =
        String(
          req.params.id
        );

      await deleteProduct(
        productId
      );

      return res
        .status(200)
        .json({
          message:
            "Product deleted successfully",
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete product";

      return res
        .status(404)
        .json({
          message,
        });
    }
  };