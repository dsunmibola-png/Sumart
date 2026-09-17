import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const emailUser =
  process.env.EMAIL_USER;

const emailPassword =
  process.env.EMAIL_PASSWORD;

if (
  !emailUser ||
  !emailPassword
) {
  console.warn(
    "⚠️ Email credentials are not configured."
  );
}

/*
|--------------------------------------------------------------------------
| Reusable SMTP transporter
|--------------------------------------------------------------------------
|
| Gmail SMTP using port 587 + STARTTLS.
|
| Port 465 is not reachable on the current network,
| so we explicitly use Gmail's STARTTLS port instead.
|
*/

const transporter =
  nodemailer.createTransport({
    host: "smtp.gmail.com",

    port: 587,

    /*
     * false here means the connection
     * starts normally and is upgraded
     * using STARTTLS.
     */
    secure: false,

    auth: {
      user: emailUser,
      pass: emailPassword,
    },

    pool: true,

    maxConnections: 5,

    maxMessages: 100,

    /*
     * Require TLS instead of allowing
     * the connection to continue without it.
     */
    requireTLS: true,
  });

export const sendEmail =
  async ({
    to,
    subject,
    html,
  }: SendEmailOptions) => {
    if (
      !emailUser ||
      !emailPassword
    ) {
      throw new Error(
        "EMAIL_USER and EMAIL_PASSWORD must be configured"
      );
    }

    const from =
      process.env.EMAIL_FROM ||
      emailUser;

    const info =
      await transporter.sendMail({
        from: `"SUMART" <${from}>`,
        to,
        subject,
        html,
      });

    return info;
  };