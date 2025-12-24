export type CreateFacilityDTO = {
  categoryId: number;
  name: string;
  city: string;
  state: string;
  address: string;
  amenities: string[];
  description?: string;
  latitude?: number;
  longitude?: number;
  images?: { url: string; isPrimary?: boolean }[];
};
