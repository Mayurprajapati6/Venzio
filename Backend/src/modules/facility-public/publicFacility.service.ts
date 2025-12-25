import { PublicFacilityRepository } from "./publicFacility.repository";
import { BadRequestError } from "../../utils/errors/app.error";
import { categoryAmenities } from "../../config/categoryAmenities";
import {
  getCachedSearch,
  setCachedSearch,
  getSearchCacheKey,
} from "../../cache/search.cache";

export class PublicFacilityService {
  static async search(query: any) {
    let {
      state,
      city,
      categorySlug,
      amenities,
      slotType,
      sort = "newest",
      page = "1",
      limit = "10",
    } = query;

    if (!state) {
      throw new BadRequestError("State is required");
    }

    if (typeof amenities === "string") {
      amenities = amenities.split(",").map((a) => a.trim());
    }

    if (amenities && categorySlug) {
      const allowed = categoryAmenities[categorySlug] ?? [];
      const invalid = amenities.filter(
        (a: string) => !allowed.includes(a)
      );
      if (invalid.length) {
        throw new BadRequestError(
          `Invalid amenities: ${invalid.join(", ")}`
        );
      }
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit), 20);

    // -------------------------
    // 🔥 Redis cache
    // -------------------------
    const cacheKey = getSearchCacheKey({
      state,
      city,
      categorySlug,
      amenities,
      slotType,
      sort,
      page: pageNum,
      limit: limitNum,
    });

    const cached = await getCachedSearch(cacheKey);
    if (cached) return cached;

    const result = await PublicFacilityRepository.search({
      state,
      city,
      categorySlug,
      amenities,
      slotType,
      sortBy: sort === "rating" ? "rating" : "newest",
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    await setCachedSearch(cacheKey, result);

    return result;
  }
}
