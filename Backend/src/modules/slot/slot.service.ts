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

    // ✅ ADD: at least one pass must exist
    if (
      price1Day == null &&
      price3Day == null &&
      price7Day == null
    ) {
      throw new BadRequestError(
        "At least one pass price must be provided"
      );
    }

    const from = new Date(validFrom);
    const till = new Date(validTill);

    // ✅ ADD: validity sanity
    if (till < from) {
      throw new BadRequestError("validTill must be after validFrom");
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
      facilityId,
      slotType,
      startTime,
      endTime,
      capacity,
      price1Day: price1Day ?? null,
      price3Day: price3Day ?? null,
      price7Day: price7Day ?? null,
      validFrom: from,
      validTill: till,
    });

    // unchanged
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

    // unchanged
    await SlotGenerationService.regenerateForFacility(facilityId);
  }
}
