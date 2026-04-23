import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type CreateEventInput = {
  name: string;
  slug: string;
  event_date: string;
  registration_opens_at?: string;
  registration_closes_at?: string;
  is_active?: boolean;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type EventResult = {
  event: EventRow | null;
  error: string | null;
};

export type EventListResult = {
  events: EventRow[];
  error: string | null;
};

/**
 * Returns all events ordered by event_date descending.
 * Uses the admin client — call from server actions/loaders only.
 */
export const listEvents = async (
  adminClient: SupabaseClient<Database>,
): Promise<EventListResult> => {
  const { data, error } = await adminClient
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  return {
    events: data ?? [],
    error: error?.message ?? null,
  };
};

/**
 * Returns a single event by id.
 */
export const getEvent = async (
  adminClient: SupabaseClient<Database>,
  id: string,
): Promise<EventResult> => {
  const { data, error } = await adminClient
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  return {
    event: data ?? null,
    error: error?.message ?? null,
  };
};

/**
 * Creates a new event.
 * When `is_active` is true, all other events are deactivated first to ensure
 * only one active event exists at a time.
 */
export const createEvent = async (
  adminClient: SupabaseClient<Database>,
  input: CreateEventInput,
): Promise<EventResult> => {
  if (input.is_active) {
    await adminClient.from("events").update({ is_active: false }).eq("is_active", true);
  }

  const { data, error } = await adminClient
    .from("events")
    .insert({
      name: input.name,
      slug: input.slug,
      event_date: input.event_date,
      registration_opens_at: input.registration_opens_at ?? null,
      registration_closes_at: input.registration_closes_at ?? null,
      is_active: input.is_active ?? false,
    })
    .select()
    .single();

  return {
    event: data ?? null,
    error: error?.message ?? null,
  };
};

/**
 * Updates an existing event.
 * When `is_active` is set to true, all other events are deactivated first.
 */
export const updateEvent = async (
  adminClient: SupabaseClient<Database>,
  id: string,
  input: UpdateEventInput,
): Promise<EventResult> => {
  if (input.is_active) {
    await adminClient
      .from("events")
      .update({ is_active: false })
      .neq("id", id)
      .eq("is_active", true);
  }

  const { data, error } = await adminClient
    .from("events")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  return {
    event: data ?? null,
    error: error?.message ?? null,
  };
};

/**
 * Deletes an event by id.
 * The DB cascades deletes to rallies, teams, and participants.
 */
export const deleteEvent = async (
  adminClient: SupabaseClient<Database>,
  id: string,
): Promise<{ error: string | null }> => {
  const { error } = await adminClient.from("events").delete().eq("id", id);
  return { error: error?.message ?? null };
};
