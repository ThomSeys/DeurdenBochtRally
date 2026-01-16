import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, Link } from 'react-router';
import { useState } from 'react';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sanityClient } from '~/lib/sanity.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Submissions - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const url = new URL(request.url);
  const zoneFilter = url.searchParams.get('zone') || 'all';
  const statusFilter = url.searchParams.get('status') || 'all';

  // Get correct answers from Sanity
  const rallyZones = await sanityClient.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      order,
      solution,
      validAnswers,
    }`
  );

  // Create a map of zone -> correct code and valid answers
  const correctAnswers: Record<number, string> = {};
  const validAnswersMap: Record<number, string[]> = {};
  
  rallyZones.forEach((zone: any) => {
    correctAnswers[zone.order] = zone.solution?.toLowerCase().trim() || '';
    validAnswersMap[zone.order] = (zone.validAnswers || []).map((ans: string) => ans.toLowerCase().trim());
  });

  // Get all zone submissions (primary data source) with participant info
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

  // Get all rally submissions (aggregated data with zone codes)
  const { data: rallySubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select('participant_id, rz1_code, rz2_code, rz3_code, rz4_code, rz5_code, rz6_code, rz7_code, rz8_code, submitted_at');

  // Create a map for quick lookup: participantId -> rally submission with codes
  const rallySubmissionMap: Record<string, any> = {};
  rallySubmissions?.forEach((rs: any) => {
    rallySubmissionMap[rs.participant_id] = rs;
  });

  // Group by participant AND zone - create one record per zone per participant with all checkpoint answers
  const zoneSubmissionsGrouped: Map<string, any> = new Map();
  
  zoneSubmissions?.forEach((zoneSubmission: any) => {
    const zoneId = parseInt(zoneSubmission.zone_id);
    const participantId = zoneSubmission.participant_id;
    const checkpointNumber = zoneSubmission.checkpoint_number || 1;
    const key = `${participantId}-${zoneId}`; // Unique key per participant per zone
    
    // Get or create zone record for this participant
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
    
    // Get the rally submission for this participant to find the submitted code
    // Note: There's one code per zone (not per checkpoint), stored in rally_submissions table
    const rallySubmission = rallySubmissionMap[participantId];
    const zoneCode = rallySubmission?.[`rz${zoneId}_code`] || '';
    
    // For multi-checkpoint zones, the code might be in format "answer1|answer2|answer3"
    // Split and get the answer for this specific checkpoint
    const codeParts = zoneCode.split('|').map((c: string) => c.trim());
    const code = codeParts[checkpointNumber - 1] || codeParts[0] || '';
    
    // Check correctness
    const submittedCode = code.toLowerCase().trim();
    const correctCode = correctAnswers[zoneId - 1] || '';
    const validCodes = validAnswersMap[zoneId - 1] || [];
    const isCorrect = submittedCode === correctCode || validCodes.includes(submittedCode);
    
    // Store checkpoint data
    groupedRecord.checkpoints[checkpointNumber] = {
      code: code,
      is_correct: isCorrect,
      correct_answer: correctCode || 'Niet beschikbaar',
      shadow_score: zoneSubmission.shadow_score,
      rhythm_score: zoneSubmission.rhythm_score,
      view_score: zoneSubmission.view_score,
      answer_accuracy: zoneSubmission.answer_accuracy,
      created_at: zoneSubmission.created_at
    };
  });

  // Convert to array and apply filters
  const submissions = Array.from(zoneSubmissionsGrouped.values()).filter((submission) => {
    // Zone filter
    if (zoneFilter !== 'all' && submission.zone_id !== parseInt(zoneFilter)) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const hasMatchingCheckpoint = Object.values(submission.checkpoints).some((checkpoint: any) => {
        if (statusFilter === 'correct' && checkpoint.is_correct) return true;
        if (statusFilter === 'incorrect' && !checkpoint.is_correct) return true;
        return false;
      });
      if (!hasMatchingCheckpoint) {
        return false;
      }
    }
    
    return true;
  });

  // Sort by created_at descending
  submissions.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Calculate max checkpoints needed for display
  const maxCheckpoints = Math.max(
    ...submissions.map(s => Object.keys(s.checkpoints).length),
    1 // Minimum 1 checkpoint
  );

  const uniqueZones = [1, 2, 3, 4, 5, 6, 7, 8];

  return { 
    submissions, 
    zoneFilter, 
    statusFilter,
    uniqueZones,
    maxCheckpoints
  };
}

export default function AdminSubmissions() {
  const { submissions, zoneFilter, statusFilter, uniqueZones, maxCheckpoints } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rally Code Submissions</h1>
            <p className="text-gray-600 mt-2">{submissions.length} inzendingen gevonden</p>
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

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={statusFilter}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">Alle statussen</option>
                <option value="correct">Correct</option>
                <option value="incorrect">Incorrect</option>
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
                            <code className={`px-2 py-1 rounded text-xs font-mono ${
                              checkpoint.is_correct 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {checkpoint.code || '-'}
                            </code>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              {checkpoint.answer_accuracy !== null && checkpoint.answer_accuracy !== undefined && (
                                <div className="text-orange-600 font-semibold">
                                  {checkpoint.answer_accuracy.toFixed(1)} meter
                                </div>
                              )}
                              {checkpoint.shadow_score !== null && checkpoint.shadow_score !== undefined && (
                                <div className="text-purple-600 font-bold">
                                  Score: {checkpoint.shadow_score.toFixed(1)}
                                </div>
                              )}
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
