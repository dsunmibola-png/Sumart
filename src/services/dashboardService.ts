import Order from "../models/Order";
import Product from "../models/Product";
import User from "../models/User";

export const getDashboardAnalytics =
  async () => {
    const [
      orderStats,
      customerCount,
      productStats,
      recentOrders,
      inventoryAlerts,
    ] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,

            totalOrders: {
              $sum: 1,
            },

            paidOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$paymentStatus",
                      "paid",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            pendingOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "pending",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            processingOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "processing",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            shippedOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "shipped",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            deliveredOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "delivered",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            cancelledOrders: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "cancelled",
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            totalRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $eq: [
                          "$paymentStatus",
                          "paid",
                        ],
                      },
                      {
                        $ne: [
                          "$orderStatus",
                          "cancelled",
                        ],
                      },
                    ],
                  },
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),

      User.countDocuments({
        role: "user",
      }),

      Product.aggregate([
        {
          $group: {
            _id: null,

            totalProducts: {
              $sum: 1,
            },

            featuredProducts: {
              $sum: {
                $cond: [
                  "$isFeatured",
                  1,
                  0,
                ],
              },
            },

            lowStockProducts: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: [
                          "$stock",
                          0,
                        ],
                      },
                      {
                        $lte: [
                          "$stock",
                          5,
                        ],
                      },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            outOfStockProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$stock",
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      Order.find()
        .populate(
          "user",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),

      Product.find({
        stock: {
          $lte: 5,
        },
      })
        .sort({
          stock: 1,
        })
        .limit(5),
    ]);

    const orders =
      orderStats[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        paidOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      };

    const products =
      productStats[0] || {
        totalProducts: 0,
        featuredProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
      };

    return {
      stats: {
        totalRevenue:
          orders.totalRevenue,

        totalOrders:
          orders.totalOrders,

        paidOrders:
          orders.paidOrders,

        pendingOrders:
          orders.pendingOrders,

        processingOrders:
          orders.processingOrders,

        shippedOrders:
          orders.shippedOrders,

        deliveredOrders:
          orders.deliveredOrders,

        cancelledOrders:
          orders.cancelledOrders,

        customers:
          customerCount,

        totalProducts:
          products.totalProducts,

        featuredProducts:
          products.featuredProducts,

        lowStockProducts:
          products.lowStockProducts,

        outOfStockProducts:
          products.outOfStockProducts,
      },

      recentOrders,

      inventoryAlerts,
    };
  };