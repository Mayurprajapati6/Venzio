export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

export const PLATFORM_FEE_MAP: Record<number, number> = {
  1: 2,
  3: 5,
  7: 7,
};

export const ALLOWED_PASS_DAYS = [1, 3, 7] as const;
