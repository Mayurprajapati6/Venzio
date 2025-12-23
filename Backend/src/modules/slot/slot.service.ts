import { randomUUID } from "crypto";
import { SlotRepository } from "./slot.repository";
import { FacilityPolicy } from "../facility/facility.policy";
import { SlotGenerationService } from "./slotGeneration.service";
import { BadRequestError, ConflictError } from "../../utils/errors/app.error";

type SlotType = "MORNING" | "AFTERNOON" | "EVENING";

export class SlotService {
  static async createTemplate(ownerId: string, payload: any) {
    const {
      facilityId,
      slotType,
      startTime,
      endTime,
      capacity,
      price1Day,
      price3Day,
      price7Day,
      validFrom,
      validTill,
    } = payload;

    if (
      !facilityId ||
      !slotType ||
      !startTime ||
      !endTime ||
      !capacity ||
      !validFrom ||
      !validTill
    ) {
      throw new BadRequestError("Missing required fields");
    }

    await FacilityPolicy.assertOwner(facilityId, ownerId);

    const existing = await SlotRepository.getTemplateByType(
      facilityId,
      slotType
    );

    if (existing) {
      throw new ConflictError(`${slotType} slot already exists`);
    }

    const templateId = randomUUID();

    await SlotRepository.createTemplate({
      id: templateId,
      ...payload,
    });

    await SlotGenerationService.generateForTemplate(templateId);
  }

   static async listTemplates(ownerId: string, facilityId: string) {
    await FacilityPolicy.assertOwner(facilityId, ownerId);
    return SlotRepository.getTemplatesByFacility(facilityId);
  }

  static async updateCapacity(
    ownerId: string,
    templateId: string,
    facilityId: string,
    slotType: SlotType,
    capacity: number
  ) {
    if (capacity <= 0) {
       throw new BadRequestError("Capacity must be greater than zero");
    }

    await FacilityPolicy.assertOwner(facilityId, ownerId);

    const maxBooked = await SlotRepository.getMaxBooked(
      facilityId,
      slotType
    );

    if (capacity < maxBooked) {
      throw new BadRequestError(
        `Capacity cannot be less than booked (${maxBooked})`
      );
    }

    await SlotRepository.updateTemplate(templateId, { capacity });

    await SlotGenerationService.regenerateForFacility(facilityId);
  }
}
