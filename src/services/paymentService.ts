import Order from "../models/Order";
import { queueEmail } from "../queues/emailQueue";

const PAYSTACK_URL =
  "https://api.paystack.co";

interface InitializePaymentData {
  orderId: string;
  userId: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;

  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;

  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
  };
}

const getSecretKey = () => {
  const secretKey =
    process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not defined"
    );
  }

  return secretKey;
};

const formatCurrency = (
  amount: number
) => {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }
  ).format(amount);
};

const getOrderNumber = (
  orderId: string
) => {
  return orderId
    .slice(-8)
    .toUpperCase();
};

/*
 * Payment emails should never cause a
 * successful payment operation to fail.
 */
const queuePaymentEmailSafely =
  async ({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) => {
    try {
      const job =
        await queueEmail({
          to,
          subject,
          html,
        });

      console.log(
        `📨 Payment email queued for ${to} — Job ${job.id}`
      );
    } catch (error) {
      console.error(
        "❌ Failed to queue payment email:",
        error
      );
    }
  };

const buildPaymentEmailTemplate = ({
  title,
  customerName,
  message,
  orderId,
  amount,
  paymentStatus,
  reference,
}: {
  title: string;
  customerName: string;
  message: string;
  orderId: string;
  amount: number;
  paymentStatus: string;
  reference?: string;
}) => {
  const clientUrl =
    process.env.CLIENT_URL ||
    "http://localhost:5173";

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
            padding: 40px 16px;
            background-color: #f4f7f5;
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
                  box-shadow:
                    0 4px 18px
                    rgba(0, 0, 0, 0.06);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 28px 32px;
                      text-align: center;
                      background-color: #15803d;
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
                        margin-bottom: 16px;
                        font-size: 16px;
                        line-height: 1.6;
                      "
                    >
                      Hi ${customerName},
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
                              margin: 0 0 8px;
                              font-size: 13px;
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
                            "
                          >
                            #${getOrderNumber(
                              orderId
                            )}
                          </p>

                          <p
                            style="
                              margin: 0 0 8px;
                              font-size: 13px;
                              color: #6b7280;
                            "
                          >
                            Amount
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
                              font-size: 18px;
                              font-weight: bold;
                            "
                          >
                            ${formatCurrency(
                              amount
                            )}
                          </p>

                          <p
                            style="
                              margin: 0 0 8px;
                              font-size: 13px;
                              color: #6b7280;
                            "
                          >
                            Payment Status
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
                              color: #15803d;
                              font-size: 16px;
                              font-weight: bold;
                              text-transform: capitalize;
                            "
                          >
                            ${paymentStatus}
                          </p>

                          ${
                            reference
                              ? `
                                <p
                                  style="
                                    margin: 0 0 8px;
                                    font-size: 13px;
                                    color: #6b7280;
                                  "
                                >
                                  Payment Reference
                                </p>

                                <p
                                  style="
                                    margin: 0;
                                    font-size: 14px;
                                    font-weight: bold;
                                    word-break: break-all;
                                  "
                                >
                                  ${reference}
                                </p>
                              `
                              : ""
                          }
                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top: 28px;
                        text-align: center;
                      "
                    >
                      <a
                        href="${clientUrl}/orders/${orderId}"
                        style="
                          display: inline-block;
                          padding: 12px 24px;
                          border-radius: 8px;
                          background-color: #15803d;
                          color: #ffffff;
                          text-decoration: none;
                          font-size: 14px;
                          font-weight: bold;
                        "
                      >
                        View Order
                      </a>
                    </div>

                    <p
                      style="
                        margin-top: 28px;
                        font-size: 14px;
                        line-height: 1.7;
                        color: #6b7280;
                      "
                    >
                      You can also sign in to your
                      SUMART account at any time to
                      check your order status.
                    </p>

                    <p
                      style="
                        margin-top: 28px;
                        font-size: 15px;
                        color: #374151;
                      "
                    >
                      Thank you for shopping with
                      SUMART.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 20px 32px;
                      text-align: center;
                      border-top: 1px solid #e5e7eb;
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
                      SUMART. Smart Shopping Starts
                      Here.
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

