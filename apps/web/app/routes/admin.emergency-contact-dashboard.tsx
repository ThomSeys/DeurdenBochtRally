import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useState } from 'react';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Emergency Contact Dashboard - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin emergency contact dashboard loaded');

  // Get all participants with emergency contact info
  const { data: participants } = await supabaseAdmin
    .from('participants')
    .select('id, first_name, last_name, email, phone, motorcycle_brand, motorcycle_model, license_plate, checked_in')
    .order('last_name', { ascending: true });

  // Get all emergency contacts
  const { data: emergencyContacts } = await supabaseAdmin
    .from('emergency_contacts')
    .select('*')
    .order('created_at', { ascending: true });

  // Group emergency contacts by participant_id
  const contactsByParticipant = new Map();
  emergencyContacts?.forEach((contact: any) => {
    if (!contactsByParticipant.has(contact.participant_id)) {
      contactsByParticipant.set(contact.participant_id, []);
    }
    contactsByParticipant.get(contact.participant_id).push(contact);
  });

  // Active SOS alerts
  const { data: activeSOS } = await supabaseAdmin
    .from('emergency_sos')
    .select('*, participants(first_name, last_name, phone, motorcycle_brand)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Get all SOS history
  const { data: sosHistory } = await supabaseAdmin
    .from('emergency_sos')
    .select('*, participants(first_name, last_name, phone)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get latest GPS locations from rally zone check-ins
  const { data: latestLocations } = await supabaseAdmin
    .from('rally_zone_checkins')
    .select('participant_id, checked_in_at, location_lat, location_lng, participants(first_name, last_name)')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)
    .order('checked_in_at', { ascending: false });

  // Get the most recent location per participant
  const participantLocations = new Map();
  latestLocations?.forEach((loc: any) => {
    if (!participantLocations.has(loc.participant_id)) {
      participantLocations.set(loc.participant_id, {
        participant_id: loc.participant_id,
        participant_name: `${loc.participants?.first_name} ${loc.participants?.last_name}`,
        lat: loc.location_lat,
        lng: loc.location_lng,
        timestamp: loc.checked_in_at,
      });
    }
  });

  return {
    participants: participants || [],
    emergencyContactsByParticipant: Object.fromEntries(contactsByParticipant),
    activeSOS: activeSOS || [],
    sosHistory: sosHistory || [],
    latestLocations: Array.from(participantLocations.values()),
  };
}

