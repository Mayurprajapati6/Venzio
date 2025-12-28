/**
 * @file geo.ts
 * Geographic distance calculation utilities
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if user is within acceptable distance from facility
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param facilityLat Facility's latitude
 * @param facilityLng Facility's longitude
 * @param maxDistanceKm Maximum allowed distance in kilometers (default: 0.5km = 500m)
 * @returns Object with isWithinRange and distanceKm
 */
export function isWithinRange(
  userLat: number,
  userLng: number,
  facilityLat: number,
  facilityLng: number,
  maxDistanceKm: number = 0.5
): { isWithinRange: boolean; distanceKm: number } {
  const distanceKm = calculateDistance(
    userLat,
    userLng,
    facilityLat,
    facilityLng
  );
  return {
    isWithinRange: distanceKm <= maxDistanceKm,
    distanceKm,
  };
}