export const initializePayment =
  async ({
    orderId,
    userId,
  }: InitializePaymentData) => {
    const order =
      await Order.findOne({
        _id: orderId,
        user: userId,
      });

    if (!order) {
      throw new Error(
        "Order not found"
      );
    }

    if (
      order.paymentMethod !==
      "card"
    ) {
      throw new Error(
        "This order does not require card payment"
      );
    }

    if (
      order.paymentStatus ===
      "paid"
    ) {
      throw new Error(
        "This order has already been paid"
      );
    }

    const reference =
      order.paymentReference ||
      `SUMART-${order._id}-${Date.now()}`;

    const clientUrl =
      process.env.CLIENT_URL ||
      "http://localhost:5173";

    const response =
      await fetch(
        `${PAYSTACK_URL}/transaction/initialize`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${getSecretKey()}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              email:
                order
                  .shippingAddress
                  .email,

              amount:
                Math.round(
                  order.totalAmount *
                    100
                ).toString(),

              reference,

              callback_url:
                `${clientUrl}/payment/callback`,

              metadata:
                JSON.stringify({
                  orderId:
                    order._id.toString(),

                  userId,
                }),
            }),
        }
      );

    const data =
      (await response.json()) as
        PaystackInitializeResponse;

    if (
      !response.ok ||
      !data.status
    ) {
      throw new Error(
        data.message ||
          "Unable to initialize payment"
      );
    }

    order.paymentReference =
      data.data.reference;

    await order.save();

    return {
      authorizationUrl:
        data.data
          .authorization_url,

      accessCode:
        data.data.access_code,

      reference:
        data.data.reference,
    };
  };

export const verifyPayment =
  async (
    reference: string,
    userId: string
  ) => {
    const order =
      await Order.findOne({
        paymentReference:
          reference,

        user:
          userId,
      });

    if (!order) {
      throw new Error(
        "Order for this payment was not found"
      );
    }

    /*
     * This also prevents duplicate
     * payment-success emails if the
     * callback is requested again.
     */
    if (
      order.paymentStatus ===
      "paid"
    ) {
      return order;
    }

    const response =
      await fetch(
        `${PAYSTACK_URL}/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${getSecretKey()}`,
          },
        }
      );

    const data =
      (await response.json()) as
        PaystackVerifyResponse;

    if (
      !response.ok ||
      !data.status
    ) {
      throw new Error(
        data.message ||
          "Unable to verify payment"
      );
    }

    /*
     * Only mark the payment as failed
     * when Paystack explicitly reports
     * "failed".
     *
     * Other states such as pending or
     * processing should not immediately
     * become failed.
     */
    if (
      data.data.status ===
      "failed"
    ) {
      order.paymentStatus =
        "failed";

      await order.save();

     await queuePaymentEmailSafely({
        to:
          order
            .shippingAddress
            .email,

        subject:
          "SUMART - Card Payment Failed",

        html:
          buildPaymentEmailTemplate({
            title:
              "Payment Failed",

            customerName:
              order
                .shippingAddress
                .fullName,

            message:
              "We were unable to confirm your card payment for this order. Your order has not been paid. You can return to SUMART and try the payment again.",

            orderId:
              order._id.toString(),

            amount:
              order.totalAmount,

            paymentStatus:
              "failed",

            reference:
              data.data.reference,
          }),
      });

      throw new Error(
        "Payment was not successful"
      );
    }

    /*
     * Do not consider pending,
     * processing, abandoned, etc.
     * to be successful.
     */
    if (
      data.data.status !==
      "success"
    ) {
      throw new Error(
        "Payment has not been completed successfully"
      );
    }

    const expectedAmount =
      Math.round(
        order.totalAmount * 100
      );

    /*
     * Never update the order if
     * Paystack's amount is different
     * from the amount SUMART expects.
     */
    if (
      data.data.amount !==
      expectedAmount
    ) {
      throw new Error(
        "Payment amount does not match order amount"
      );
    }

    order.paymentStatus =
      "paid";

    order.paidAt =
      new Date();

    /*
     * Successful card payments move
     * pending orders into processing.
     *
     * We also record processedAt so
     * customer tracking stays accurate.
     */
    if (
      order.orderStatus ===
      "pending"
    ) {
      order.orderStatus =
        "processing";

      order.processedAt =
        new Date();
    }

    await order.save();

    /*
     * Database has already been updated.
     * A mail problem cannot undo payment.
     */
    await queuePaymentEmailSafely({
      to:
        order
          .shippingAddress
          .email,

      subject:
        "SUMART - Payment Successful",

      html:
        buildPaymentEmailTemplate({
          title:
            "Payment Successful",

          customerName:
            order
              .shippingAddress
              .fullName,

          message:
            "Your card payment has been successfully confirmed. We've received your payment and your SUMART order is now being prepared.",

          orderId:
            order._id.toString(),

          amount:
            order.totalAmount,

          paymentStatus:
            "paid",

          reference:
            data.data.reference,
        }),
    });

    return order;
  };