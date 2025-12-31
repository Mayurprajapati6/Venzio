/**
 * @file escrow.repository.ts
 * Database operations for Escrow module
 */

import { db } from "../../db";
import { escrows } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { EscrowCreateInput, EscrowStatus } from "./escrow.types";

export class EscrowRepository {
  /**
   * Create a new escrow record
   */
  static async create(tx: any, data: EscrowCreateInput) {
    const escrowId = randomUUID();
    await tx.insert(escrows).values({
      id: escrowId,
      bookingId: data.bookingId,
      ownerId: data.ownerId,
      amountHeld: data.amountHeld,
      platformFee: data.platformFee,
      status: "HELD",
      releaseDate: data.releaseDate,
      releasedAt: null,
    });
    return escrowId;
  }

  /**
   * Find escrow by booking ID
   */
  static async findByBookingId(bookingId: string) {
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.bookingId, bookingId))
      .limit(1);
    return escrow ?? null;
  }

  /**
   * Find escrow by booking ID with lock (for transactions)
   */
  static async findByBookingIdLocked(tx: any, bookingId: string) {
    const rows = await tx.execute(sql`
      SELECT * FROM escrows
      WHERE booking_id = ${bookingId}
      FOR UPDATE
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Find escrow by ID
   */
  static async findById(escrowId: string) {
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, escrowId))
      .limit(1);
    return escrow ?? null;
  }

  /**
   * Find escrow by ID with lock (for transactions)
   */
  static async findByIdLocked(tx: any, escrowId: string) {
    const rows = await tx.execute(sql`
      SELECT * FROM escrows
      WHERE id = ${escrowId}
      FOR UPDATE
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Update escrow status
   */
  static async updateStatus(
    tx: any,
    escrowId: string,
    status: EscrowStatus,
    releasedAt?: Date | null
  ) {
    await tx
      .update(escrows)
      .set({
        status,
        releasedAt: releasedAt !== undefined ? releasedAt : undefined,
      })
      .where(eq(escrows.id, escrowId));
  }

  /**
   * Check if escrow exists for booking
   */
  static async existsForBooking(tx: any, bookingId: string) {
    const rows = await tx.execute(sql`
      SELECT 1 FROM escrows
      WHERE booking_id = ${bookingId}
      LIMIT 1
    `) as any[];
    return rows.length > 0;
  }

  /**
   * Get escrows ready for auto-release
   * (status = HELD, releaseDate <= now, booking not DISPUTED)
   */
  static async findReadyForRelease() {
    const now = new Date();
    const rows = await db.execute(sql`
      SELECT e.* FROM escrows e
      INNER JOIN bookings b ON e.booking_id = b.id
      WHERE e.status = 'HELD'
        AND e.release_date <= ${now}
        AND b.status != 'DISPUTED'
      FOR UPDATE SKIP LOCKED
      LIMIT 100
    `) as any[];
    return rows;
  }

  /**
   * Check if dispute exists for booking
   */
  static async hasActiveDispute(tx: any, bookingId: string) {
    const rows = await tx.execute(sql`
      SELECT 1 FROM disputes
      WHERE booking_id = ${bookingId}
        AND status IN ('SUBMITTED', 'UNDER_REVIEW')
      LIMIT 1
    `) as any[];
    return rows.length > 0;
  }

  static async getTodayEscrows() {
    return db.execute(sql`
      SELECT 
        e.*,
        b.user_id,
        b.pass_days,
        b.end_date,
        f.name AS facility_name,
        f.id AS facility_id
      FROM escrows e
      JOIN bookings b ON b.id = e.booking_id
      JOIN facilities f ON f.id = b.facility_id
      WHERE e.status = 'HELD'
        AND DATE(e.release_date) = CURRENT_DATE
      ORDER BY f.id
    `);
  }

  // 🟡 UPCOMING (rolling next 7 days)
  static async getUpcomingEscrows() {
    return db.execute(sql`
      SELECT 
        e.*,
        b.user_id,
        b.pass_days,
        b.end_date,
        f.name AS facility_name,
        f.id AS facility_id
      FROM escrows e
      JOIN bookings b ON b.id = e.booking_id
      JOIN facilities f ON f.id = b.facility_id
      WHERE e.status = 'HELD'
        AND DATE(e.release_date) BETWEEN CURRENT_DATE + INTERVAL 1 DAY
                                     AND CURRENT_DATE + INTERVAL 7 DAY
      ORDER BY e.release_date ASC
    `);
  }

  // ⚫ EXPIRED (already released)
  static async getExpiredEscrows() {
    return db.execute(sql`
      SELECT 
        e.*,
        b.user_id,
        b.pass_days,
        b.end_date,
        f.name AS facility_name,
        f.id AS facility_id
      FROM escrows e
      JOIN bookings b ON b.id = e.booking_id
      JOIN facilities f ON f.id = b.facility_id
      WHERE e.status = 'RELEASED'
      ORDER BY e.released_at DESC
    `);
  }
}

