/**
 * Audit Log Service
 * Creates audit trail entries for participant deletions and cancellations
 */

import { supabaseAdmin } from './supabase.server';

interface ParticipantData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  formula?: string | null;
  ride_type?: string | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  stripe_payment_id?: string | null;
  created_at?: string | null;
  motorcycle_brand?: string | null;
  motorcycle_model?: string | null;
  license_plate?: string | null;
  total_achievement_points?: number | null;
  checked_in?: boolean | null;
}

interface AuditLogOptions {
  eventType: 'account_deleted' | 'registration_cancelled' | 'payment_refunded' | 'data_export' | 'admin_deletion';
  reason?: string;
  deletedBy?: string; // Admin user ID, null for self-service
  ipAddress?: string | null;
  userAgent?: string | null;
  additionalMetadata?: Record<string, any>;
}

export async function createAuditLogEntry(
  participantData: ParticipantData,
  options: AuditLogOptions
) {
  const editionYear = new Date().getFullYear();

  const auditEntry = {
    participant_id: participantData.id,
    email: participantData.email,
    first_name: participantData.first_name,
    last_name: participantData.last_name,
    phone: participantData.phone,
    edition_year: editionYear,
    formula: participantData.formula,
    ride_type: participantData.ride_type,
    amount_paid: participantData.amount_paid,
    payment_status: participantData.payment_status,
    stripe_payment_id: participantData.stripe_payment_id,
    payment_date: participantData.created_at,
    event_type: options.eventType,
    reason: options.reason || null,
    deleted_by: options.deletedBy || null,
    metadata: {
      motorcycle_brand: participantData.motorcycle_brand,
      motorcycle_model: participantData.motorcycle_model,
      license_plate: participantData.license_plate?.slice(-4), // Only last 4 chars for privacy
      total_achievement_points: participantData.total_achievement_points,
      checked_in: participantData.checked_in,
      ...options.additionalMetadata,
    },
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
  };

  const { data, error } = await supabaseAdmin
    .from('participant_audit_log')
    .insert(auditEntry)
    .select()
    .single();

  if (error) {
    console.error('[audit-log] Failed to create audit entry:', error);
    throw error;
  }

  return data;
}

/**
 * Log a registration cancellation (before payment or after refund)
 */
export async function logCancellation(
  participantData: ParticipantData,
  reason: string,
  cancelledBy?: string,
  request?: Request
) {
  const ipAddress = request?.headers.get('cf-connecting-ip') || 
                    request?.headers.get('x-forwarded-for') || 
                    request?.headers.get('x-real-ip') || null;
  const userAgent = request?.headers.get('user-agent') || null;

  return createAuditLogEntry(participantData, {
    eventType: 'registration_cancelled',
    reason,
    deletedBy: cancelledBy,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a payment refund
 */
export async function logRefund(
  participantData: ParticipantData,
  refundReason: string,
  refundedBy: string,
  refundAmount?: number
) {
  return createAuditLogEntry(participantData, {
    eventType: 'payment_refunded',
    reason: refundReason,
    deletedBy: refundedBy,
    additionalMetadata: {
      refund_amount: refundAmount,
      refund_date: new Date().toISOString(),
    },
  });
}

/**
 * Log a data export (GDPR compliance)
 */
export async function logDataExport(
  participantId: string,
  email: string,
  firstName: string,
  lastName: string,
  request?: Request
) {
  const ipAddress = request?.headers.get('cf-connecting-ip') || 
                    request?.headers.get('x-forwarded-for') || 
                    request?.headers.get('x-real-ip') || null;
  const userAgent = request?.headers.get('user-agent') || null;

  return createAuditLogEntry(
    {
      id: participantId,
      email,
      first_name: firstName,
      last_name: lastName,
    },
    {
      eventType: 'data_export',
      reason: 'GDPR data portability request',
      ipAddress,
      userAgent,
    }
  );
}
