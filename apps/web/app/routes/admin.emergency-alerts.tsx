import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all emergency SOS alerts
  const { data: alerts } = await supabaseAdmin
    .from('emergency_sos')
    .select(`
      *,
      participants (
        first_name,
        last_name,
        phone,
        email
      )
    `)
    .order('created_at', { ascending: false });

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
      await supabaseAdmin
        .from('emergency_sos')
        .update({
          status: 'resolved',
          resolved_by: adminId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);
    } else if (intent === 'resolve') {
      const notes = formData.get('notes') as string;
      await supabaseAdmin
        .from('emergency_sos')
        .update({
          status: 'resolved',
          resolved_by: adminId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating alert:', error);
    return { error: 'Failed to update alert' };
  }
}

export default function EmergencyAlerts() {
  const { alerts } = useLoaderData<typeof loader>();

  const pendingAlerts = alerts.filter((a: any) => a.status === 'pending');
  const acknowledgedAlerts = alerts.filter((a: any) => a.status === 'acknowledged');
  const resolvedAlerts = alerts.filter((a: any) => a.status === 'resolved');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Icon name="alert-triangle" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Nood SOS Meldingen</h1>
              <p className="text-red-100 mt-1">Monitor en reageer op noodsituaties</p>
            </div>
          </div>
          {pendingAlerts.length > 0 && (
            <div className="mt-4 bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="font-semibold">{pendingAlerts.length} Actieve Melding{pendingAlerts.length !== 1 ? 'en' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pending Alerts */}
        {pendingAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="alert-circle" className="w-6 h-6 text-red-600" />
              In Afwachting ({pendingAlerts.length})
            </h2>
            <div className="space-y-4">
              {pendingAlerts.map((alert: any) => (
                <AlertCard key={alert.id} alert={alert} />
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
                <AlertCard key={alert.id} alert={alert} />
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
                <AlertCard key={alert.id} alert={alert} />
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
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const participant = alert.participants;
  const statusColors = {
    pending: 'bg-red-100 border-red-200 text-red-800',
    acknowledged: 'bg-yellow-100 border-yellow-200 text-yellow-800',
    resolved: 'bg-green-100 border-green-200 text-green-800',
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${statusColors[alert.status as keyof typeof statusColors]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon name="alert-triangle" className="w-8 h-8" />
          <div>
            <h3 className="text-lg font-bold">
              {participant?.first_name} {participant?.last_name}
            </h3>
            <p className="text-sm opacity-75">
              {new Date(alert.created_at).toLocaleString('nl-NL')}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-white/50">
          {alert.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold mb-1">Contactinfo</p>
          <p className="text-sm">{participant?.email}</p>
          {participant?.phone && <p className="text-sm">{participant.phone}</p>}
        </div>
        <div>
          <p className="text-sm font-semibold mb-1">Locatie</p>
          <p className="text-sm">
            Lat: {alert.latitude}, Lng: {alert.longitude}
          </p>
          <a
            href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline hover:no-underline inline-flex items-center gap-1"
          >
            Bekijk op kaart <Icon name="external-link" className="w-3 h-3" />
          </a>
        </div>
      </div>

      {alert.resolution_notes && (
        <div className="mb-4 p-3 bg-white/50 rounded">
          <p className="text-sm font-semibold mb-1">Oplossingsnotities</p>
          <p className="text-sm">{alert.resolution_notes}</p>
        </div>
      )}

      {alert.status !== 'resolved' && (
        <div className="flex gap-2">
          {alert.status === 'pending' && (
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge" />
              <input type="hidden" name="alertId" value={alert.id} />
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
              >
                Bevestigen
              </button>
            </Form>
          )}
          <Form method="post" className="flex-1">
            <input type="hidden" name="intent" value="resolve" />
            <input type="hidden" name="alertId" value={alert.id} />
            <div className="flex gap-2">
              <input
                type="text"
                name="notes"
                placeholder="Oplossingsnotities (optioneel)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium whitespace-nowrap"
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
