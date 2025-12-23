import { HolidayRepository } from "./holiday.repository";
import { FacilityPolicy } from "../facility/facility.policy";
import { SlotGenerationService } from "../slot/slotGeneration.service";
import {
  BadRequestError,
  ConflictError,
} from "../../utils/errors/app.error";

export class HolidayService {
  static async addHoliday(
    ownerId: string,
    payload: {
      facilityId: string;
      startDate: string;
      endDate: string;
      reason?: string;
    }
  ) {
    const { facilityId, startDate, endDate, reason } = payload;

    if (!facilityId || !startDate || !endDate) {
      throw new BadRequestError("Missing required fields");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      throw new BadRequestError("End date must be after start date");
    }

    await FacilityPolicy.assertOwner(facilityId, ownerId);

    const overlaps = await HolidayRepository.overlaps(
      facilityId,
      start,
      end
    );

    if (overlaps) {
      throw new ConflictError(
        "Holiday period overlaps with existing holiday"
      );
    }

    await HolidayRepository.create({
      facilityId,
      startDate: start,
      endDate: end,
      reason,
    });

    // regenerate slots (holiday-aware)
    await SlotGenerationService.regenerateForFacility(facilityId);
  }

  static async remove(
    ownerId: string,
    facilityId: string,
    startDate: string,
    endDate: string
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    await FacilityPolicy.assertOwner(facilityId, ownerId);

    await HolidayRepository.delete(facilityId, start, end);

    await SlotGenerationService.regenerateForFacility(facilityId);
  }

  static async list(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    return HolidayRepository.getRangesForFacility(facilityId);
  }
}
