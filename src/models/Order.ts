import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface IOrder
  extends Document {
  user: mongoose.Types.ObjectId;

  items: IOrderItem[];

  shippingAddress:
    IShippingAddress;

  paymentMethod:
    | "card"
    | "delivery";

  paymentStatus:
    | "pending"
    | "paid"
    | "failed";

  orderStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

  totalAmount: number;

  paymentReference?: string;

  paidAt?: Date;

  processedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema =
  new Schema<IOrderItem>(
    {
      product: {
        type:
          Schema.Types
            .ObjectId,

        ref: "Product",

        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      image: {
        type: String,
        default: "",
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    {
      _id: false,
    }
  );

const shippingAddressSchema =
  new Schema<IShippingAddress>(
    {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const orderSchema =
  new Schema<IOrder>(
    {
      user: {
        type:
          Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
      },

      items: {
        type: [
          orderItemSchema,
        ],

        required: true,
      },

      shippingAddress: {
        type:
          shippingAddressSchema,

        required: true,
      },

      paymentMethod: {
        type: String,

        enum: [
          "card",
          "delivery",
        ],

        required: true,
      },

      paymentStatus: {
        type: String,

        enum: [
          "pending",
          "paid",
          "failed",
        ],

        default: "pending",
      },

      paymentReference: {
        type: String,
        trim: true,
      },

      paidAt: {
        type: Date,
      },

      processedAt: {
        type: Date,
      },

      shippedAt: {
        type: Date,
      },

      deliveredAt: {
        type: Date,
      },

      cancelledAt: {
        type: Date,
      },

      orderStatus: {
        type: String,

        enum: [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ],

        default: "pending",
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

/*
 * INDEXES
 */

/*
 * Customer order history:
 *
 * Order.find({ user: userId })
 *   .sort({ createdAt: -1 })
 */
orderSchema.index({
  user: 1,
  createdAt: -1,
});

/*
 * Admin order listing:
 *
 * Order.find()
 *   .sort({ createdAt: -1 })
 */
orderSchema.index({
  createdAt: -1,
});

/*
 * Paystack verification/webhook lookup:
 *
 * Order.findOne({
 *   paymentReference: reference
 * })
 *
 * sparse prevents orders without a
 * paymentReference from conflicting.
 */
orderSchema.index(
  {
    paymentReference: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

/*
 * Useful for admin filtering and
 * dashboard analytics by order status.
 */
orderSchema.index({
  orderStatus: 1,
});

/*
 * Useful for payment filtering and
 * dashboard analytics.
 */
orderSchema.index({
  paymentStatus: 1,
});

/*
 * Helpful when filtering orders by both
 * fulfilment and payment state.
 */
orderSchema.index({
  orderStatus: 1,
  paymentStatus: 1,
});

/*
 * Useful for analytics involving paid
 * orders ordered by newest first.
 */
orderSchema.index({
  paymentStatus: 1,
  createdAt: -1,
});

const Order =
  mongoose.model<IOrder>(
    "Order",
    orderSchema
  );

export default Order;