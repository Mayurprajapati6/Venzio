/**
 * @file dispute.repository.ts
 * Database operations for Dispute module
 */

import { db } from "../../db";
import { disputes } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { DisputeCreateInput, DisputeStatus } from "./dispute.types";

export class DisputeRepository {
  /**
   * Create a new dispute
   */
  static async create(tx: any, data: DisputeCreateInput) {
    const disputeId = randomUUID();
    await tx.insert(disputes).values({
      id: disputeId,
      bookingId: data.bookingId,
      userId: data.userId,
      ownerId: data.ownerId,
      facilityId: data.facilityId,
      reason: data.reason,
      description: data.description || null,
      evidenceImage: data.evidenceImage || null,
      // Store GPS as DECIMAL (not STRING) for proper indexing and calculations
      userGpsLat: data.userGpsLat !== undefined ? data.userGpsLat : null,
      userGpsLng: data.userGpsLng !== undefined ? data.userGpsLng : null,
      status: "SUBMITTED",
      adminDecision: null,
      refundAmount: null,
    });
    return disputeId;
  }

  /**
   * Find dispute by ID
   */
  static async findById(disputeId: string) {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, disputeId))
      .limit(1);
    return dispute ?? null;
  }

  /**
   * Find dispute by ID with lock (for transactions)
   */
  static async findByIdLocked(tx: any, disputeId: string) {
    const rows = await tx.execute(sql`
      SELECT * FROM disputes
      WHERE id = ${disputeId}
      FOR UPDATE
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Find dispute by booking ID
   */
  static async findByBookingId(bookingId: string) {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.bookingId, bookingId))
      .limit(1);
    return dispute ?? null;
  }

  /**
   * Check if active dispute exists for booking
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

  /**
   * Update dispute status
   */
  static async updateStatus(
    tx: any,
    disputeId: string,
    status: DisputeStatus,
    adminDecision?: string,
    refundAmount?: number
  ) {
    await tx
      .update(disputes)
      .set({
        status,
        adminDecision: adminDecision || undefined,
        refundAmount: refundAmount || undefined,
        updatedAt: new Date(),
      })
      .where(eq(disputes.id, disputeId));
  }

  /**
   * Get booking for dispute validation
   */
  static async getBookingForDispute(tx: any, bookingId: string) {
    const rows = await tx.execute(sql`
      SELECT * FROM bookings
      WHERE id = ${bookingId}
      FOR UPDATE
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Get facility coordinates and ownerId
   */
  static async getFacilityCoordinates(tx: any, facilityId: string) {
    const rows = await tx.execute(sql`
      SELECT latitude, longitude, owner_id FROM facilities
      WHERE id = ${facilityId}
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Get slot template for time validation
   */
  static async getSlotTemplate(
    tx: any,
    facilityId: string,
    slotType: string
  ) {
    const rows = await tx.execute(sql`
      SELECT start_time, end_time FROM slot_templates
      WHERE facility_id = ${facilityId}
        AND slot_type = ${slotType}
        AND is_active = true
      LIMIT 1
    `) as any[];
    return rows[0] ?? null;
  }

  /**
   * Check if attendance exists for booking
   */
  static async hasAttendance(tx: any, bookingId: string) {
    const rows = await tx.execute(sql`
      SELECT 1 FROM attendance
      WHERE booking_id = ${bookingId}
      LIMIT 1
    `) as any[];
    return rows.length > 0;
  }

  /**
   * Count false disputes by user
   */
  static async countFalseDisputesByUser(userId: string) {
    const rows = await db.execute(sql`
      SELECT COUNT(*) as count FROM disputes
      WHERE user_id = ${userId}
        AND status = 'RESOLVED_REJECTED'
    `) as any[];
    return rows[0]?.count || 0;
  }

  /**
   * Update user trust score
   */
  static async updateUserTrustScore(
    tx: any,
    userId: string,
    delta: number
  ) {
    await tx.execute(sql`
      UPDATE users
      SET trust_score = GREATEST(0, LEAST(100, trust_score + ${delta}))
      WHERE id = ${userId}
    `);
  }

  /**
   * Update user account status
   */
  static async updateUserAccountStatus(
    tx: any,
    userId: string,
    status: "ACTIVE" | "UNDER_MONITORING" | "SUSPENDED"
  ) {
    await tx.execute(sql`
      UPDATE users
      SET account_status = ${status}
      WHERE id = ${userId}
    `);
  }

  /**
   * Get all disputes (admin)
   */
  static async getAllDisputes(status?: DisputeStatus) {
    if (status) {
      return await db
        .select()
        .from(disputes)
        .where(eq(disputes.status, status))
        .orderBy(sql`created_at DESC`);
    }
    return await db.select().from(disputes).orderBy(sql`created_at DESC`);
  }

  /**
   * Get disputes by user
   */
  static async getDisputesByUser(userId: string) {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.userId, userId))
      .orderBy(sql`created_at DESC`);
  }

  /**
   * Get disputes by owner
   */
  static async getDisputesByOwner(ownerId: string) {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.ownerId, ownerId))
      .orderBy(sql`created_at DESC`);
  }
}

