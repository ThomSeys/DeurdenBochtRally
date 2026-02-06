import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Link, Form, useSubmit, redirect } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';
import { createAuditLogEntry } from '~/lib/audit-log.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Deelnemers - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('search') || '';
  const paymentFilter = url.searchParams.get('payment') || 'all';
  const checkedInFilter = url.searchParams.get('checkedIn') || 'all';
  const selectedId = url.searchParams.get('id') || null;

  let query = supabaseAdmin
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply search filter
  if (searchQuery) {
    query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,license_plate.ilike.%${searchQuery}%`);
  }

  // Apply payment status filter
  if (paymentFilter !== 'all') {
    query = query.eq('payment_status', paymentFilter);
  }

  // Apply check-in filter
  if (checkedInFilter !== 'all') {
    query = query.eq('checked_in', checkedInFilter === 'true');
  }

  const { data: participants, error } = await query;

  if (error) {
    const requestLogger = createRequestLogger(request);
    await requestLogger.error('admin', 'Failed to fetch participants', error as Error, {
      searchQuery,
      paymentFilter,
      checkedInFilter
    });
  }

  // Get selected participant if id provided
  let selectedParticipant = null;
  if (selectedId) {
    selectedParticipant = participants?.find(p => p.id === selectedId) || null;
  }

  return { participants: participants || [], searchQuery, paymentFilter, checkedInFilter, selectedParticipant: selectedParticipant };
}

export async function action({ request }: ActionFunctionArgs) {
  const adminUserId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, adminUserId);
  
  const formData = await request.formData();
  const intent = formData.get('intent');
  const participantId = formData.get('participantId') as string;

  if (intent === 'delete' && participantId) {
    try {
      // Get full participant data for audit log
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('*')
        .eq('id', participantId)
        .single();

      if (!participant) {
        return { error: 'Deelnemer niet gevonden' };
      }

      // Prevent deleting admin users
      if (participant.is_admin) {
        await requestLogger.warn('admin', 'Attempted to delete admin user', {
          participantId,
          participantEmail: participant.email,
        });
        return { error: 'Kan geen admin gebruikers verwijderen' };
      }

      // Create audit log entry BEFORE deletion
      const clientIp = request.headers.get('cf-connecting-ip') || 
                       request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');

      await createAuditLogEntry(participant, {
        eventType: 'admin_deletion',
        reason: 'Deleted by admin via participant management',
        deletedBy: adminUserId,
        ipAddress: clientIp,
        userAgent: userAgent,
      });

      // Delete dependent data first
      await supabaseAdmin.from('participant_achievements').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('rally_zone_checkins').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('ride_stories').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('participant_photos').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('emergency_contacts').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('push_subscriptions').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('riding_buddies').delete().or(`participant_id.eq.${participantId},buddy_id.eq.${participantId}`);
      await supabaseAdmin.from('certificates').delete().eq('participant_id', participantId);
      await supabaseAdmin.from('emergency_sos').delete().eq('participant_id', participantId);

      // Delete participant
      const { error: deleteError } = await supabaseAdmin
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (deleteError) {
        await requestLogger.error('admin', 'Failed to delete participant', deleteError as Error, {
          participantId,
          participantEmail: participant.email,
        });
        return { error: 'Fout bij verwijderen deelnemer' };
      }

      // Delete auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(participantId);
      } catch (authError) {
        console.error('[admin.participants] Failed to delete auth user:', authError);
        // Continue anyway - participant is deleted
      }

      await requestLogger.warn('admin', 'Participant deleted by admin', {
        participantId,
        participantEmail: participant.email,
        deletedBy: adminUserId,
      });

      return redirect('/admin/participants?deleted=success');
    } catch (error) {
      await requestLogger.error('admin', 'Error deleting participant', error as Error, {
        participantId,
      });
      return { error: 'Onverwachte fout bij verwijderen' };
    }
  }

  return { error: 'Ongeldige actie' };
}

export default function AdminParticipants() {
  const { participants, searchQuery, paymentFilter, checkedInFilter, selectedParticipant: loaderSelectedParticipant } = useLoaderData<typeof loader>();
  const [selectedParticipant, setSelectedParticipant] = useState<any>(loaderSelectedParticipant);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const submit = useSubmit();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-blue-900 via-blue-600 to-blue-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="users" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Deelnemers Beheer</h1>
          <p className="text-xl text-primary-100">Bekijk en bewerk deelnemer informatie</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deelnemers Beheer</h1>
            <p className="text-gray-600 mt-2">{participants.length} deelnemers gevonden</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-sm shadow p-6 mb-6">
          <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Zoeken
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="Naam, email, kenteken..."
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-2">
                Betaalstatus
              </label>
              <select
                id="payment"
                name="payment"
                defaultValue={paymentFilter}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Alle</option>
                <option value="completed">Betaald</option>
                <option value="pending">In behandeling</option>
                <option value="failed">Mislukt</option>
              </select>
            </div>

            <div>
              <label htmlFor="checkedIn" className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Status
              </label>
              <select
                id="checkedIn"
                name="checkedIn"
                defaultValue={checkedInFilter}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Alle</option>
                <option value="true">Ingecheckt</option>
                <option value="false">Niet ingecheckt</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-sm font-medium transition-colors"
              >
                Filteren
              </button>
            </div>
          </Form>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant: any) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.first_name} {participant.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{participant.license_plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{participant.email}</div>
                      <div className="text-sm text-gray-500">{participant.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{participant.motorcycle_brand}</div>
                      <div className="text-sm text-gray-500">{participant.motorcycle_model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 flex items-center gap-1">
                        {participant.formula === 'with_meals' ? (
                          <><Icon name="utensils" className="w-4 h-4" /> Met maaltijden</>
                        ) : (
                          <><Icon name="coffee" className="w-4 h-4" /> Alleen ontbijt</>
                        )}
                      </span>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        {participant.ride_type === 'guided' ? (
                          <><Icon name="users" className="w-4 h-4" /> Begeleide rit</>
                        ) : (
                          <><Icon name="motorcycle" className="w-4 h-4" /> Vrij</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {participant.payment_status === 'completed' ? (
                          <span className="inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            ✓ Betaald (€{participant.amount_paid})
                          </span>
                        ) : participant.payment_status === 'pending' ? (
                          <span className="inline-flex text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            ⏳ In behandeling
                          </span>
                        ) : (
                          <span className="inline-flex text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            ✗ Mislukt
                          </span>
                        )}
                        {participant.checked_in && (
                          <span className="inline-flex text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-1">
                            ✓ Ingecheckt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedParticipant(participant)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Details →
                        </button>
                        {!participant.is_admin && (
                          <button
                            onClick={() => setDeleteConfirm(participant.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                            title="Verwijder deelnemer"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1100]">
          <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedParticipant.first_name} {selectedParticipant.last_name}
              </h2>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 break-words">{selectedParticipant.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefoon</label>
                  <p className="text-gray-900">{selectedParticipant.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Motor Merk</label>
                  <p className="text-gray-900">{selectedParticipant.motorcycle_brand}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Motor Model</label>
                  <p className="text-gray-900">{selectedParticipant.motorcycle_model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kenteken</label>
                  <p className="text-gray-900">{selectedParticipant.license_plate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Betaald Bedrag</label>
                  <p className="text-gray-900">€{selectedParticipant.amount_paid}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-500 block mb-2">QR Code</label>
                  <div className="space-y-2">
                    <img 
                      src={selectedParticipant.qr_code_image_url || `/api/qrcode?text=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/check-in/${selectedParticipant.id}`)}`}
                      alt="QR Code" 
                      className="w-48 h-48 border border-gray-300 rounded"
                      onError={(e) => {
                        e.currentTarget.src = `/api/qrcode?text=${encodeURIComponent(`${window.location.origin}/check-in/${selectedParticipant.id}`)}`;
                      }}
                    />
                    <p className="text-xs text-gray-500 font-mono break-all">{selectedParticipant.qr_code}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Inschrijving</label>
                  <p className="text-gray-900">
                    {new Date(selectedParticipant.created_at).toLocaleString('nl-BE')}
                  </p>
                </div>
              </div>

              {/* View Answers Button */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to={`/admin/participants/${selectedParticipant.id}/submissions`}
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-3 rounded-sm transition-colors"
                >
                  <Icon name="document" className="w-4 h-4 inline mr-2" /> Bekijk Rally Antwoorden
                </Link>
                <Link
                  to={`/admin/participants/${selectedParticipant.id}/timeline`}
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold py-3 rounded-sm transition-colors"
                >
                  <Icon name="clock" className="w-4 h-4 inline mr-2" /> Bekijk Tijdlijn
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1200]">
          <div className="bg-white rounded-sm max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Icon name="trash" className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deelnemer Verwijderen</h3>
                <p className="text-sm text-gray-600">
                  {participants.find(p => p.id === deleteConfirm)?.first_name}{' '}
                  {participants.find(p => p.id === deleteConfirm)?.last_name}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Waarschuwing</p>
              <p className="text-sm text-yellow-700">
                Dit verwijdert <strong>alle gegevens</strong> van deze deelnemer:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
                <li>Persoonlijke informatie</li>
                <li>Rally inzendingen en scores</li>
                <li>Achievements en certificaten</li>
                <li>Foto's en verhalen</li>
                <li>Emergency contacten</li>
                <li>Riding buddy verbindingen</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-xs text-blue-800">
                <Icon name="info" className="w-4 h-4 inline mr-1" /> Een audit log wordt bewaard voor administratieve doeleinden
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  const formData = new FormData();
                  formData.append('intent', 'delete');
                  formData.append('participantId', deleteConfirm);
                  submit(formData, { method: 'post' });
                  setDeleteConfirm(null);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-sm font-medium transition-colors"
              >
                Ja, Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
