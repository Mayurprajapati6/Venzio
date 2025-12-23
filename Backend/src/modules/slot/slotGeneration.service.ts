import { SlotRepository } from "./slot.repository";
import { HolidayRepository } from "../holiday/holiday.repository";
import { db } from "../../db";
import { slotTemplates } from "../../db/schema";
import { eq } from "drizzle-orm";

export class SlotGenerationService {
  /**
   * Generate facility slots for ONE template
   * - respects template validity (validFrom → validTill)
   * - skips holidays (date ranges)
   * - idempotent (safe to re-run)
   */
  static async generateForTemplate(templateId: string) {
    const [template] = await db
      .select()
      .from(slotTemplates)
      .where(eq(slotTemplates.id, templateId));

    if (!template) return;

    // Fetch holiday ranges for this facility
    const holidayRanges =
      await HolidayRepository.getRangesForFacility(
        template.facilityId
      );

    const isHoliday = (date: Date) =>
      holidayRanges.some(
        (h) => date >= h.startDate && date <= h.endDate
      );

    let current = new Date(template.validFrom);
    current.setHours(0, 0, 0, 0);

    const end = new Date(template.validTill);
    end.setHours(0, 0, 0, 0);

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

  /**
   * Regenerate slots for ALL templates of a facility
   * Called when:
   * - holiday added / removed
   * - template created / extended
   */
  static async regenerateForFacility(facilityId: string) {
    const templates =
      await SlotRepository.getTemplatesByFacility(facilityId);

    for (const tpl of templates) {
      await this.generateForTemplate(tpl.id);
    }
  }
}
