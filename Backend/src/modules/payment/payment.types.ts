export interface PaymentMetadata {
  receipt?: string;
  ownerId?: string;
  tempSubscriptionId?: string;
  notes?: {
    ownerId?: string;
    bookingId?: string;
    userId?: string;
    entityType?: "BOOKING" | "SUBSCRIPTION";
  };
}
