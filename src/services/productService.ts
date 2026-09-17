import Product from "../models/Product";

interface GetAllProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  inStock?: boolean;
}

export const createProduct = async (productData: {
  name: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  stock: number;
  brand: string;
  ratings?: number;
  isFeatured?: boolean;
}) => {
  const product = await Product.create(productData);

  return product;
};

export const getAllProducts = async ({
  page = 1,
  limit = 20,
  category,
  search,
  sort = "newest",
  featured,
  inStock,
}: GetAllProductsOptions = {}) => {
  const safePage = Math.max(
    1,
    Math.floor(page)
  );

  const safeLimit = Math.min(
    Math.max(
      1,
      Math.floor(limit)
    ),
    100
  );

  const skip =
    (safePage - 1) *
    safeLimit;

  const filter: Record<
    string,
    unknown
  > = {};

  // Category filter
  if (
    category &&
    category.trim()
  ) {
    filter.category =
      category.trim();
  }

  // Featured filter
  if (
    typeof featured ===
    "boolean"
  ) {
    filter.isFeatured =
      featured;
  }

  // Only products currently in stock
  if (inStock) {
    filter.stock = {
      $gt: 0,
    };
  }

  // Product search
  if (
    search &&
    search.trim()
  ) {
    const searchValue =
      search.trim();

    filter.$text = {
      $search:
        searchValue,
    };
  }

  let sortOption: Record<
    string,
    1 | -1
  >;

  switch (sort) {
    case "featured":
      sortOption = {
        isFeatured: -1,
        ratings: -1,
        createdAt: -1,
      };
      break;

    case "price-low":
      sortOption = {
        price: 1,
        createdAt: -1,
      };
      break;

    case "price-high":
      sortOption = {
        price: -1,
        createdAt: -1,
      };
      break;

    case "rating":
      sortOption = {
        ratings: -1,
        createdAt: -1,
      };
      break;

    case "oldest":
      sortOption = {
        createdAt: 1,
      };
      break;

    case "newest":
    default:
      sortOption = {
        createdAt: -1,
      };
      break;
  }

  const [
    products,
    totalProducts,
  ] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(safeLimit),

    Product.countDocuments(
      filter
    ),
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalProducts /
          safeLimit
      )
    );

  return {
    products,

    pagination: {
      page:
        safePage,

      limit:
        safeLimit,

      totalProducts,

      totalPages,

      hasNextPage:
        safePage <
        totalPages,

      hasPreviousPage:
        safePage > 1,
    },
  };
};

export const getProductById =
  async (
    productId: string
  ) => {
    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    return product;
  };

export const updateProduct =
  async (
    productId: string,

    productData: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      images: string[];
      stock: number;
      brand: string;
      ratings: number;
      isFeatured: boolean;
    }>
  ) => {
    const product =
      await Product.findByIdAndUpdate(
        productId,
        productData,
        {
         returnDocument: "after",
          runValidators: true,
        }
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    return product;
  };

export const deleteProduct =
  async (
    productId: string
  ) => {
    const product =
      await Product.findByIdAndDelete(
        productId
      );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    return product;
  };