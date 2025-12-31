import { db } from "../../db";
import { reviews, bookings, facilities } from "../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class ReviewRepository {
  /**
   * Create a new review
   */
  static async create(tx: any, data: {
    id: string;
    userId: string;
    facilityId: string;
    bookingId: string;
    rating: number;
    comment?: string;
  }) {
    await tx.insert(reviews).values({
      id: data.id,
      userId: data.userId,
      facilityId: data.facilityId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment || null,
    });
  }

  /**
   * Check if review already exists for booking
   */
  static async existsForBooking(tx: any, bookingId: string): Promise<boolean> {
    const rows = await tx.execute(
      sql`SELECT 1 FROM reviews WHERE booking_id = ${bookingId} LIMIT 1`
    ) as any[];
    return rows.length > 0;
  }

  /**
   * Get booking with lock for validation
   */
  static async getBookingForReview(
    tx: any,
    bookingId: string,
    userId: string
  ) {
    const rows = await tx.execute(
      sql`SELECT * FROM bookings 
          WHERE id = ${bookingId} AND user_id = ${userId} 
          FOR UPDATE`
    ) as any[];
    return rows[0] ?? null;
  }

  /**
   * Get facility for rating update
   */
  static async getFacilityForRating(tx: any, facilityId: string) {
    const rows = await tx.execute(
      sql`SELECT rating, total_reviews FROM facilities 
          WHERE id = ${facilityId} 
          FOR UPDATE`
    ) as any[];
    return rows[0] ?? null;
  }

  /**
   * Update facility rating and total reviews
   */
  static async updateFacilityRating(
    tx: any,
    facilityId: string,
    newRating: number,
    totalReviews: number
  ) {
    await tx.execute(
      sql`UPDATE facilities 
          SET rating = ${newRating}, 
              total_reviews = ${totalReviews}
          WHERE id = ${facilityId}`
    );
  }

  /**
   * Get review by ID
   */
  static async findById(reviewId: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    return review ?? null;
  }

  /**
   * Get review by booking ID
   */
  static async findByBookingId(bookingId: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, bookingId))
      .limit(1);

    return review ?? null;
  }

  /**
   * Get reviews by facility ID (paginated)
   */
  static async findByFacilityId(
    facilityId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.facilityId, facilityId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get all reviews (admin)
   */
  static async getAll(limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count reviews for facility
   */
  static async countByFacilityId(facilityId: string): Promise<number> {
    const rows = await db.execute(
      sql`SELECT COUNT(*) as count FROM reviews WHERE facility_id = ${facilityId}`
    ) as any[];
    return rows[0]?.count || 0;
  }
}