export default function EmergencyContactDashboard() {
  const { participants, emergencyContactsByParticipant, activeSOS, sosHistory, latestLocations } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const filteredParticipants = participants.filter((p: any) => {
    const matchesSearch = 
      p.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterCheckedIn === 'all' ||
      (filterCheckedIn === 'checked_in' && p.checked_in) ||
      (filterCheckedIn === 'not_checked_in' && !p.checked_in);

    return matchesSearch && matchesFilter;
  });

  const callEmergencyNumber = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-full">
                  <Icon name="phone" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Emergency Dashboard</h1>
                  <p className="text-xl text-red-100 mt-1">Noodcontacten & Veiligheid</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-200 mb-1">Actieve SOS Alerts</div>
              <div className="text-5xl font-bold">{activeSOS.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/admin"
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Terug naar Admin Dashboard
          </Link>
        </div>

        {/* Active SOS Alerts */}
        {activeSOS.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <Icon name="alert-triangle" className="w-10 h-10 text-red-600" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">⚠️ Actieve Noodoproepen</h2>
                <p className="text-red-700">Er zijn {activeSOS.length} actieve SOS alert(s) die directe aandacht vereisen</p>
              </div>
            </div>

            <div className="space-y-4">
              {activeSOS.map((sos: any) => (
                <div key={sos.id} className="bg-white border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {sos.participants?.first_name} {sos.participants?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {sos.participants?.motorcycle_brand} • {sos.participants?.phone}
                      </p>
                      {sos.message && (
                        <p className="text-gray-800 font-medium mb-3">{sos.message}</p>
                      )}
                      {sos.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Icon name="map-pin" className="w-4 h-4" />
                          <span>
                            GPS: {sos.location.coordinates[1].toFixed(6)}, {sos.location.coordinates[0].toFixed(6)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${sos.location.coordinates[1]},${sos.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-2"
                          >
                            Open in Maps
                          </a>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(sos.created_at).toLocaleString('nl-BE')}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => callEmergencyNumber(sos.participants?.phone || '')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2"
                      >
                        <Icon name="phone" className="w-4 h-4" />
                        Bel Nu
                      </button>
                      <Link
                        to={`/admin/participants?id=${sos.participant_id}`}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-center"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Services Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 rounded-full p-3">
                <Icon name="phone" className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Algemeen Noodnummer</h3>
            </div>
            <button
              onClick={() => callEmergencyNumber('112')}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-xl"
            >
              112
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Icon name="activity" className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dokter Wacht</h3>
            </div>
            <button
              onClick={() => callEmergencyNumber('1733')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xl"
            >
              1733
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-100 rounded-full p-3">
                <Icon name="shield" className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Wegenhulp</h3>
            </div>
            <button
              onClick={() => callEmergencyNumber('+32 2 663 19 19')}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold text-lg"
            >
              VAB
            </button>
          </div>
        </div>

        {/* Latest GPS Locations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon name="map" className="w-5 h-5 mr-2 text-green-600" />
            Laatste Bekende Locaties (Top 10)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Laatste Locatie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GPS Coördinaten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tijdstip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestLocations.slice(0, 10).map((loc: any) => (
                  <tr key={loc.participant_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loc.participant_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{loc.zone_name || 'Onbekend'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loc.lat && loc.lng ? (
                        <div className="text-sm text-gray-600">
                          {parseFloat(loc.lat).toFixed(4)}, {parseFloat(loc.lng).toFixed(4)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Geen GPS</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(loc.timestamp).toLocaleTimeString('nl-BE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {loc.lat && loc.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Map
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Participant Emergency Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Icon name="users" className="w-5 h-5 mr-2 text-purple-600" />
            Noodcontacten Alle Deelnemers
          </h2>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Zoek op naam, email, of telefoon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterCheckedIn('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterCheckedIn === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterCheckedIn('checked_in')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterCheckedIn === 'checked_in'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Ingecheckt
              </button>
              <button
                onClick={() => setFilterCheckedIn('not_checked_in')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filterCheckedIn === 'not_checked_in'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Niet Ingecheckt
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Noodcontact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motorfiets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant: any) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {participant.first_name} {participant.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {participant.phone ? (
                        <button
                          onClick={() => callEmergencyNumber(participant.phone)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {participant.phone}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">Geen telefoon</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {emergencyContactsByParticipant[participant.id]?.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setShowContactsModal(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Icon name="check-circle" className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {emergencyContactsByParticipant[participant.id].length} contact{emergencyContactsByParticipant[participant.id].length > 1 ? 'en' : ''}
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
                          <Icon name="alert-triangle" className="w-4 h-4" />
                          Geen noodcontact
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {participant.motorcycle_brand} {participant.motorcycle_model}
                      </div>
                      <div className="text-xs text-gray-500">{participant.license_plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        participant.checked_in
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.checked_in ? 'Ingecheckt' : 'Niet ingecheckt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/admin/participants?id=${participant.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Contacts Modal */}
        {showContactsModal && selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Noodcontacten - {selectedParticipant.first_name} {selectedParticipant.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedParticipant.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowContactsModal(false);
                    setSelectedParticipant(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="x" className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {emergencyContactsByParticipant[selectedParticipant.id]?.length > 0 ? (
                  <div className="space-y-4">
                    {emergencyContactsByParticipant[selectedParticipant.id].map((contact: any) => (
                      <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{contact.name}</h4>
                            {contact.relationship && (
                              <p className="text-sm text-gray-600 mb-2">{contact.relationship}</p>
                            )}
                            <div className="flex items-center gap-2 text-gray-700 mt-2">
                              <Icon name="phone" className="w-4 h-4" />
                              <button
                                onClick={() => callEmergencyNumber(contact.phone)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {contact.phone}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon name="alert-triangle" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Geen noodcontacten beschikbaar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
