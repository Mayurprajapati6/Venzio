import { redis } from "../lib/redis";

const TTL_SECONDS = 60 * 10; // 10 minutes

export async function checkIdempotency(key: string) {
  const cached = await redis.get(`idem:${key}`);
  return cached ? JSON.parse(cached) : null;
}

export async function saveIdempotency(key: string, response: any) {
  await redis.set(
    `idem:${key}`,
    JSON.stringify(response),
    "EX",
    TTL_SECONDS
  );
}
