import { db } from "../../db";
import { facilities } from "../../db/schema";
import { and, eq, sql } from "drizzle-orm";

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

    const baseConditions = [
      eq(facilities.isPublished, true),
      eq(facilities.approvalStatus, "APPROVED"),
      eq(facilities.state, params.state),
    ];

    // -----------------------------
    // 🔢 MATCH SCORE
    // -----------------------------
    const scoreParts: any[] = [];

    if (params.city) {
      scoreParts.push(
        sql`CASE WHEN ${facilities.city} = ${params.city} THEN 10 ELSE 0 END`
      );
    }

    if (params.categorySlug) {
      scoreParts.push(
        sql`CASE WHEN ${facilities.categorySlug} = ${params.categorySlug} THEN 10 ELSE 0 END`
      );
    }

    if (params.amenities?.length) {
      for (const amenity of params.amenities) {
        scoreParts.push(
          sql`CASE 
            WHEN JSON_CONTAINS(${facilities.amenities}, ${JSON.stringify(amenity)})
            THEN 5 ELSE 0 END`
        );
      }
    }

    if (params.slotType) {
      scoreParts.push(
        sql`CASE WHEN EXISTS (
          SELECT 1 FROM facility_slots fs
          WHERE fs.facility_id = ${facilities.id}
            AND fs.slot_type = ${params.slotType}
            AND fs.capacity > fs.booked
            AND fs.date >= ${today}
        ) THEN 15 ELSE 0 END`
      );
    }

    const matchScore =
      scoreParts.length > 0
        ? sql<number>`(${sql.join(scoreParts, sql` + `)})`
        : sql<number>`0`;

    return db
  .select({
    id: facilities.id,
    name: facilities.name,
    categorySlug: facilities.categorySlug,
    city: facilities.city,
    state: facilities.state,
    address: facilities.address,
    description: facilities.description,
    amenities: facilities.amenities,
    latitude: facilities.latitude,
    longitude: facilities.longitude,
    rating: facilities.rating,
    totalReviews: facilities.totalReviews,
    createdAt: facilities.createdAt,

    matchScore,

    images: sql<string[]>`(
      SELECT JSON_ARRAYAGG(fi.image_url)
      FROM facility_images fi
      WHERE fi.facility_id = ${facilities.id}
    )`,
  })
  .from(facilities)
  .where(and(...baseConditions))
  .orderBy(
    sql`${matchScore} DESC`,
    params.sortBy === "rating"
      ? sql`${facilities.rating} DESC`
      : sql`${facilities.createdAt} DESC`
  )
  .limit(params.limit)
  .offset(params.offset);

  }
}
