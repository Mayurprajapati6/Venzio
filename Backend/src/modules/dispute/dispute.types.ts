/**
 * @file dispute.types.ts
 * Type definitions for Dispute module
 */

export type DisputeReason =
  | "ENTRY_DENIED"
  | "FACILITY_CLOSED"
  | "SLOT_MISMATCH"
  | "OTHER";

export type DisputeStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RESOLVED_REFUND"
  | "RESOLVED_REJECTED";

export interface DisputeCreateInput {
  bookingId: string;
  userId: string;
  ownerId: string;
  facilityId: string;
  reason: DisputeReason;
  description?: string;
  evidenceImage?: string;
  userGpsLat?: number;
  userGpsLng?: number;
}

export interface DisputeResolveInput {
  disputeId: string;
  adminId: string;
  decision: "REFUND" | "REJECT";
  adminDecision: string;
}

export interface DisputeRecord {
  id: string;
  bookingId: string;
  userId: string;
  ownerId: string;
  facilityId: string;
  reason: DisputeReason;
  description: string | null;
  evidenceImage: string | null;
  userGpsLat: number | null;
  userGpsLng: number | null;
  status: DisputeStatus;
  adminDecision: string | null;
  refundAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

