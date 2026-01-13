import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link, Form } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Deelnemers - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search') || '';
    const paymentFilter = url.searchParams.get('payment') || 'all';
    const checkedInFilter = url.searchParams.get('checkedIn') || 'all';

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
      console.error('Error fetching participants:', error);
    }

    return { participants: participants || [], searchQuery, paymentFilter, checkedInFilter };
  } catch (error) {
    console.log('[AdminParticipants] Offline:', error);
    return { participants: [], searchQuery: '', paymentFilter: 'all', checkedInFilter: 'all' };
  }
}

export default function AdminParticipants() {
  const { participants, searchQuery, paymentFilter, checkedInFilter } = useLoaderData<typeof loader>();
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deelnemers Beheer</h1>
            <p className="text-gray-600 mt-2">{participants.length} deelnemers gevonden</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Alle</option>
                <option value="true">Ingecheckt</option>
                <option value="false">Niet ingecheckt</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Filteren
              </button>
            </div>
          </Form>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      <span className="text-sm text-gray-900">
                        {participant.formula === 'with_meals' ? '🍽️ Met maaltijden' : '☕ Alleen ontbijt'}
                      </span>
                      <div className="text-sm text-gray-500">
                        {participant.ride_type === 'guided' ? '👥 Begeleide rit' : '🏍️ Vrij'}
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
                      <button
                        onClick={() => setSelectedParticipant(participant)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Details →
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center md:justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full md:max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto my-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {selectedParticipant.first_name} {selectedParticipant.last_name}
              </h2>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{selectedParticipant.email}</p>
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
                <div className="col-span-2">
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
                    <p className="text-xs text-gray-500 font-mono">{selectedParticipant.qr_code}</p>
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
              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={`/admin/participants/${selectedParticipant.id}/submissions`}
                  className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-semibold py-3 rounded-lg transition-colors"
                >
                  📝 Bekijk Rally Antwoorden
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
