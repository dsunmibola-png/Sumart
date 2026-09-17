import mongoose from "mongoose";

import Order from "../models/Order";
import Product from "../models/Product";
import { queueEmail } from "../queues/emailQueue";

interface CreateOrderItem {
  productId: string;
  quantity: number;
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

interface CreateOrderData {
  userId: string;
  items: CreateOrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: "card" | "delivery";
}

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/*
 * Format money in Nigerian Naira.
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
};

/*
 * Shorten the MongoDB order ID so it
 * looks cleaner inside customer emails.
 */
const getOrderNumber = (orderId: string) => {
  return orderId.slice(-8).toUpperCase();
};

/*
 * Reusable SUMART email wrapper.
 */
const buildEmailTemplate = ({
  title,
  greeting,
  message,
  orderId,
  totalAmount,
  status,
}: {
  title: string;
  greeting: string;
  message: string;
  orderId: string;
  totalAmount: number;
  status: string;
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7f5;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        "
      >
        <table
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            background-color: #f4f7f5;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="
                  max-width: 600px;
                  background-color: #ffffff;
                  border-radius: 14px;
                  overflow: hidden;
                  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
                "
              >
                <tr>
                  <td
                    style="
                      background-color: #15803d;
                      padding: 28px 32px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                      "
                    >
                      SUMART
                    </h1>

                    <p
                      style="
                        margin: 6px 0 0;
                        color: #dcfce7;
                        font-size: 14px;
                      "
                    >
                      Smart Shopping Starts Here
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 32px;
                    "
                  >
                    <h2
                      style="
                        margin: 0 0 20px;
                        color: #111827;
                        font-size: 22px;
                      "
                    >
                      ${title}
                    </h2>

                    <p
                      style="
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 16px;
                      "
                    >
                      ${greeting}
                    </p>

                    <p
                      style="
                        font-size: 15px;
                        line-height: 1.7;
                        color: #4b5563;
                      "
                    >
                      ${message}
                    </p>

                    <table
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      style="
                        margin-top: 28px;
                        background-color: #f9fafb;
                        border-radius: 10px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 20px;
                          "
                        >
                          <p
                            style="
                              margin: 0 0 12px;
                              font-size: 14px;
                              color: #6b7280;
                            "
                          >
                            Order Number
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
                              font-size: 16px;
                              font-weight: bold;
                              color: #111827;
                            "
                          >
                            #${getOrderNumber(orderId)}
                          </p>

                          <p
                            style="
                              margin: 0 0 12px;
                              font-size: 14px;
                              color: #6b7280;
                            "
                          >
                            Order Status
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
                              font-size: 16px;
                              font-weight: bold;
                              color: #15803d;
                              text-transform: capitalize;
                            "
                          >
                            ${status}
                          </p>

                          <p
                            style="
                              margin: 0 0 12px;
                              font-size: 14px;
                              color: #6b7280;
                            "
                          >
                            Order Total
                          </p>

                          <p
                            style="
                              margin: 0;
                              font-size: 18px;
                              font-weight: bold;
                              color: #111827;
                            "
                          >
                            ${formatCurrency(totalAmount)}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin-top: 28px;
                        font-size: 14px;
                        line-height: 1.7;
                        color: #6b7280;
                      "
                    >
                      You can sign in to your
                      SUMART account anytime to
                      view your order and track
                      its progress.
                    </p>

                    <p
                      style="
                        margin-top: 28px;
                        font-size: 15px;
                        color: #374151;
                      "
                    >
                      Thank you for shopping
                      with SUMART.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-top: 1px solid #e5e7eb;
                      padding: 20px 32px;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        color: #9ca3af;
                      "
                    >
                      © ${new Date().getFullYear()}
                      SUMART. Smart Shopping
                      Starts Here.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

/*
 * Email queue errors should NEVER cause
 * an order operation to fail.
 *
 * The API only adds the email job to Redis.
 * The BullMQ worker handles the actual
 * Gmail/Nodemailer delivery separately.
 */
const sendOrderEmailSafely = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const job = await queueEmail({
      to,
      subject,
      html,
    });

    console.log(
      `📨 Order email queued for ${to} — Job ${job.id}`,
    );
  } catch (error) {
    console.error(
      "❌ Failed to queue order email:",
      error,
    );
  }
};

/*
 * CREATE ORDER
 *
 * Stock is reserved atomically.
 *
 * MongoDB only decreases stock when
 * enough stock still exists at the exact
 * moment the update happens.
 *
 * This prevents two customers from
 * successfully buying the same final
 * unit of a product.
 */
export const createOrder = async ({
  userId,
  items,
  shippingAddress,
  paymentMethod,
}: CreateOrderData) => {
  if (!items || items.length === 0) {
    throw new Error("Your order must contain at least one product");
  }

  const productIds = items.map((item) => item.productId);

  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    throw new Error(
      "The same product cannot appear more than once in an order",
    );
  }

