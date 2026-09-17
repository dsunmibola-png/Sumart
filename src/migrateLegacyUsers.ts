import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";

import { connectDB } from "./config/db";
import User from "./models/User";

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const migrateLegacyUsers =
  async () => {
    try {
      await connectDB();

      console.log(
        "🔎 Checking for legacy SUMART users..."
      );

      /*
       * Legacy accounts are accounts
       * created before email verification
       * was introduced.
       *
       * New accounts already contain
       * isEmailVerified: true/false,
       * so they will NOT match this filter.
       */
      const legacyFilter = {
        isEmailVerified: {
          $exists: false,
        },
      };

      const legacyCount =
        await User.countDocuments(
          legacyFilter
        );

      console.log(
        `👤 ${legacyCount} legacy account(s) found.`
      );

      if (legacyCount === 0) {
        console.log(
          "✅ No legacy accounts need migration."
        );

        return;
      }

      const result =
        await User.updateMany(
          legacyFilter,
          {
            $set: {
              isEmailVerified: true,
            },
          }
        );

      console.log(
        `✅ ${result.modifiedCount} legacy account(s) marked as verified.`
      );

      console.log(
        "🔐 New accounts will still require email verification."
      );
    } catch (error) {
      console.error(
        "❌ Legacy user migration failed:",
        error
      );

      process.exitCode = 1;
    } finally {
      await mongoose.connection.close();

      console.log(
        "🔌 MongoDB connection closed."
      );
    }
  };

migrateLegacyUsers();