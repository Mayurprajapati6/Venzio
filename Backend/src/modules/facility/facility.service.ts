import { randomUUID } from "crypto";
import { FacilityRepository } from "./facility.repository";
import { FacilityPolicy } from "./facility.policy";
import { ForbiddenError, BadRequestError } from "../../utils/errors/app.error";
import { CategoryRepository } from "../category/category.repository";
import { categoryAmenities } from "../../config/categoryAmenities";

export class FacilityService {
  static async create(ownerId: string, payload: any) {
  
    if (
      !payload.categoryId ||
      !payload.name ||
      !payload.city ||
      !payload.state ||
      !payload.address
    ) {
      throw new BadRequestError("Missing required fields");
    }

   
    const category = await CategoryRepository.getById(payload.categoryId);
    if (!category) {
      throw new BadRequestError("Invalid category");
    }

    const categorySlug = category.slug; 

    
    const allowedAmenities = categoryAmenities[categorySlug] ?? [];

    const selectedAmenities: string[] = Array.isArray(payload.amenities)
      ? payload.amenities
      : [];

    const invalidAmenities = selectedAmenities.filter(
      (a) => !allowedAmenities.includes(a)
    );

    if (invalidAmenities.length > 0) {
      throw new BadRequestError(
        `Invalid amenities: ${invalidAmenities.join(", ")}`
      );
    }

    
    const facilityId = randomUUID();

    await FacilityRepository.createFacility({
      id: facilityId,
      ownerId,
      categoryId: category.id,
      categorySlug,

      name: payload.name,
      city: payload.city,
      state: payload.state,
      address: payload.address,
      description: payload.description ?? null,

      amenities: selectedAmenities,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,

      autoAccept: payload.autoAccept ?? true,
      isPublished: false,
    });

   
    await FacilityRepository.addImages(
      facilityId,
      payload.images ?? []
    );

    return { facilityId };
  }

  static async listMyFacilities(ownerId: string) {
    return FacilityRepository.getByOwner(ownerId);
  }

  static async publish(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    await FacilityRepository.updatePublishStatus(facilityId, true);
  }

  static async unpublish(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    await FacilityRepository.updatePublishStatus(facilityId, false);
  }

  static async delete(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    await FacilityRepository.deleteFacility(facilityId);
  }

  static async adminPendingFacilities() {
    return FacilityRepository.getPendingApproval();
  }

  static async adminApprove(facilityId: string) {
    await FacilityRepository.approve(facilityId);
  }

  static async adminReject(facilityId: string, reason: string) {
    if (!reason) {
      throw new BadRequestError("Rejection reason required");
    }

    await FacilityRepository.reject(facilityId, reason);
  }
}
