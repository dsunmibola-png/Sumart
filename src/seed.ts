import dotenv from "dotenv";
import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

dotenv.config();

import { connectDB } from "./config/db";
import Product from "./models/Product";
import cloudinary from "./config/cloudinary";

interface DummyProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail: string;
  images: string[];
}

interface DummyProductResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

/*
 * Approximate USD -> NGN conversion for demo data.
 *
 * We're not using a live FX rate here because these are
 * seeded demo/store prices, not financial transactions.
 */
const USD_TO_NGN = 1500;

/*
 * Minimum number of products we want in SUMART.
 */
const TARGET_PRODUCT_COUNT = 210;

/*
 * Cloudinary folder.
 */
const CLOUDINARY_FOLDER =
  "sumart/products/seeded";

/*
 * Convert DummyJSON category names into nicer
 * storefront category labels.
 */
const formatCategory = (
  category: string
) => {
  return category
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

/*
 * Convert a source price into a cleaner NGN price.
 */
const convertPriceToNaira = (
  price: number
) => {
  const nairaPrice =
    price * USD_TO_NGN;

  /*
   * Round to nearest ₦500 to make seeded prices
   * look more realistic.
   */
  return (
    Math.round(
      nairaPrice / 500
    ) * 500
  );
};

/*
 * Upload a remote product image to Cloudinary.
 */
const uploadImageToCloudinary =
  async (
    imageUrl: string,
    productId: number,
    imageIndex: number
  ) => {
    const result =
      await cloudinary.uploader.upload(
        imageUrl,
        {
          folder:
            CLOUDINARY_FOLDER,

          public_id:
            `product-${productId}-${imageIndex}`,

          overwrite: true,

          resource_type:
            "image",

          transformation: [
            {
              width: 1000,
              height: 1000,
              crop: "fit",
            },

            {
              quality: "auto",
            },

            {
              fetch_format: "auto",
            },
          ],
        }
      );

    return result.secure_url;
  };

/*
 * Upload product images.
 *
 * To keep the seed process reasonable, we upload
 * a maximum of 2 images per product.
 */
const uploadProductImages =
  async (
    product: DummyProduct
  ) => {
    const sourceImages =
      product.images?.length > 0
        ? product.images.slice(0, 2)
        : [product.thumbnail];

    const uploadedImages:
      string[] = [];

    for (
      let index = 0;
      index <
      sourceImages.length;
      index++
    ) {
      const imageUrl =
        sourceImages[index];

      try {
        console.log(
          `☁️ Uploading image ${
            index + 1
          }/${sourceImages.length} for ${product.title}`
        );

        const cloudinaryUrl =
          await uploadImageToCloudinary(
            imageUrl,
            product.id,
            index
          );

        uploadedImages.push(
          cloudinaryUrl
        );
      } catch (error) {
        console.error(
          `⚠️ Image upload failed for "${product.title}":`,
          error
        );
      }
    }

    /*
     * If every Cloudinary upload failed,
     * fall back to the original remote image.
     */
    if (
      uploadedImages.length === 0
    ) {
      uploadedImages.push(
        product.thumbnail
      );
    }

    return uploadedImages;
  };

/*
 * Convert DummyJSON product to SUMART Product format.
 */
const transformProduct =
  async (
    product: DummyProduct,
    index: number
  ) => {
    const images =
      await uploadProductImages(
        product
      );

    return {
      name: product.title,

      description:
        product.description,

      price:
        convertPriceToNaira(
          product.price
        ),

      category:
        formatCategory(
          product.category
        ),

      images,

      stock:
        Math.max(
          product.stock,
          0
        ),

      brand:
        product.brand?.trim() ||
        "SUMART Select",

      ratings:
        Math.min(
          5,
          Math.max(
            0,
            Number(
              product.rating.toFixed(
                1
              )
            )
          )
        ),

      /*
       * Around 1 in every 10 products becomes featured.
       */
      isFeatured:
        index % 10 === 0,
    };
  };

/*
 * Create additional SUMART variants if the source
 * dataset has fewer products than our target.
 */
const createExtraProducts = (
  products: Awaited<
    ReturnType<
      typeof transformProduct
    >
  >[]
) => {
  const extraProducts = [
    {
      suffix: "Premium Edition",
      priceMultiplier: 1.15,
      stockBonus: 8,
    },

    {
      suffix: "Essential Edition",
      priceMultiplier: 0.92,
      stockBonus: 14,
    },

    {
      suffix: "Plus",
      priceMultiplier: 1.08,
      stockBonus: 5,
    },
  ];

  const results = [
    ...products,
  ];

  let sourceIndex = 0;
  let variationIndex = 0;

  while (
    results.length <
    TARGET_PRODUCT_COUNT
  ) {
    const sourceProduct =
      products[
        sourceIndex %
          products.length
      ];

    const variation =
      extraProducts[
        variationIndex %
          extraProducts.length
      ];

    results.push({
      ...sourceProduct,

      name: `${
        sourceProduct.name
      } ${variation.suffix}`,

      description:
        `${
          sourceProduct.description
        } This ${
          variation.suffix
        } version offers an additional SUMART option for customers looking for more choice.`,

      price:
        Math.round(
          (sourceProduct.price *
            variation.priceMultiplier) /
            500
        ) * 500,

      stock:
        sourceProduct.stock +
        variation.stockBonus,

      ratings:
        Math.min(
          5,
          Number(
            (
              sourceProduct.ratings +
              0.1
            ).toFixed(1)
          )
        ),

      /*
       * Reuse the same Cloudinary-hosted photography
       * for the variant.
       */
      images: [
        ...sourceProduct.images,
      ],

      isFeatured:
        results.length %
          12 ===
        0,
    });

    sourceIndex++;
    variationIndex++;
  }

  return results;
};

const seedProducts =
  async () => {
    try {
      await connectDB();

      console.log(
        "🌱 Fetching product catalogue..."
      );

      /*
       * limit=0 returns the full dataset.
       */
      const response =
        await fetch(
          "https://dummyjson.com/products?limit=0"
        );

      if (!response.ok) {
        throw new Error(
          `Unable to fetch products. HTTP ${response.status}`
        );
      }

      const data =
        (await response.json()) as DummyProductResponse;

      console.log(
        `📦 ${data.products.length} source products found.`
      );

      const transformedProducts:
        Awaited<
          ReturnType<
            typeof transformProduct
          >
        >[] = [];

      /*
       * Process sequentially.
       *
       * This is intentionally not Promise.all for 194 products,
       * because sending hundreds of simultaneous uploads can
       * hammer Cloudinary and trigger rate-limit/network issues.
       */
      for (
        let index = 0;
        index <
        data.products.length;
        index++
      ) {
        const product =
          data.products[index];

        console.log(
          `\n🛍️ Processing ${
            index + 1
          }/${
            data.products.length
          }: ${product.title}`
        );

        try {
          const transformed =
            await transformProduct(
              product,
              index
            );

          transformedProducts.push(
            transformed
          );
        } catch (error) {
          console.error(
            `❌ Failed to process "${product.title}":`,
            error
          );
        }
      }

      if (
        transformedProducts.length ===
        0
      ) {
        throw new Error(
          "No products were successfully prepared."
        );
      }

      const finalProducts =
        createExtraProducts(
          transformedProducts
        );

      console.log(
        `\n📊 Prepared ${finalProducts.length} SUMART products.`
      );

      console.log(
        "🗑️ Removing existing products..."
      );

      await Product.deleteMany(
        {}
      );

      console.log(
        "💾 Saving products to MongoDB..."
      );

      const createdProducts =
        await Product.insertMany(
          finalProducts
        );

      console.log(
        `\n✅ ${createdProducts.length} products successfully seeded!`
      );

      console.log(
        "☁️ Product images are now hosted through Cloudinary."
      );
    } catch (error) {
      console.error(
        "\n❌ Product seeding failed:",
        error
      );

      process.exitCode = 1;
    } finally {
      await mongoose.connection.close();

      console.log(
        "🔌 MongoDB connection closed."
      );
    }
  };

seedProducts();