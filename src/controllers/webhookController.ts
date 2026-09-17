import crypto from "node:crypto";
import type {
  Request,
  Response,
} from "express";

import Order from "../models/Order";
import { queueEmail } from "../queues/emailQueue";

interface PaystackWebhookEvent {
  event: string;

  data: {
    status: string;
    reference: string;
    amount: number;
    paid_at?: string;
  };
}

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
        `📨 Webhook payment email queued for ${to} — Job ${job.id}`
      );
    } catch (error) {
      console.error(
        "❌ Failed to queue webhook payment email:",
        error
      );
    }
  };

const buildPaymentSuccessEmail = ({
  customerName,
  orderId,
  amount,
  reference,
}: {
  customerName: string;
  orderId: string;
  amount: number;
  reference: string;
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
                      "
                    >
                      Payment Successful
                    </h2>

                    <p
                      style="
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
                      Your card payment has been
                      successfully confirmed.
                      We've received your payment
                      and your SUMART order is now
                      being prepared.
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
                              color: #6b7280;
                              font-size: 13px;
                            "
                          >
                            Order Number
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
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
                              color: #6b7280;
                              font-size: 13px;
                            "
                          >
                            Amount Paid
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
                              color: #6b7280;
                              font-size: 13px;
                            "
                          >
                            Payment Status
                          </p>

                          <p
                            style="
                              margin: 0 0 20px;
                              color: #15803d;
                              font-weight: bold;
                            "
                          >
                            Paid
                          </p>

                          <p
                            style="
                              margin: 0 0 8px;
                              color: #6b7280;
                              font-size: 13px;
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
                          font-weight: bold;
                        "
                      >
                        View Order
                      </a>
                    </div>
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

export const paystackWebhook =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const secretKey =
        process.env
          .PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        console.error(
          "PAYSTACK_SECRET_KEY is not configured"
        );

        return res
          .status(500)
          .json({
            message:
              "Server configuration error",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Make sure webhook body is raw
      |--------------------------------------------------------------------------
      */

      if (
        !Buffer.isBuffer(
          req.body
        )
      ) {
        console.error(
          "Paystack webhook body is not a raw Buffer"
        );

        return res
          .status(400)
          .json({
            message:
              "Invalid webhook body",
          });
      }

      const signature =
        req.headers[
          "x-paystack-signature"
        ];

      if (
        !signature ||
        typeof signature !==
          "string"
      ) {
        return res
          .status(401)
          .json({
            message:
              "Missing Paystack signature",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Verify the ORIGINAL raw payload
      |--------------------------------------------------------------------------
      */

      const hash = crypto
        .createHmac(
          "sha512",
          secretKey
        )
        .update(req.body)
        .digest("hex");

      if (
        hash !== signature
      ) {
        console.warn(
          "Invalid Paystack webhook signature"
        );

        return res
          .status(401)
          .json({
            message:
              "Invalid signature",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Parse JSON only AFTER signature verification
      |--------------------------------------------------------------------------
      */

      let event:
        PaystackWebhookEvent;

      try {
        event = JSON.parse(
          req.body.toString(
            "utf8"
          )
        ) as PaystackWebhookEvent;
      } catch {
        console.warn(
          "Invalid Paystack webhook JSON"
        );

        return res
          .status(400)
          .json({
            message:
              "Invalid webhook payload",
          });
      }

      /*
       * Only successful charges matter.
       */

      if (
        event.event !==
        "charge.success"
      ) {
        return res.sendStatus(
          200
        );
      }

      const {
        reference,
        amount,
        status,
        paid_at,
      } = event.data;

      if (
        status !== "success"
      ) {
        return res.sendStatus(
          200
        );
      }

      /*
       * Find SUMART order.
       */

      const order =
        await Order.findOne({
          paymentReference:
            reference,
        });

      if (!order) {
        console.warn(
          `No SUMART order found for Paystack reference: ${reference}`
        );

        return res.sendStatus(
          200
        );
      }

      /*
       * Idempotency:
       *
       * Callback may have already
       * verified the payment.
       */

      if (
        order.paymentStatus ===
        "paid"
      ) {
        return res.sendStatus(
          200
        );
      }

      /*
       * Paystack amount is in kobo.
       */

      const expectedAmount =
        Math.round(
          order.totalAmount *
            100
        );

      if (
        amount !==
        expectedAmount
      ) {
        console.error(
          `Payment amount mismatch for order ${order._id}`
        );

        return res.sendStatus(
          200
        );
      }

      /*
       * Update database before
       * sending notification.
       */

      order.paymentStatus =
        "paid";

      order.paidAt =
        paid_at
          ? new Date(
              paid_at
            )
          : new Date();

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

      console.log(
        `✅ Paystack webhook confirmed order ${order._id}`
      );

      /*
       * Email failure cannot undo
       * the successful payment.
       */

      await queuePaymentEmailSafely({
        to:
          order
            .shippingAddress
            .email,

        subject:
          "SUMART - Payment Successful",

        html:
          buildPaymentSuccessEmail(
            {
              customerName:
                order
                  .shippingAddress
                  .fullName,

              orderId:
                order._id.toString(),

              amount:
                order.totalAmount,

              reference,
            }
          ),
      });

      return res.sendStatus(
        200
      );
    } catch (error) {
      console.error(
        "Paystack webhook error:",
        error
      );

      return res.sendStatus(
        500
      );
    }
  };