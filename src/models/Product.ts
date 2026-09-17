import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  brand: string;
  ratings: number;
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [
        true,
        "Product name is required",
      ],
      trim: true,
      minlength: [
        2,
        "Product name must be at least 2 characters long",
      ],
      maxlength: [
        100,
        "Product name cannot exceed 100 characters",
      ],
    },

    description: {
      type: String,
      required: [
        true,
        "Product description is required",
      ],
      trim: true,
      minlength: [
        10,
        "Product description must be at least 10 characters long",
      ],
    },

    price: {
      type: Number,
      required: [
        true,
        "Product price is required",
      ],
      min: [
        0,
        "Product price cannot be negative",
      ],
    },

    category: {
      type: String,
      required: [
        true,
        "Product category is required",
      ],
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      required: [
        true,
        "Product stock is required",
      ],
      min: [
        0,
        "Product stock cannot be negative",
      ],
      default: 0,
    },

    brand: {
      type: String,
      required: [
        true,
        "Product brand is required",
      ],
      trim: true,
    },

    ratings: {
      type: Number,
      min: [
        0,
        "Rating cannot be below 0",
      ],
      max: [
        5,
        "Rating cannot exceed 5",
      ],
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * =====================================================
 * PRODUCT INDEXES
 * =====================================================
 */

/*
 * CATEGORY
 *
 * Speeds up queries such as:
 *
 * Product.find({
 *   category: "Electronics"
 * })
 *
 * Important for the Shop and Categories pages.
 */
productSchema.index({
  category: 1,
});

/*
 * CATEGORY + PRICE
 *
 * Useful when customers browse a category
 * and sort/filter products by price.
 *
 * Example:
 *
 * Product.find({
 *   category: "Electronics"
 * }).sort({
 *   price: 1
 * });
 */
productSchema.index({
  category: 1,
  price: 1,
});

/*
 * FEATURED PRODUCTS
 *
 * Helps the homepage quickly find
 * featured products.
 */
productSchema.index({
  isFeatured: 1,
});

/*
 * STOCK
 *
 * Used by the admin dashboard for:
 *
 * - Low stock products
 * - Out-of-stock products
 * - Inventory alerts
 *
 * Example:
 *
 * Product.find({
 *   stock: {
 *     $lte: 5
 *   }
 * })
 */
productSchema.index({
  stock: 1,
});

/*
 * NEWEST PRODUCTS
 *
 * Useful for sorting products by
 * recently created.
 */
productSchema.index({
  createdAt: -1,
});

/*
 * BRAND
 *
 * Useful for current/future brand
 * filtering.
 */
productSchema.index({
  brand: 1,
});

/*
 * PRODUCT SEARCH
 *
 * Creates a MongoDB text index for
 * searching product names,
 * descriptions and brands.
 *
 * Product names receive the highest
 * priority, followed by brands and
 * descriptions.
 */
productSchema.index(
  {
    name: "text",
    brand: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      brand: 5,
      description: 1,
    },
    name: "product_search_index",
  }
);

const Product = mongoose.model<IProduct>(
  "Product",
  productSchema
);

export default Product;