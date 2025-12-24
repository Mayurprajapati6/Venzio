import { db } from "../../db";
import {
  facilities,
  
} from "../../db/schema";
import { and, eq,  sql,  } from "drizzle-orm";

export class PublicFacilityRepository {
  static async search(params: {
    state: string;
    city?: string;
    categorySlug?: string;
    amenities?: string[];
    slotType?: "MORNING" | "AFTERNOON" | "EVENING";
    sortBy: "rating" | "newest";
    limit: number;
    offset: number;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conditions = [
      eq(facilities.isPublished, true),
      eq(facilities.approvalStatus, "APPROVED"),
      eq(facilities.state, params.state),
    ];

    if (params.city) {
      conditions.push(eq(facilities.city, params.city));
    }

    if (params.categorySlug) {
      conditions.push(eq(facilities.categorySlug, params.categorySlug));
    }

    if (params.amenities && params.amenities.length > 0) {
      conditions.push(
        sql`${facilities.amenities} @> ${JSON.stringify(params.amenities)}`
      );
    }

    if (params.slotType) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM facility_slots fs
          WHERE fs.facility_id = ${facilities.id}
            AND fs.slot_type = ${params.slotType}
            AND fs.capacity > fs.booked
            AND fs.date >= ${today}
            AND NOT EXISTS (
              SELECT 1 FROM holidays h
              WHERE h.facility_id = fs.facility_id
                AND fs.date BETWEEN h.start_date AND h.end_date
            )
        )`
      );
    }

    const orderBy =
      params.sortBy === "rating"
        ? sql`${facilities.rating} DESC`
        : sql`${facilities.createdAt} DESC`;

    return db
      .select({
        id: facilities.id,
        name: facilities.name,
        city: facilities.city,
        state: facilities.state,
        rating: facilities.rating,
        categorySlug: facilities.categorySlug,
        image: sql<string>`
          (
            SELECT fi.image_url
            FROM facility_images fi
            WHERE fi.facility_id = ${facilities.id}
            ORDER BY fi.is_primary DESC
            LIMIT 1
          )
        `,
      })
      .from(facilities)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(params.limit)
      .offset(params.offset);
  }
}
