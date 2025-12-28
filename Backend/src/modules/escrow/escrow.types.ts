/**
 * @file escrow.types.ts
 * Type definitions for Escrow module
 */

export type EscrowStatus = "HELD" | "RELEASED" | "PAUSED" | "REFUNDED";

export interface EscrowCreateInput {
  bookingId: string;
  ownerId: string;
  amountHeld: number;
  platformFee: number;
  releaseDate: Date;
}

export interface EscrowReleaseInput {
  escrowId: string;
  adminId?: string;
}

export interface EscrowRefundInput {
  escrowId: string;
  adminId?: string;
  reason?: string;
}

export interface EscrowBlockInput {
  escrowId: string;
  adminId: string;
  reason?: string;
}

export interface EscrowRecord {
  id: string;
  bookingId: string;
  ownerId: string;
  amountHeld: number;
  platformFee: number;
  status: EscrowStatus;
  releaseDate: Date;
  releasedAt: Date | null;
}

