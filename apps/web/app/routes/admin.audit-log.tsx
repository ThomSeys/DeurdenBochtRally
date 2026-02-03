import type { LoaderFunctionArgs } from 'react-router';
import { data, useLoaderData, Link, Form } from 'react-router';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const url = new URL(request.url);
  const eventType = url.searchParams.get('eventType') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('participant_audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventType !== 'all') {
    query = query.eq('event_type', eventType);
  }

  const { data: auditLogs, error, count } = await query;

  if (error) {
    throw new Error(`Failed to load audit logs: ${error.message}`);
  }

  return data({
    auditLogs: auditLogs || [],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    eventType,
  });
}

export default function AdminAuditLog() {
  const { auditLogs, totalCount, currentPage, totalPages, eventType } = useLoaderData<typeof loader>();

  const eventTypeLabels: Record<string, string> = {
    account_deleted: 'Account verwijderd',
    registration_cancelled: 'Registratie geannuleerd',
    payment_refunded: 'Betaling teruggestort',
    data_export: 'Data export',
    admin_deletion: 'Admin verwijdering',
  };

  const eventTypeColors: Record<string, string> = {
    account_deleted: 'bg-red-100 text-red-800',
    registration_cancelled: 'bg-yellow-100 text-yellow-800',
    payment_refunded: 'bg-orange-100 text-orange-800',
    data_export: 'bg-blue-100 text-blue-800',
    admin_deletion: 'bg-purple-100 text-purple-800',
  };

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-2">
              Overzicht van deelnemer verwijderingen, annuleringen en data exports
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Totaal: {totalCount} records
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <Form method="get" className="flex gap-4">
              <select 
                name="eventType" 
                defaultValue={eventType}
                className="border border-gray-300 rounded px-3 py-2"
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
              >
                <option value="all">Alle gebeurtenissen</option>
                <option value="account_deleted">Account verwijderd</option>
                <option value="registration_cancelled">Registratie geannuleerd</option>
                <option value="payment_refunded">Betaling teruggestort</option>
                <option value="data_export">Data export</option>
                <option value="admin_deletion">Admin verwijdering</option>
              </select>
            </Form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betaling
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Door
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Geen audit logs gevonden
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString('nl-BE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.first_name} {log.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{log.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventTypeColors[log.event_type] || 'bg-gray-100 text-gray-800'}`}>
                          {eventTypeLabels[log.event_type] || log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.amount_paid && log.stripe_payment_id ? (
                          <div>
                            <div>€{log.amount_paid}</div>
                            <div className="text-xs text-gray-500">{log.payment_status}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.deleted_by ? (
                          <span className="text-purple-600 font-medium">Admin</span>
                        ) : (
                          <span className="text-blue-600">Zelf</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Pagina {currentPage} van {totalPages}
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <Link
                to={`?eventType=${eventType}&page=${currentPage - 1}`}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded border border-gray-300 transition-colors"
              >
                ← Vorige
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                to={`?eventType=${eventType}&page=${currentPage + 1}`}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded border border-gray-300 transition-colors"
              >
                Volgende →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-4">
        <p className="font-medium mb-1">ℹ️ Informatie over audit logs:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Deze audit log bewaart gegevens voor 7 jaar conform wettelijke verplichtingen.</li>
          <li>Betalingsgegevens worden apart bewaard bij Stripe.</li>
          <li>"Zelf" betekent dat de deelnemer zelf de actie heeft uitgevoerd (GDPR).</li>
          <li>"Admin" betekent dat een beheerder de actie heeft uitgevoerd.</li>
        </ul>
      </div>
    </div>
    </div>
  );
}