  if (
    !shippingAddress.fullName ||
    !shippingAddress.email ||
    !shippingAddress.phone ||
    !shippingAddress.address ||
    !shippingAddress.city ||
    !shippingAddress.state
  ) {
    throw new Error("All delivery information is required");
  }

  if (!["card", "delivery"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const session = await mongoose.startSession();

  let createdOrder: InstanceType<typeof Order> | undefined;

  try {
    await session.withTransaction(async () => {
      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          throw new Error("Invalid product ID");
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new Error("Invalid product quantity");
        }

        /*
         * ATOMIC STOCK RESERVATION
         *
         * MongoDB checks:
         *
         * stock >= requested quantity
         *
         * and decreases the stock in the
         * same operation.
         */
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,

            stock: {
              $gte: item.quantity,
            },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
{
  returnDocument: "after",
  session,
}
        );

        /*
         * A null result means either:
         *
         * 1. Product no longer exists.
         * 2. Product does not have enough stock.
         */
        if (!product) {
          const existingProduct = await Product.findById(item.productId)
            .select("name stock")
            .session(session);

          if (!existingProduct) {
            throw new Error("One of the selected products no longer exists");
          }

          if (existingProduct.stock <= 0) {
            throw new Error(`${existingProduct.name} is out of stock`);
          }

          throw new Error(
            `Only ${existingProduct.stock} ${existingProduct.name} available`,
          );
        }

        /*
         * Never trust price/name/image values
         * coming from the frontend.
         *
         * All order information comes from
         * the product currently stored in DB.
         */
        orderItems.push({
          product: product._id,

          name: product.name,

          image: product.images[0] || "",

          price: product.price,

          quantity: item.quantity,
        });

        totalAmount += product.price * item.quantity;
      }

      /*
       * Only create the order after every
       * product has been successfully
       * reserved.
       */
      const orders = await Order.create(
        [
          {
            user: userId,

            items: orderItems,

            shippingAddress,

            paymentMethod,

            paymentStatus: "pending",

            orderStatus: "pending",

            totalAmount,
          },
        ],
        {
          session,
        },
      );

      createdOrder = orders[0];
    });
  } finally {
    await session.endSession();
  }

  if (!createdOrder) {
    throw new Error("Failed to create order");
  }

  /*
   * TRANSACTION HAS NOW SUCCEEDED.
   *
   * The email is deliberately sent
   * afterwards so an email failure cannot
   * undo the customer's order.
   */
  await sendOrderEmailSafely({
    to: shippingAddress.email,

    subject: "SUMART - Order Confirmation",

    html: buildEmailTemplate({
      title: "Order Confirmed",

      greeting: `Hi ${shippingAddress.fullName},`,

      message:
        paymentMethod === "card"
          ? "We've received your order. Your order will move into processing once your card payment has been successfully confirmed."
          : "We've received your order successfully. Your order is currently pending and will be prepared for delivery. Payment will be collected when your order is delivered.",

      orderId: createdOrder._id.toString(),

      totalAmount: createdOrder.totalAmount,

      status: createdOrder.orderStatus,
    }),
  });

  return createdOrder;
};

/*
 * ADMIN: GET ALL ORDERS
 */
interface GetAllOrdersOptions {
  page?: number;
  limit?: number;
  orderStatus?: string;
  paymentStatus?: string;
  search?: string;
}

