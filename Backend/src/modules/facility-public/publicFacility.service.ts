import { PublicFacilityRepository } from "./publicFacility.repository";
import { BadRequestError } from "../../utils/errors/app.error";
import { categoryAmenities } from "../../config/categoryAmenities";

export class PublicFacilityService {
  static async search(query: any) {
    const {
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

    if (amenities && !categorySlug) {
      throw new BadRequestError("Category is required for amenities filter");
    }

    if (amenities && categorySlug) {
      const allowed = categoryAmenities[categorySlug] ?? [];
      const invalid = amenities.filter((a: string) => !allowed.includes(a));
      if (invalid.length > 0) {
        throw new BadRequestError(
          `Invalid amenities: ${invalid.join(", ")}`
        );
      }
    }

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit), 20);

    return PublicFacilityRepository.search({
      state,
      city,
      categorySlug,
      amenities,
      slotType,
      sortBy: sort === "rating" ? "rating" : "newest",
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });
  }
}
