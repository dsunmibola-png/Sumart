import "dotenv/config";
import dns from "node:dns";

import app from "./app";
import { connectDB } from "./config/db";
import { redisConnection } from "./config/redis";

import "../src/workers/emailWorker";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const PORT =
  process.env.PORT || 5000;

const waitForRedis =
  async (): Promise<void> => {
    if (
      redisConnection.status ===
      "ready"
    ) {
      return;
    }

    await new Promise<void>(
      (resolve, reject) => {
        const handleReady = () => {
          cleanup();
          resolve();
        };

        const handleError = (
          error: Error
        ) => {
          cleanup();
          reject(error);
        };

        const cleanup = () => {
          redisConnection.off(
            "ready",
            handleReady
          );

          redisConnection.off(
            "error",
            handleError
          );
        };

        redisConnection.once(
          "ready",
          handleReady
        );

        redisConnection.once(
          "error",
          handleError
        );
      }
    );
  };

const startServer =
  async () => {
    try {
      await connectDB();

      await waitForRedis();

      console.log(
        "🚀 Database services ready"
      );

      app.listen(
        PORT,
        () => {
          console.log(
            `🚀 SUMART Server running on http://localhost:${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "❌ Failed to start SUMART server:",
        error
      );

      process.exit(1);
    }
  };

startServer();