export const getAllOrders = async ({
  page = 1,
  limit = 20,
  orderStatus,
  paymentStatus,
  search,
}: GetAllOrdersOptions = {}) => {
  /*
   * Protect the API from extremely large
   * page sizes.
   */
  const safePage = Math.max(1, page);

  const safeLimit = Math.min(
    Math.max(1, limit),
    100
  );

  const skip =
    (safePage - 1) *
    safeLimit;

  const filter: Record<string, unknown> = {};

  /*
   * ORDER STATUS FILTER
   */
  if (orderStatus) {
    filter.orderStatus =
      orderStatus;
  }

  /*
   * PAYMENT STATUS FILTER
   */
  if (paymentStatus) {
    filter.paymentStatus =
      paymentStatus;
  }

  /*
   * SEARCH
   *
   * MongoDB ObjectIds cannot be searched
   * using regex directly.
   *
   * If the entered value is a valid full
   * MongoDB ObjectId, search by _id.
   *
   * Otherwise search customer delivery
   * information.
   */
  if (
    search &&
    search.trim()
  ) {
    const searchValue =
      search.trim();

    if (
      mongoose.Types.ObjectId.isValid(
        searchValue
      )
    ) {
      filter._id =
        new mongoose.Types.ObjectId(
          searchValue
        );
    } else {
      filter.$or = [
        {
          "shippingAddress.fullName": {
            $regex:
              searchValue,
            $options: "i",
          },
        },
        {
          "shippingAddress.email": {
            $regex:
              searchValue,
            $options: "i",
          },
        },
        {
          "shippingAddress.phone": {
            $regex:
              searchValue,
            $options: "i",
          },
        },
        {
          paymentReference: {
            $regex:
              searchValue,
            $options: "i",
          },
        },
      ];
    }
  }

  /*
   * Fetch the requested page and total
   * number of matching orders at the
   * same time.
   */
  const [
    orders,
    totalOrders,
  ] = await Promise.all([
    Order.find(filter)
      .populate(
        "user",
        "name email"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(safeLimit),

    Order.countDocuments(
      filter
    ),
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalOrders /
          safeLimit
      )
    );

  return {
    orders,

    pagination: {
      page: safePage,

      limit: safeLimit,

      totalOrders,

      totalPages,

      hasNextPage:
        safePage <
        totalPages,

      hasPreviousPage:
        safePage > 1,
    },
  };
};

/*
 * ADMIN: GET SINGLE ORDER
 */
export const getAdminOrderById = async (orderId: string) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId).populate(
    "user",
    "name email",
  );

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

