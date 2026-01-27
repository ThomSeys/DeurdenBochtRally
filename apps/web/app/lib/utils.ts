// Rally Zone validation and points calculation - DISABLED FOR V1
// V1 Focus: Stories and experience, not competition
// Points system kept for potential future use but not active
// 
// Type A (Short): 5-8 km, 1 checkpoint = 12 points
// Type B (Medium): 15-25 km, 2 checkpoints = 20 points (10 per checkpoint)
// Type C (Long): 30-45 km, 3 checkpoints = 35 points (12+12+11)

export const ZONE_TYPE_POINTS = {
  short: { base: 12, perCheckpoint: 12, checkpoints: 1 },
  medium: { base: 20, perCheckpoint: 10, checkpoints: 2 },
  long: { base: 35, perCheckpoint: 12, checkpoints: 3 },
} as const;

export const ZONE_TYPE_LABELS = {
  short: 'Type A – Korte Verleider',
  medium: 'Type B – Beslisser', 
  long: 'Type C – De Grote Omweg',
} as const;

export function calculateRallyPoints(submission: {
  rz1_code?: string | null;
  rz2_code?: string | null;
  rz3_code?: string | null;
  rz4_code?: string | null;
  rz5_code?: string | null;
  rz6_code?: string | null;
  rz7_code?: string | null;
  rz8_code?: string | null;
  total_distance?: number | null;
  used_highways?: boolean;
  weather_bonus?: boolean;
  short_zones_completed?: number | null;
  medium_zones_completed?: number | null;
  long_zones_completed?: number | null;
}): number {
  // V1: Points system disabled - focus on stories and experience
  // Return 0 for all submissions
  // This function is kept for potential future competition mode
  return 0;
  
  /* DISABLED CODE - kept for future reference
  let points = 0;

  // New calculation method if zone type data is available
  if (
    submission.short_zones_completed !== undefined ||
    submission.medium_zones_completed !== undefined ||
    submission.long_zones_completed !== undefined
  ) {
    const shortZones = submission.short_zones_completed || 0;
    const mediumZones = submission.medium_zones_completed || 0;
    const longZones = submission.long_zones_completed || 0;

    // Calculate points by zone type
    points += shortZones * ZONE_TYPE_POINTS.short.base;
    points += mediumZones * ZONE_TYPE_POINTS.medium.base;
    points += longZones * ZONE_TYPE_POINTS.long.base;

    const totalZones = shortZones + mediumZones + longZones;

    // Bonus for completing all 8 zones (strategic completion)
    if (totalZones === 8) {
      points += 30; // Increased from 20 due to higher difficulty
    }

    // Bonus for completing minimum zone requirements (4+ zones for qualification)
    if (totalZones >= 4 && totalZones < 8) {
      points += 10;
    }
  } else {
    // Legacy calculation method (15 points per zone)
    let completedZones = 0;

    const zones = [
      submission.rz1_code,
      submission.rz2_code,
      submission.rz3_code,
      submission.rz4_code,
      submission.rz5_code,
      submission.rz6_code,
      submission.rz7_code,
      submission.rz8_code,
    ];

    zones.forEach((code) => {
      if (code && code.trim()) {
        points += 15;
        completedZones++;
      }
    });

    // Bonus for all 8 zones (legacy)
    if (completedZones === 8) {
      points += 20;
    }
  }

  // Distance bonus (unchanged)
  if (submission.total_distance && submission.total_distance > 500) {
    points += 10;
  }

  // No highways bonus (unchanged)
  if (!submission.used_highways) {
    points += 10;
  }

  // Weather bonus (unchanged)
  if (submission.weather_bonus) {
    points += 5;
  }

  return points;
}
*/
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const FORMULA_PRICES = {
  with_meals: 2000, // €20.00 in cents
  breakfast_only: 1000, // €10.00 in cents
} as const;

export const FORMULA_LABELS = {
  with_meals: 'Met alle maaltijden',
  breakfast_only: 'Enkel ontbijt',
} as const;

export const RIDE_TYPE_LABELS = {
  free: 'Vrije rit',
  guided: 'Begeleide rit',
} as const;
