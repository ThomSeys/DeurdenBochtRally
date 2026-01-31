import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useRevalidator } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useToast } from '~/contexts/ToastContext';
import { useState } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all emergency SOS alerts
  const { data: alertsRaw } = await supabaseAdmin
    .from('emergency_sos')
    .select('*')
    .order('created_at', { ascending: false });

  // Get all emergency contacts
  const { data: emergencyContacts } = await supabaseAdmin
    .from('emergency_contacts')
    .select('*');

  // Group emergency contacts by participant_id
  const contactsByParticipant = new Map();
  emergencyContacts?.forEach((contact: any) => {
    if (!contactsByParticipant.has(contact.participant_id)) {
      contactsByParticipant.set(contact.participant_id, []);
    }
    contactsByParticipant.get(contact.participant_id).push(contact);
  });

  // Fetch participant data for each alert
  const alerts = await Promise.all(
    (alertsRaw || []).map(async (alert: any) => {
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name, phone, email, motorcycle_brand, motorcycle_model, license_plate')
        .eq('id', alert.participant_id)
        .single();
      
      return {
        ...alert,
        participants: participant || null,
        emergency_contacts: contactsByParticipant.get(alert.participant_id) || [],
      };
    })
  );

  return { alerts: alerts || [] };
}

export async function action({ request }: ActionFunctionArgs) {
  const adminId = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get('intent');
  const alertId = formData.get('alertId') as string;

  if (!alertId) {
    return { error: 'Alert ID required' };
  }

  try {
    if (intent === 'acknowledge') {
      console.log('Acknowledging alert:', alertId);
      const { data, error } = await supabaseAdmin
        .from('emergency_sos')
        .update({
          status: 'acknowledged',
        })
        .eq('id', alertId)
        .select();
      
      if (error) {
        console.error('Error acknowledging alert:', error);
        return { error: error.message };
      }
      console.log('Alert acknowledged successfully:', data);
    } else if (intent === 'resolve') {
      const notes = formData.get('notes') as string;
      console.log('Resolving alert:', alertId, 'with notes:', notes);
      const { data, error } = await supabaseAdmin
        .from('emergency_sos')
        .update({
          status: 'resolved',
          resolved_by: adminId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select();
      
      if (error) {
        console.error('Error resolving alert:', error);
        return { error: error.message };
      }
      console.log('Alert resolved successfully:', data);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating alert:', error);
    return { error: 'Failed to update alert' };
  }
}

export default function EmergencyAlerts() {
  const { alerts } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const { warning } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const acknowledgedAlerts = alerts.filter((a: any) => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter((a: any) => a.status === 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className={`relative ${activeAlerts.length > 0 ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-800' : 'bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400'} text-white py-16 overflow-hidden`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Icon name="alert-triangle" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Nood SOS Meldingen</h1>
              <p className={`${activeAlerts.length > 0 ? 'text-red-100' : 'text-primary-100'} mt-1`}>Monitor en reageer op noodsituaties</p>
            </div>
          </div>
          {activeAlerts.length > 0 && (
            <div className="mt-4 bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="font-semibold">{activeAlerts.length} Actieve Melding{activeAlerts.length !== 1 ? 'en' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="alert-circle" className="w-6 h-6 text-red-600" />
              Actief ({activeAlerts.length})
            </h2>
            <div className="space-y-4">
              {activeAlerts.map((alert: any) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onShowDetails={() => {
                    setSelectedAlert(alert);
                    setShowDetailsModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="check-circle" className="w-6 h-6 text-yellow-600" />
              Bevestigde Meldingen ({acknowledgedAlerts.length})
            </h2>
            <div className="space-y-4">
              {acknowledgedAlerts.map((alert: any) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onShowDetails={() => {
                    setSelectedAlert(alert);
                    setShowDetailsModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="check" className="w-6 h-6 text-green-600" />
              Opgeloste Meldingen ({resolvedAlerts.length})
            </h2>
            <div className="space-y-4">
              {resolvedAlerts.map((alert: any) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onShowDetails={() => {
                    setSelectedAlert(alert);
                    setShowDetailsModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <Icon name="inbox" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Geen noodmeldingen</p>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedAlert && (
          <ParticipantDetailsModal 
            alert={selectedAlert}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedAlert(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onShowDetails }: { alert: any; onShowDetails: () => void }) {
  const participant = alert.participants;
  const statusColors = {
    active: 'bg-red-100 border-red-200 text-red-800',
    acknowledged: 'bg-yellow-100 border-yellow-200 text-yellow-800',
    resolved: 'bg-green-100 border-green-200 text-green-800',
  };

  return (
    <div className={`border-2 rounded-sm p-4 sm:p-6 ${statusColors[alert.status as keyof typeof statusColors]}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
        <div className="flex items-center gap-3">
          <Icon name="alert-triangle" className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold truncate">
              {participant?.first_name} {participant?.last_name}
            </h3>
            <p className="text-xs sm:text-sm opacity-75">
              {new Date(alert.created_at).toLocaleString('nl-NL')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onShowDetails}
            className="px-3 py-1.5 bg-white/70 hover:bg-white rounded-sm text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Icon name="user" className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold uppercase bg-white/50">
            {alert.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <p className="text-xs sm:text-sm font-semibold mb-1">Contactinfo</p>
          <p className="text-xs sm:text-sm break-words">{participant?.email}</p>
          {participant?.phone && <p className="text-xs sm:text-sm">{participant.phone}</p>}
        </div>
        <div>
          <p className="text-xs sm:text-sm font-semibold mb-1">Locatie</p>
          <p className="text-xs sm:text-sm break-all">
            Lat: {alert.location_lat}, Lng: {alert.location_lng}
          </p>
          <a
            href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm underline hover:no-underline inline-flex items-center gap-1"
          >
            Bekijk op kaart <Icon name="external-link" className="w-3 h-3" />
          </a>
        </div>
      </div>

      {alert.resolution_notes && (
        <div className="mb-4 p-3 bg-white/50 rounded-sm">
          <p className="text-xs sm:text-sm font-semibold mb-1">Oplossingsnotities</p>
          <p className="text-xs sm:text-sm break-words">{alert.resolution_notes}</p>
        </div>
      )}

      {alert.status !== 'resolved' && (
        <div className="flex flex-col sm:flex-row gap-2">
          {alert.status === 'active' && (
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge" />
              <input type="hidden" name="alertId" value={alert.id} />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-yellow-600 text-white rounded-sm hover:bg-yellow-700 text-sm font-medium"
              >
                Bevestigen
              </button>
            </Form>
          )}
          <Form method="post" className="flex-1 w-full sm:w-auto">
            <input type="hidden" name="intent" value="resolve" />
            <input type="hidden" name="alertId" value={alert.id} />
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                name="notes"
                placeholder="Oplossingsnotities (optioneel)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 text-sm font-medium whitespace-nowrap"
              >
                Markeer als Opgelost
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}

function ParticipantDetailsModal({ alert, onClose }: { alert: any; onClose: () => void }) {
  const participant = alert.participants;
  const emergencyContacts = alert.emergency_contacts || [];

  const callNumber = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="fixed z-[1200] inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {participant?.first_name} {participant?.last_name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 mt-1">
              SOS Melding - {new Date(alert.created_at).toLocaleString('nl-BE')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white text-2xl ml-4 flex-shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Participant Info */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Deelnemer Gegevens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 text-sm break-words">{participant?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Telefoon</label>
                {participant?.phone ? (
                  <button
                    onClick={() => callNumber(participant.phone)}
                    className="text-primary-600 hover:text-blue-700 font-medium text-sm"
                  >
                    {participant.phone}
                  </button>
                ) : (
                  <p className="text-gray-400 text-sm">Geen telefoon</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Motor Merk</label>
                <p className="text-gray-900 text-sm">{participant?.motorcycle_brand}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Motor Model</label>
                <p className="text-gray-900 text-sm">{participant?.motorcycle_model}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-500">Kenteken</label>
                <p className="text-gray-900 text-sm">{participant?.license_plate}</p>
              </div>
            </div>
          </div>

          {/* GPS Location */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">GPS Locatie</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Coördinaten</label>
                <p className="text-gray-900 font-mono text-xs sm:text-sm break-all">
                  {alert.location_lat}, {alert.location_lng}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary-600 hover:text-blue-700 font-medium text-sm"
              >
                <Icon name="external-link" className="w-4 h-4 mr-2" />
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Noodcontacten ({emergencyContacts.length})
            </h3>
            {emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {emergencyContacts.map((contact: any) => (
                  <div key={contact.id} className="bg-gray-50 rounded-sm p-3 sm:p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Naam</label>
                        <p className="text-gray-900 font-medium text-sm">{contact.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Relatie</label>
                        <p className="text-gray-900 text-sm">{contact.relationship || '-'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Telefoon</label>
                        <button
                          onClick={() => callNumber(contact.phone)}
                          className="text-primary-600 hover:text-blue-700 font-medium text-sm break-all"
                        >
                          {contact.phone}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-center">
                <Icon name="alert-triangle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 font-medium text-sm">Geen noodcontacten beschikbaar</p>
                <p className="text-xs sm:text-sm text-red-500 mt-1">Deze deelnemer heeft geen noodcontacten ingevuld</p>
              </div>
            )}
          </div>

          {/* Resolution Notes */}
          {alert.resolution_notes && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Oplossingsnotities</h3>
              <div className="bg-green-50 border border-green-200 rounded-sm p-4">
                <p className="text-gray-700 text-sm">{alert.resolution_notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
