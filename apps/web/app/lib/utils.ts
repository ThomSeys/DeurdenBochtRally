// Rally Zone validation and points calculation
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
}): number {
  let points = 0;
  let completedZones = 0;

  // Count completed zones (15 points each)
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

  // Bonus for all 8 zones
  if (completedZones === 8) {
    points += 20;
  }

  // Distance bonus
  if (submission.total_distance && submission.total_distance > 500) {
    points += 10;
  }

  // No highways bonus
  if (!submission.used_highways) {
    points += 10;
  }

  // Weather bonus
  if (submission.weather_bonus) {
    points += 5;
  }

  return points;
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
