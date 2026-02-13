/**
 * Client-side API route wrappers for consistent offline support
 * These routes handle caching and offline fallback automatically
 */

import { fetchWithOfflineFallback } from '~/lib/offline.utils';

// ==================== RALLY DATA ====================

export interface RallyZone {
  _id: string;
  title: string;
  location: string;
  color: string;
  startLocation: any;
  endLocation: any;
  is_open: boolean;
  gpxRoute: { asset: { url: string } } | null;
  skipRoute?: {
    instructions?: string;
    estimatedDistance?: number;
    startPoint?: { lat?: number; lng?: number };
    endPoint?: { lat?: number; lng?: number };
    gpxFile?: { asset?: { url?: string } } | null;
  } | null;
}

export async function fetchRallyZones() {
  const result = await fetchWithOfflineFallback<RallyZone[]>(
    '/api/rally-zones',
    { cacheKey: 'rally-zones' }
  );
  return result;
}

// ==================== CHECK-INS ====================

export interface CheckInData {
  participant_id: string;
  zone_id: number;
  entry_latitude: number;
  entry_longitude: number;
  answer_latitude: number;
  answer_longitude: number;
  created_at: string;
  participants: {
    first_name: string;
    last_name: string;
    motorcycle_brand: string;
    motorcycle_model: string;
  };
}

export async function fetchCheckIns() {
  const result = await fetchWithOfflineFallback<CheckInData[]>(
    '/api/check-ins',
    { cacheKey: 'check-ins' }
  );
  return result;
}

// ==================== EVENT MARKERS ====================

export interface EventMarker {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: any;
  severity: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEventMarkers() {
  const result = await fetchWithOfflineFallback<EventMarker[]>(
    '/api/event-markers',
    { cacheKey: 'event-markers' }
  );
  return result;
}

// ==================== GPX ROUTES ====================

export async function fetchGPXRoute() {
  const result = await fetchWithOfflineFallback<{ url: string }>(
    '/api/gpx-route',
    { cacheKey: 'gpx-route' }
  );
  return result;
}

// ==================== LEADERBOARD ====================

export interface LeaderboardEntry {
  rank: number;
  participant_id: string;
  first_name: string;
  last_name: string;
  license_plate: string;
  totalScore: number;
  basicPoints: number;
  shadowTotal: number;
  completedZones: number;
}

export async function fetchLeaderboard() {
  const result = await fetchWithOfflineFallback<LeaderboardEntry[]>(
    '/api/leaderboard',
    { cacheKey: 'leaderboard' }
  );
  return result;
}

// ==================== PARTICIPANT DATA ====================

export interface ParticipantData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  motorcycle_brand: string;
  motorcycle_model: string;
  license_plate: string;
  formula: string;
  ride_type: string;
  checked_in: boolean;
}

export async function fetchParticipant(participantId: string) {
  const result = await fetchWithOfflineFallback<ParticipantData>(
    `/api/participant/${participantId}`,
    { cacheKey: `participant-${participantId}` }
  );
  return result;
}

// ==================== RALLY SUBMISSION ====================

export interface RallySubmission {
  participant_id: string;
  rz1_code: string | null;
  rz2_code: string | null;
  rz3_code: string | null;
  rz4_code: string | null;
  rz5_code: string | null;
  rz6_code: string | null;
  rz7_code: string | null;
  rz8_code: string | null;
  submitted_at: string;
}

export async function fetchRallySubmission(participantId: string) {
  const result = await fetchWithOfflineFallback<RallySubmission>(
    `/api/rally-submission?participant_id=${participantId}`,
    { cacheKey: `rally-submission-${participantId}` }
  );
  return result;
}

// ==================== DOCUMENTS ====================

export interface Document {
  id: string;
  title: string;
  category: string;
  url: string;
  type: string;
}

export async function fetchDocuments() {
  const result = await fetchWithOfflineFallback<Document[]>(
    '/api/documents',
    { cacheKey: 'documents' }
  );
  return result;
}
