import IORedis from "ioredis";

const redisUrl =
  process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error(
    "REDIS_URL is not configured"
  );
}

/*
|--------------------------------------------------------------------------
| Shared retry strategy
|--------------------------------------------------------------------------
|
| If the internet/DNS connection drops, Redis will reconnect automatically.
| The delay gradually increases so we don't flood the terminal or hammer
| Upstash with reconnect attempts.
|
*/

const retryStrategy = (
  times: number
) => {
  const delay =
    Math.min(
      times * 1000,
      10000
    );

  return delay;
};

/*
|--------------------------------------------------------------------------
| API / Queue Producer Connection
|--------------------------------------------------------------------------
|
| Used when the application adds jobs to BullMQ.
| We do NOT want HTTP requests waiting forever if Redis is unavailable.
|
*/

export const createQueueRedisConnection =
  () => {
    return new IORedis(
      redisUrl,
      {
        maxRetriesPerRequest: 2,

        enableReadyCheck:
          false,

        retryStrategy,
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Worker Connection
|--------------------------------------------------------------------------
|
| BullMQ workers require maxRetriesPerRequest to be null.
| The worker can therefore survive temporary Redis/network outages and
| continue processing queued jobs after Redis reconnects.
|
*/

export const createWorkerRedisConnection =
  () => {
    return new IORedis(
      redisUrl,
      {
        maxRetriesPerRequest:
          null,

        enableReadyCheck:
          false,

        retryStrategy,
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Main Queue Connection
|--------------------------------------------------------------------------
*/

export const redisConnection =
  createQueueRedisConnection();

redisConnection.on(
  "connect",
  () => {
    console.log(
      "🟢 Redis connection established"
    );
  }
);

redisConnection.on(
  "ready",
  () => {
    console.log(
      "✅ Redis is ready"
    );
  }
);

redisConnection.on(
  "reconnecting",
  () => {
    console.log(
      "🟡 Redis reconnecting..."
    );
  }
);

redisConnection.on(
  "error",
  (error) => {
    console.error(
      "❌ Redis connection error:",
      error.message
    );
  }
);