import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { json } from 'react-router';
import { useLoaderData, Form, useNavigation } from 'react-router';
import { requireUserId } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  // Verify admin access
  const { data: participant } = await supabase
    .from('participants')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!participant || participant.role !== 'admin') {
    throw new Response('Unauthorized', { status: 403 });
  }

  // Get scheduled reports
  const { data: scheduledReports } = await supabase
    .from('scheduled_reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Get recent report history
  const { data: reportHistory } = await supabase
    .from('report_history')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(20);

  return json({ scheduledReports: scheduledReports || [], reportHistory: reportHistory || [] });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  // Verify admin access
  const { data: participant } = await supabase
    .from('participants')
    .select('role, id')
    .eq('user_id', userId)
    .single();

  if (!participant || participant.role !== 'admin') {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const formData = await request.formData();
  const action = formData.get('_action') as string;

  if (action === 'generate-individual') {
    const participantId = Number(formData.get('participantId'));
    
    // Queue individual report generation
    const { data, error } = await supabase
      .from('report_queue')
      .insert({
        report_type: 'individual',
        participant_id: participantId,
        requested_by: participant.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to queue report' }, { status: 500 });
    }

    return json({ success: true, message: 'Report queued for generation', queueId: data.id });
  }

  if (action === 'generate-summary') {
    // Queue summary report generation
    const { data, error } = await supabase
      .from('report_queue')
      .insert({
        report_type: 'summary',
        requested_by: participant.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to queue report' }, { status: 500 });
    }

    return json({ success: true, message: 'Summary report queued', queueId: data.id });
  }

  if (action === 'schedule-report') {
    const reportType = formData.get('reportType') as string;
    const frequency = formData.get('frequency') as string;
    const emailList = formData.get('emailList') as string;

    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({
        report_type: reportType,
        frequency,
        email_list: emailList.split(',').map(e => e.trim()),
        created_by: participant.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to schedule report' }, { status: 500 });
    }

    return json({ success: true, message: 'Report scheduled successfully' });
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}

export default function ReportsPage() {
  const { scheduledReports, reportHistory } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isGenerating = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automated Reports</h1>
          <p className="text-gray-600 mt-1">Generate and schedule event reports</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate Individual Reports */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Icon name="user" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Individual Reports</h2>
                <p className="text-sm text-gray-600">Generate participant certificates</p>
              </div>
            </div>

            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="generate-individual" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant ID (or leave blank for all)
                </label>
                <input
                  type="number"
                  name="participantId"
                  placeholder="Leave blank to generate for all"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Icon name="loader" className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon name="file-text" className="w-5 h-5" />
                    Generate Reports
                  </>
                )}
              </button>
            </Form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Includes:</strong> Scores, photos, achievements, route map, event statistics
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
                <h2 className="text-lg font-bold text-gray-900">Summary Report</h2>
                <p className="text-sm text-gray-600">Overall event statistics</p>
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon name="download" className="w-5 h-5" />
                    Generate Summary
                  </>
                )}
              </button>
            </Form>

            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Includes:</strong> Participation stats, top performers, engagement metrics, route analysis
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Reports */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Automated Reports</h2>
          
          <Form method="post" className="space-y-4">
            <input type="hidden" name="_action" value="schedule-report" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  name="reportType"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="summary">Summary Report</option>
                  <option value="individual">Individual Reports</option>
                  <option value="analytics">Analytics Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  name="frequency"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="event_end">At Event End</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  name="emailList"
                  placeholder="admin@example.com, team@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Icon name="calendar" className="w-5 h-5" />
              Schedule Report
            </button>
          </Form>
        </div>

        {/* Scheduled Reports */}
        {scheduledReports.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Scheduled Reports</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Frequency</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Recipients</th>
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
                        {report.email_list?.length || 0} recipients
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            report.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.is_active ? 'Active' : 'Inactive'}
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reports</h2>
            <div className="space-y-3">
              {reportHistory.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Icon name="file-text" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {report.report_type} Report
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(report.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={report.file_url}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
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
