import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, useNavigation, useActionData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  const adminId = await requireAdmin(request);

  // Get report queue
  const { data: reportQueue } = await (supabaseAdmin as any)
    .from('report_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get scheduled reports
  const { data: scheduledReports } = await (supabaseAdmin as any)
    .from('scheduled_reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Get recent report history
  const { data: reportHistory } = await (supabaseAdmin as any)
    .from('report_history')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(20);

  return { 
    reportQueue: reportQueue || [], 
    scheduledReports: scheduledReports || [], 
    reportHistory: reportHistory || [] 
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const adminId = await requireAdmin(request);

  const formData = await request.formData();
  const action = formData.get('_action') as string;

  if (action === 'generate-individual') {
    const participantId = formData.get('participantId') as string;
    
    // Queue individual report generation
    const { data, error } = await (supabaseAdmin as any)
      .from('report_queue')
      .insert({
        report_type: 'individual',
        participant_id: participantId ? Number(participantId) : null,
        requested_by: adminId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Queue error:', error);
      return { error: 'Kon rapport niet in wachtrij plaatsen' };
    }

    return { success: true, message: `Rapport in wachtrij (ID: ${data.id})` };
  }

  if (action === 'generate-summary') {
    // Queue summary report generation
    const { data, error } = await (supabaseAdmin as any)
      .from('report_queue')
      .insert({
        report_type: 'summary',
        requested_by: adminId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Queue error:', error);
      return { error: 'Kon samenvattingsrapport niet in wachtrij plaatsen' };
    }

    return { success: true, message: `Samenvattingsrapport in wachtrij (ID: ${data.id})` };
  }

  if (action === 'process-queue') {
    // Manually trigger report processing
    try {
      const response = await fetch(`${new URL(request.url).origin}/api/process-reports`, {
        method: 'POST',
        headers: {
          'cookie': request.headers.get('cookie') || '',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Kon rapporten niet verwerken' };
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Process error:', error);
      return { error: 'Kon rapporten niet verwerken' };
    }
  }

  if (action === 'schedule-report') {
    const reportType = formData.get('reportType') as string;
    const frequency = formData.get('frequency') as string;
    const emailList = formData.get('emailList') as string;

    const { data, error } = await (supabaseAdmin as any)
      .from('scheduled_reports')
      .insert({
        report_type: reportType,
        frequency,
        email_list: emailList.split(',').map(e => e.trim()),
        created_by: adminId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Schedule error:', error);
      return { error: 'Kon rapport niet plannen' };
    }

    return { success: true, message: 'Rapport succesvol gepland' };
  }

  return { error: 'Ongeldige actie' };
}

export default function ReportsPage() {
  const { reportQueue, scheduledReports, reportHistory } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isGenerating = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
              <Icon name="file-text" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Rapporten</h1>
              <p className="text-white/90 mt-1">Genereer en beheer evenement rapporten</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            ✓ {actionData.message}
          </div>
        )}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            ✗ {actionData.error}
          </div>
        )}

        {/* Report Queue */}
        {reportQueue.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Wachtrij</h2>
              <Form method="post">
                <input type="hidden" name="_action" value="process-queue" />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Icon name="play" className="w-4 h-4" />
                  Verwerk Nu
                </button>
              </Form>
            </div>
            
            <div className="space-y-3">
              {reportQueue.map((report: any) => {
                let statusColor = 'bg-yellow-100 text-yellow-800';
                let statusIcon = 'clock';
                
                if (report.status === 'processing') {
                  statusColor = 'bg-blue-100 text-blue-800';
                  statusIcon = 'loader';
                } else if (report.status === 'completed') {
                  statusColor = 'bg-green-100 text-green-800';
                  statusIcon = 'check';
                } else if (report.status === 'failed') {
                  statusColor = 'bg-red-100 text-red-800';
                  statusIcon = 'x';
                }

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${statusColor}`}>
                        <Icon name={statusIcon} className={`w-5 h-5 ${report.status === 'processing' ? 'animate-spin' : ''}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {report.report_type} Rapport
                          {report.participant_id && ` - Deelnemer ${report.participant_id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          Aangevraagd: {new Date(report.created_at).toLocaleString('nl-NL')}
                        </p>
                        {report.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            Fout: {report.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                      {report.status === 'pending' && 'In Wachtrij'}
                      {report.status === 'processing' && 'Bezig...'}
                      {report.status === 'completed' && 'Voltooid'}
                      {report.status === 'failed' && 'Mislukt'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Individual Reports */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Icon name="user" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Individuele Rapporten</h2>
                <p className="text-sm text-gray-600">Genereer deelnemercertificaten</p>
              </div>
            </div>

            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="generate-individual" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deelnemer ID (of laat leeg voor allen)
                </label>
                <input
                  type="number"
                  name="participantId"
                  placeholder="Laat leeg voor alle deelnemers"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                    Bezig met genereren...
                  </>
                ) : (
                  <>
                    <Icon name="file-text" className="w-5 h-5" />
                    Genereer Rapporten
                  </>
                )}
              </button>
            </Form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Bevat:</strong> Scores, foto's, achievements, route kaart, evenement statistieken
              </p>
            </div>
          </div>

          {/* Generate Summary Report */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Icon name="bar-chart" className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Samenvattingsrapport</h2>
                <p className="text-sm text-gray-600">Algemene evenement statistieken</p>
              </div>
            </div>

            <Form method="post">
              <input type="hidden" name="_action" value="generate-summary" />
              
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                    Bezig met genereren...
                  </>
                ) : (
                  <>
                    <Icon name="download" className="w-5 h-5" />
                    Genereer Samenvatting
                  </>
                )}
              </button>
            </Form>

            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Bevat:</strong> Deelname stats, top presteerders, engagement metrics, route analyse
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Reports */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Geautomatiseerde Rapporten</h2>
          
          <Form method="post" className="space-y-4">
            <input type="hidden" name="_action" value="schedule-report" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rapporttype
                </label>
                <select
                  name="reportType"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="summary">Samenvattingsrapport</option>
                  <option value="individual">Individuele Rapporten</option>
                  <option value="analytics">Analytics Rapport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequentie
                </label>
                <select
                  name="frequency"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="daily">Dagelijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="monthly">Maandelijks</option>
                  <option value="event_end">Bij Einde Evenement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail Ontvangers (komma-gescheiden)
                </label>
                <input
                  type="text"
                  name="emailList"
                  placeholder="admin@example.com, team@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="calendar" className="w-5 h-5" />
              Plan Rapport
            </button>
          </Form>
        </div>

        {/* Scheduled Reports */}
        {scheduledReports.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Geplande Rapporten</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Frequentie</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ontvangers</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledReports.map((report: any) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 capitalize">
                        {report.report_type}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                        {report.frequency}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {report.email_list?.length || 0} ontvangers
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            report.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report History */}
        {reportHistory.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recente Rapporten</h2>
            <div className="space-y-3">
              {reportHistory.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 rounded-full p-2">
                      <Icon name="file-text" className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {report.report_type} Rapport
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(report.generated_at).toLocaleString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={report.file_url}
                    download
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Icon name="download" className="w-4 h-4" />
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
