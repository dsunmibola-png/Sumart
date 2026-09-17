import { Worker } from "bullmq";

import {
  EMAIL_QUEUE_NAME,
  type EmailJobData,
} from "../queues/emailQueue";

import {
  createWorkerRedisConnection,
} from "../config/redis";


import {
  sendEmail,
} from "../services/emailService";

/*
|--------------------------------------------------------------------------
| Dedicated worker Redis connection
|--------------------------------------------------------------------------
*/

const workerRedisConnection =
  createWorkerRedisConnection();
/*
|--------------------------------------------------------------------------
| Email worker
|--------------------------------------------------------------------------
*/

export const emailWorker =
  new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,

    async (job) => {
      console.log(
        `📤 Sending email job ${job.id} to ${job.data.to}`
      );

      await sendEmail({
        to: job.data.to,
        subject:
          job.data.subject,
        html: job.data.html,
      });

      console.log(
        `✅ Email job ${job.id} sent successfully`
      );
    },

    {
      connection:
        workerRedisConnection,

      /*
       * Keep concurrency modest
       * while we're using Gmail SMTP.
       */
      concurrency: 3,
    }
  );

/*
|--------------------------------------------------------------------------
| Worker events
|--------------------------------------------------------------------------
*/

emailWorker.on(
  "ready",
  () => {
    console.log(
      "📬 SUMART email worker is ready"
    );
  }
);

emailWorker.on(
  "completed",
  (job) => {
    console.log(
      `✅ Email job ${job.id} completed`
    );
  }
);

emailWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `❌ Email job ${job?.id} failed:`,
      error.message
    );
  }
);

emailWorker.on(
  "error",
  (error) => {
    console.error(
      "❌ Email worker error:",
      error
    );
  }
);