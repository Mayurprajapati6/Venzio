import { randomUUID } from "crypto";
import { FacilityRepository } from "./facility.repository";
import { FacilityPolicy } from "./facility.policy";
import { BadRequestError } from "../../utils/errors/app.error";
import { CategoryRepository } from "../category/category.repository";
import { categoryAmenities } from "../../config/categoryAmenities";

export class FacilityService {
  static async create(ownerId: string, payload: any) {
    if (!payload.categoryId || !payload.name || !payload.city) {
      throw new BadRequestError("Missing required fields");
    }

    const category = await CategoryRepository.getById(payload.categoryId);
    if (!category) throw new BadRequestError("Invalid category");

    const allowedAmenities = categoryAmenities[category.slug] ?? [];
    const selectedAmenities = payload.amenities ?? [];

    const invalid = selectedAmenities.filter(
      (a: string) => !allowedAmenities.includes(a)
    );

    if (invalid.length) {
      throw new BadRequestError(`Invalid amenities: ${invalid.join(", ")}`);
    }

    const facilityId = randomUUID();

    await FacilityRepository.createFacility({
      id: facilityId,
      ownerId,
      categoryId: category.id,
      categorySlug: category.slug,
      name: payload.name,
      city: payload.city,
      state: payload.state,
      address: payload.address,
      description: payload.description ?? null,
      amenities: selectedAmenities,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      approvalStatus: "DRAFT",
      isPublished: false,
    });

    await FacilityRepository.addImages(facilityId, payload.images ?? []);

    return { facilityId };
  }

  static async submitForApproval(ownerId: string, facilityId: string) {
    const facility = await FacilityPolicy.assertOwner(facilityId, ownerId);

    if (facility.approvalStatus !== "DRAFT") {
      throw new BadRequestError("Facility already submitted");
    }

    await FacilityRepository.updateApprovalStatus(facilityId, "PENDING");
  }

  static async listMyFacilities(ownerId: string) {
    return FacilityRepository.getByOwner(ownerId);
  }

  static async delete(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    await FacilityRepository.deleteFacility(facilityId);
  }

  // ADMIN
  static adminPending() {
    return FacilityRepository.getPendingApproval();
  }

  static adminApprove(id: string) {
    return FacilityRepository.updateApprovalStatus(id, "APPROVED");
  }

  static adminReject(id: string, reason: string) {
    if (!reason) throw new BadRequestError("Reason required");
    return FacilityRepository.updateApprovalStatus(id, "REJECTED", reason);
  }
}