/*
 * ADMIN: UPDATE ORDER STATUS
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  const session = await mongoose.startSession();

  let statusChanged = false;

  try {
    let updatedOrder: InstanceType<typeof Order> | undefined;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      const currentStatus = order.orderStatus;

      /*
       * No change needed.
       */
      if (currentStatus === status) {
        updatedOrder = order;

        return;
      }

      /*
       * Cancelled orders are final.
       */
      if (currentStatus === "cancelled") {
        throw new Error("A cancelled order cannot be updated");
      }

      /*
       * Delivered orders are final.
       */
      if (currentStatus === "delivered") {
        throw new Error("A delivered order cannot be updated");
      }

      /*
       * CANCEL ORDER
       */
      if (status === "cancelled") {
        if (currentStatus !== "pending" && currentStatus !== "processing") {
          throw new Error(
            "Only pending or processing orders can be cancelled",
          );
        }

        /*
         * Restore inventory.
         *
         * $inc is used here because it updates
         * the stock directly in MongoDB instead
         * of reading and saving each Product
         * document manually.
         */
        for (const item of order.items) {
          await Product.updateOne(
            {
              _id: item.product,
            },
            {
              $inc: {
                stock: item.quantity,
              },
            },
            {
              session,
            },
          );
        }

        order.orderStatus = "cancelled";

        order.cancelledAt = new Date();

        await order.save({
          session,
        });

        statusChanged = true;

        updatedOrder = order;

        return;
      }

      /*
       * Valid fulfilment flow:
       *
       * pending
       *   ↓
       * processing
       *   ↓
       * shipped
       *   ↓
       * delivered
       */
      const allowedNextStatus: Record<
        Exclude<OrderStatus, "cancelled">,
        OrderStatus | null
      > = {
        pending: "processing",

        processing: "shipped",

        shipped: "delivered",

        delivered: null,
      };

      const expectedNextStatus =
        allowedNextStatus[
          currentStatus as Exclude<OrderStatus, "cancelled">
        ];

      if (status !== expectedNextStatus) {
        throw new Error(
          `Order cannot move from ${currentStatus} to ${status}`,
        );
      }

      /*
       * CARD PAYMENT RULE
       *
       * A card order cannot begin processing
       * until Paystack has confirmed payment.
       */
      if (
        currentStatus === "pending" &&
        status === "processing" &&
        order.paymentMethod === "card" &&
        order.paymentStatus !== "paid"
      ) {
        throw new Error(
          "Card payment must be completed before processing this order",
        );
      }

      order.orderStatus = status;

      if (status === "processing") {
        order.processedAt = new Date();
      }

      if (status === "shipped") {
        order.shippedAt = new Date();
      }

      if (status === "delivered") {
        order.deliveredAt = new Date();
      }

      /*
       * PAY ON DELIVERY
       *
       * Payment becomes successful when the
       * order reaches delivered.
       */
      if (
        status === "delivered" &&
        order.paymentMethod === "delivery" &&
        order.paymentStatus !== "paid"
      ) {
        order.paymentStatus = "paid";

        order.paidAt = new Date();
      }

      await order.save({
        session,
      });

      statusChanged = true;

      updatedOrder = order;
    });

    if (!updatedOrder) {
      throw new Error("Failed to update order status");
    }

    /*
     * Fetch the completed order after the
     * transaction so populated user data can
     * be returned to the admin interface.
     */
    const populatedOrder = await Order.findById(orderId).populate(
      "user",
      "name email",
    );

    if (!populatedOrder) {
      throw new Error("Order not found");
    }

    /*
     * Only send an email if the order
     * status actually changed.
     */
    if (statusChanged) {
      const customerEmail =
        populatedOrder.shippingAddress.email;

      const customerName =
        populatedOrder.shippingAddress.fullName;

      let subject = "SUMART - Order Update";

      let title = "Order Updated";

      let message =
        "There has been an update to your SUMART order.";

      if (status === "processing") {
        subject = "SUMART - Your Order Is Being Processed";

        title = "We're Preparing Your Order";

        message =
          "Good news! Your order is now being processed. Our team is preparing your items for shipment.";
      }

      if (status === "shipped") {
        subject = "SUMART - Your Order Has Been Shipped";

        title = "Your Order Is On The Way";

        message =
          "Your SUMART order has been shipped and is now on its way to you. You can sign in to your account to follow its progress.";
      }

      if (status === "delivered") {
        subject = "SUMART - Your Order Has Been Delivered";

        title = "Order Delivered";

        message =
          "Your order has been marked as delivered. We hope you enjoy your purchase and thank you for shopping with SUMART.";
      }

      if (status === "cancelled") {
        subject = "SUMART - Order Cancelled";

        title = "Order Cancelled";

        message =
          "Your order has been cancelled. Any reserved inventory for this order has been returned to stock.";
      }

      await sendOrderEmailSafely({
        to: customerEmail,

        subject,

        html: buildEmailTemplate({
          title,

          greeting: `Hi ${customerName},`,

          message,

          orderId: populatedOrder._id.toString(),

          totalAmount: populatedOrder.totalAmount,

          status: populatedOrder.orderStatus,
        }),
      });
    }

    return populatedOrder;
  } finally {
    await session.endSession();
  }
};

/*
 * CUSTOMER: GET THEIR ORDERS
 */
export const getUserOrders = async (userId: string) => {
  return Order.find({
    user: userId,
  }).sort({
    createdAt: -1,
  });
};

/*
 * CUSTOMER: GET ONE OF THEIR ORDERS
 */
export const getUserOrderById = async (
  orderId: string,
  userId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  const order = await Order.findOne({
    _id: orderId,

    user: userId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};