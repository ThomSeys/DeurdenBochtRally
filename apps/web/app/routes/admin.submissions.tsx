import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, Link } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Submissions - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const url = new URL(request.url);
  const zoneFilter = url.searchParams.get('zone') || 'all';

  // V1: Simplified - no code validation, just track visits
  // Get all zone submissions with participant info
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select(`
      *,
      participants!rally_zone_submissions_participant_id_fkey (
        first_name,
        last_name,
        email,
        license_plate
      )
    `)
    .order('created_at', { ascending: false });

  // Get all rally submissions for zone codes
  const { data: rallySubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code, submitted_at');

  // Create a map: participantId -> rally submission
  const rallySubmissionMap: Record<string, any> = {};
  rallySubmissions?.forEach((rs: any) => {
    rallySubmissionMap[rs.participant_id] = rs;
  });

  // Group submissions by participant and zone
  const zoneSubmissionsGrouped: Map<string, any> = new Map();
  
  zoneSubmissions?.forEach((zoneSubmission: any) => {
    const zoneId = parseInt(zoneSubmission.zone_id);
    const participantId = zoneSubmission.participant_id;
    const checkpointNumber = zoneSubmission.checkpoint_number || 1;
    const key = `${participantId}-${zoneId}`;
    
    // Get or create zone record
    if (!zoneSubmissionsGrouped.has(key)) {
      const rallySubmission = rallySubmissionMap[participantId];
      zoneSubmissionsGrouped.set(key, {
        participant_id: participantId,
        zone_id: zoneId,
        participants: zoneSubmission.participants,
        submitted_at: rallySubmission?.submitted_at,
        created_at: zoneSubmission.created_at,
        checkpoints: {}
      });
    }
    
    const groupedRecord = zoneSubmissionsGrouped.get(key);
    const rallySubmission = rallySubmissionMap[participantId];
    const zoneCode = rallySubmission?.[`rz${zoneId}_code`] || '';
    
    // For multi-checkpoint zones: "answer1|answer2|answer3"
    const codeParts = zoneCode.split('|').map((c: string) => c.trim());
    const code = codeParts[checkpointNumber - 1] || codeParts[0] || '';
    
    // Store checkpoint data (no validation in V1)
    groupedRecord.checkpoints[checkpointNumber] = {
      code: code,
      created_at: zoneSubmission.created_at
    };
  });

  // Convert to array and apply zone filter
  const submissions = Array.from(zoneSubmissionsGrouped.values()).filter((submission) => {
    if (zoneFilter !== 'all' && submission.zone_id !== parseInt(zoneFilter)) {
      return false;
    }
    return true;
  });

  // Sort by created_at descending
  submissions.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Calculate max checkpoints for display
  const maxCheckpoints = Math.max(
    ...submissions.map(s => Object.keys(s.checkpoints).length),
    1
  );

  const uniqueZones = [1, 2, 3, 4, 5, 6, 7, 8];

  return { 
    submissions, 
    zoneFilter,
    uniqueZones,
    maxCheckpoints
  };
}

export default function AdminSubmissions() {
  const { submissions, zoneFilter, uniqueZones, maxCheckpoints } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="document" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Rally Zone Bezoeken</h1>
          <p className="text-xl text-primary-100">Bekijk wie welke zones heeft bezocht</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Zone Bezoeken</h1>
            <p className="text-gray-600 mt-2">{submissions.length} bezoeken geregistreerd</p>
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
          <Form method="get" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-1">
                Rally Zone
              </label>
              <select
                id="zone"
                name="zone"
                value={zoneFilter}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">Alle zones</option>
                {uniqueZones.map((zone) => (
                  <option key={zone} value={zone}>
                    Rally Zone {zone}
                  </option>
                ))}
              </select>
            </div>
          </Form>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  {Array.from({ length: maxCheckpoints }, (_, i) => i + 1).map((cpNum) => (
                    <th key={cpNum} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CP{cpNum}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingediend op
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission: any) => (
                  <tr key={`${submission.participant_id}-${submission.zone_id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.participants.first_name} {submission.participants.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{submission.participants.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rally Zone {submission.zone_id}
                    </td>
                    {Array.from({ length: maxCheckpoints }, (_, i) => i + 1).map((checkpointNum) => {
                      const checkpoint = submission.checkpoints[checkpointNum];
                      if (!checkpoint) {
                        return (
                          <td key={checkpointNum} className="px-4 py-4 text-center">
                            <span className="text-xs text-gray-300">-</span>
                          </td>
                        );
                      }
                      return (
                        <td key={checkpointNum} className="px-4 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <code className="px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
                              {checkpoint.code || '-'}
                            </code>
                            <div className="text-xs text-gray-400">
                              {new Date(checkpoint.created_at).toLocaleTimeString('nl-BE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submitted_at 
                        ? new Date(submission.submitted_at).toLocaleString('nl-BE')
                        : 'Nog niet ingediend'}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={maxCheckpoints + 3} className="px-6 py-12 text-center text-gray-500">
                      Geen inzendingen gevonden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
