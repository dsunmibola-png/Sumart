import { Queue } from "bullmq";

import { redisConnection } from "../config/redis";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

export const EMAIL_QUEUE_NAME =
  "sumart-email";

export const emailQueue =
  new Queue<EmailJobData>(
    EMAIL_QUEUE_NAME,
    {
      connection:
        redisConnection,

      defaultJobOptions: {
        /*
         * Retry temporary email
         * failures up to 3 times.
         */
        attempts: 3,

        /*
         * Wait longer between
         * each retry.
         */
        backoff: {
          type: "exponential",
          delay: 5000,
        },

        /*
         * Don't keep thousands
         * of completed jobs forever.
         */
        removeOnComplete: {
          age: 60 * 60 * 24,
          count: 1000,
        },

        /*
         * Keep failed jobs longer
         * so we can inspect them.
         */
        removeOnFail: {
          age:
            60 *
            60 *
            24 *
            7,

          count: 5000,
        },
      },
    }
  );

/*
|--------------------------------------------------------------------------
| Add email to queue
|--------------------------------------------------------------------------
*/

export const queueEmail =
  async (
    data: EmailJobData
  ) => {
    const job =
      await emailQueue.add(
        "send-email",
        data
      );

    console.log(
      `📨 Email queued: ${job.id}`
    );

    return job;
  };