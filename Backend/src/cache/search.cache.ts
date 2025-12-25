import { redis } from "../lib/redis";

const SEARCH_CACHE_TTL = 60 * 5; // 5 minutes

function normalizeQuery(query: any) {
  return {
    state: query.state,
    city: query.city ?? null,
    categorySlug: query.categorySlug ?? null,
    amenities: Array.isArray(query.amenities)
      ? [...query.amenities].sort()
      : null,
    slotType: query.slotType ?? null,
    sort: query.sort ?? "newest",
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 10),
  };
}

export function getSearchCacheKey(query: any) {
  const normalized = normalizeQuery(query);
  return `search:${JSON.stringify(normalized)}`;
}

export async function getCachedSearch(key: string) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedSearch(key: string, data: any) {
  await redis.set(key, JSON.stringify(data), "EX", SEARCH_CACHE_TTL);
}
