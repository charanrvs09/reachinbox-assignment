import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis(
  process.env.REDIS_URL ||
    "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const DEFAULT_DELAY_MS = 1000;

interface ThrottleResult {
  allowed: boolean;
  delayMs: number;
}

export async function reserveSendSlot(
  sender: string
): Promise<ThrottleResult> {
  const configuredDelay = Number(
    process.env.MIN_SEND_DELAY_MS ||
      DEFAULT_DELAY_MS
  );

  const minDelayMs =
    Number.isFinite(configuredDelay) &&
    configuredDelay >= 0
      ? configuredDelay
      : DEFAULT_DELAY_MS;

  if (minDelayMs === 0) {
    return {
      allowed: true,
      delayMs: 0,
    };
  }

  const key = `email-send-throttle:${sender}`;

  const result = (await redis.eval(
    `
      local now = tonumber(ARGV[1])
      local delay = tonumber(ARGV[2])

      local nextAllowed =
        tonumber(redis.call("GET", KEYS[1]) or "0")

      if now >= nextAllowed then
        local newNextAllowed = now + delay

        redis.call(
          "SET",
          KEYS[1],
          newNextAllowed,
          "PX",
          delay + 60000
        )

        return {1, 0}
      end

      local waitMs = nextAllowed - now

      return {0, waitMs}
    `,
    1,
    key,
    Date.now(),
    minDelayMs
  )) as [number, number];

  return {
    allowed: result[0] === 1,
    delayMs: Math.max(0, result[1]),
  };
}