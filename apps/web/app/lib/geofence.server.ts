/**
 * GPS Geofence Validation Utilities
 * 
 * Validates GPS coordinates against zone boundaries
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if GPS coordinates are within geofence radius
 * 
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param zoneLat - Zone center latitude
 * @param zoneLon - Zone center longitude
 * @param radiusMeters - Allowed radius in meters (default: 30m)
 * @returns true if within geofence, false otherwise
 */
export function isWithinGeofence(
  userLat: number,
  userLon: number,
  zoneLat: number,
  zoneLon: number,
  radiusMeters: number = 30
): boolean {
  const distance = calculateDistance(userLat, userLon, zoneLat, zoneLon);
  return distance <= radiusMeters;
}

/**
 * Get geofence validation result with distance info
 */
export function validateGeofence(
  userLat: number,
  userLon: number,
  zoneLat: number,
  zoneLon: number,
  radiusMeters: number = 30
): {
  withinGeofence: boolean;
  distance: number;
  allowedRadius: number;
} {
  const distance = calculateDistance(userLat, userLon, zoneLat, zoneLon);
  
  return {
    withinGeofence: distance <= radiusMeters,
    distance: Math.round(distance),
    allowedRadius: radiusMeters,
  };
}

/**
 * Check if GPS accuracy is acceptable
 * Accuracy > 50m is considered low and should trigger manual review
 */
export function isGPSAccuracyGood(accuracy: number): boolean {
  return accuracy <= 50;
}
