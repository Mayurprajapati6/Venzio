import { FacilityRepository } from "./facility.repository";
import {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../../utils/errors/app.error";

export class FacilityPolicy {
  static async assertOwner(facilityId: string, ownerId: string) {
    const facility = await FacilityRepository.getById(facilityId);

    if (!facility) throw new NotFoundError("Facility not found");
    if (facility.ownerId !== ownerId)
      throw new ForbiddenError("Not your facility");

    return facility;
  }

  static assertApproved(facility: any) {
    if (facility.approvalStatus !== "APPROVED") {
      throw new BadRequestError("Facility not approved by admin");
    }
  }
}
