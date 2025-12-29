import { SlotRepository } from "./slot.repository";
import { HolidayRepository } from "../holiday/holiday.repository";
import { db } from "../../db";
import { slotTemplates } from "../../db/schema";
import { eq } from "drizzle-orm";


const AUTO_EXTEND_DAYS = 15;

export class SlotGenerationService {
  static async generateForTemplate(templateId: string) {
    const [template] = await db
      .select()
      .from(slotTemplates)
      .where(eq(slotTemplates.id, templateId));

    if (!template) return;

    const holidayRanges =
      await HolidayRepository.getRangesForFacility(template.facilityId);

    const isHoliday = (date: Date) =>
      holidayRanges.some(
        (h) => date >= h.startDate && date <= h.endDate
      );

    let current = new Date(template.validFrom);
    current.setHours(0, 0, 0, 0);

  
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let end = new Date(template.validTill);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      end = new Date(today);
      end.setDate(end.getDate() + AUTO_EXTEND_DAYS);

      await SlotRepository.updateTemplate(template.id, {
        validTill: end,
      });
    }

    while (current <= end) {
      if (!isHoliday(current)) {
        const exists = await SlotRepository.slotExists(
          template.facilityId,
          current,
          template.slotType
        );

        if (!exists) {
          await SlotRepository.createFacilitySlot(
            template.facilityId,
            current,
            template.slotType,
            template.capacity
          );
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  static async regenerateForFacility(facilityId: string) {
    const templates = await SlotRepository.getTemplatesByFacility(facilityId);
    for (const tpl of templates) {
      await this.generateForTemplate(tpl.id);
    }
  }
}
