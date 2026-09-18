import nodemailer from "nodemailer";
import dns from "node:dns/promises";

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
| Resolve Gmail SMTP using IPv4
|--------------------------------------------------------------------------
|
| Render attempted to connect to Gmail using IPv6 and returned
| ENETUNREACH. We resolve smtp.gmail.com explicitly using IPv4
| before creating the SMTP connection.
|
*/

let gmailIPv4:
  string | undefined;

const getGmailIPv4 =
  async () => {
    if (gmailIPv4) {
      return gmailIPv4;
    }

    const result =
      await dns.lookup(
        "smtp.gmail.com",
        {
          family: 4,
        }
      );

    gmailIPv4 =
      result.address;

    return gmailIPv4;
  };

/*
|--------------------------------------------------------------------------
| Send email
|--------------------------------------------------------------------------
|
| Gmail SMTP uses port 587 + STARTTLS.
|
| A transporter is created using Gmail's resolved IPv4 address.
| The TLS servername remains smtp.gmail.com so Gmail's TLS
| certificate is validated against the correct hostname.
|
*/

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

    const smtpIPv4 =
      await getGmailIPv4();

    const transporter =
      nodemailer.createTransport({
        host: smtpIPv4,

        port: 587,

        secure: false,

        auth: {
          user: emailUser,
          pass: emailPassword,
        },

        requireTLS: true,

        /*
         * We connect to Gmail through
         * its IPv4 address, but TLS
         * must still validate Gmail's
         * actual hostname.
         */
        tls: {
          servername:
            "smtp.gmail.com",
        },

        connectionTimeout:
          30_000,

        greetingTimeout:
          30_000,

        socketTimeout:
          60_000,
      });

    const info =
      await transporter.sendMail({
        from: `"SUMART" <${from}>`,
        to,
        subject,
        html,
      });

    transporter.close();

    return info;
  };