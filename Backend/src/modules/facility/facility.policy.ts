import { FacilityRepository } from "./facility.repository";
import {
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";

export class FacilityPolicy {
  static async assertOwner(facilityId: string, ownerId: string) {
    const facility = await FacilityRepository.getById(facilityId);

    if (!facility) {
      throw new NotFoundError("Facility not found");
    }

    if (facility.ownerId !== ownerId) {
      throw new ForbiddenError("You do not own this facility");
    }

    return facility;
  }
}
