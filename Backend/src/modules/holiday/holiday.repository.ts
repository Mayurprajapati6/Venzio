import { db } from "../../db";
import { holidays } from "../../db/schema";
import { and, eq, lte, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

export class HolidayRepository {
  static async create(data: {
    facilityId: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) {
    await db.insert(holidays).values({
      id: randomUUID(),
      ...data,
    });
  }

  // Prevent overlapping holiday ranges
  static async overlaps(
    facilityId: string,
    start: Date,
    end: Date
  ) {
    const rows = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.facilityId, facilityId),
          lte(holidays.startDate, end),
          gte(holidays.endDate, start)
        )
      );

    return rows.length > 0;
  }

  static async getRangesForFacility(facilityId: string) {
    return db
      .select({
        startDate: holidays.startDate,
        endDate: holidays.endDate,
      })
      .from(holidays)
      .where(eq(holidays.facilityId, facilityId));
  }

  static async delete(
    facilityId: string,
    startDate: Date,
    endDate: Date
  ) {
    await db
      .delete(holidays)
      .where(
        and(
          eq(holidays.facilityId, facilityId),
          eq(holidays.startDate, startDate),
          eq(holidays.endDate, endDate)
        )
      );
  }
}
