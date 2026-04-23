import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";
import type { ServerClientResult } from "../client/server.js";

export type MotorcycleCategory =
  Database["public"]["Enums"]["motorcycle_category"];
export type EventType = Database["public"]["Enums"]["event_type"];

export interface RegisterParticipantInput {
  // account
  email: string;
  password: string;
  // personal
  firstName: string;
  lastName: string;
  phone?: string;
  // emergency contact
  emergencyName?: string;
  emergencyPhone?: string;
  // motorcycle
  motorcycleBrand?: string;
  motorcycleModel?: string;
  motorcycleYear?: number;
  motorcycleCategory: MotorcycleCategory;
  licensePlate?: string;
  // event
  eventChoice: EventType;
}

export interface RegisterParticipantResult {
  userId: string | null;
  error: string | null;
}

/**
 * Full participant registration flow (server-side):
 *
 * 1. Looks up the currently active event.
 * 2. Creates a confirmed auth user via the admin client (no email verification).
 * 3. Inserts the participant row linked to that user and event via the admin client.
 *
 * After this succeeds, call `signIn()` from auth.service to issue a session.
 *
 * @param adminClient - Service-role client (bypasses RLS, auto-confirms user).
 * @param ctx         - Per-request server client (used for future RLS-safe queries).
 * @param input       - Registration form data.
 */
export async function registerParticipant(
  adminClient: SupabaseClient<Database>,
  _ctx: ServerClientResult,
  input: RegisterParticipantInput,
): Promise<RegisterParticipantResult> {
  // ── 1. Active event ────────────────────────────────────────────────────────
  const { data: event, error: eventError } = await adminClient
    .from("events")
    .select("id")
    .eq("is_active", true)
    .single();

  if (eventError || !event) {
    return {
      userId: null,
      error: "Registration is currently closed. No active event found.",
    };
  }

  // ── 2. Create auth user (auto-confirmed) ───────────────────────────────────
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${input.firstName} ${input.lastName}`,
      },
    });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists")) {
      return {
        userId: null,
        error: "An account with this email address already exists.",
      };
    }
    return { userId: null, error: authError.message };
  }

  const userId = authData.user.id;

  // ── 3. Insert participant record ───────────────────────────────────────────
  const { error: participantError } = await adminClient
    .from("participants")
    .insert({
      user_id: userId,
      event_id: event.id,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone ?? null,
      emergency_name: input.emergencyName ?? null,
      emergency_phone: input.emergencyPhone ?? null,
      motorcycle_brand: input.motorcycleBrand ?? null,
      motorcycle_model: input.motorcycleModel ?? null,
      motorcycle_year: input.motorcycleYear ?? null,
      motorcycle_category: input.motorcycleCategory,
      license_plate: input.licensePlate ?? null,
      event_choice: input.eventChoice,
      status: "pending",
    });

  if (participantError) {
    // Roll back: delete the auth user so the email isn't orphaned
    await adminClient.auth.admin.deleteUser(userId);

    if (participantError.message.includes("participants_email_event_unique")) {
      return {
        userId: null,
        error: "You are already registered for this event.",
      };
    }
    return {
      userId: null,
      error: "Failed to save your registration. Please try again.",
    };
  }

  return { userId, error: null };
}
