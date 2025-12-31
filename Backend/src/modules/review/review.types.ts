export interface ReviewCreateInput {
  bookingId: string;
  userId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  facilityId: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

