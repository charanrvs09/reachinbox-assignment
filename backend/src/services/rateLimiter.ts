import IORedis from "ioredis";

const redis = new IORedis("redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

export async function checkHourlyLimit(
  sender: string,
  limit: number
): Promise<RateLimitResult> {
  const now = new Date();

  // Create a bucket for the current UTC hour.
  //
  // Example:
  // 2026-09-02T16:xx:xx
  // becomes:
  // 2026-09-02T16
  const currentHour = now
    .toISOString()
    .slice(0, 13);

  const key = `email-rate:${sender}:${currentHour}`;

  // Calculate the exact number of seconds
  // until the next UTC hour.
  const nextHour = new Date(now);

  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(
    nextHour.getUTCHours() + 1
  );

  const secondsUntilNextHour = Math.max(
    1,
    Math.ceil(
      (nextHour.getTime() - now.getTime()) / 1000
    )
  );

  // Lua script makes the increment/check operation atomic.
  //
  // This prevents multiple workers from exceeding
  // the hourly limit at the same time.
  const result = (await redis.eval(
    `
      local count = redis.call("INCR", KEYS[1])

      if count == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[2])
      end

      local limit = tonumber(ARGV[1])

      if count <= limit then
        return {1, count, 0}
      end

      redis.call("DECR", KEYS[1])

      local ttl = redis.call("TTL", KEYS[1])

      return {0, limit, ttl}
    `,
    1,
    key,
    limit,
    secondsUntilNextHour
  )) as [number, number, number];

  const allowed = result[0] === 1;
  const count = result[1];
  const retryAfterSeconds = result[2];

  return {
    allowed,
    count,
    limit,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, retryAfterSeconds),
  };
}