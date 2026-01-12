import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form } from 'react-router';
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

  // Create a map of zone -> correct code, valid answers, and points
  const correctAnswers: Record<number, string> = {};
  const validAnswersMap: Record<number, string[]> = {};
  const zonePoints: Record<number, number> = {};
  
  rallyZones.forEach((zone: any) => {
    correctAnswers[zone.order] = zone.solution?.toLowerCase().trim() || '';
    validAnswersMap[zone.order] = (zone.validAnswers || []).map((ans: string) => ans.toLowerCase().trim());
  });

  // Get all rally submissions with participant info
  const { data: allSubmissions } = await supabaseAdmin
    .from('rally_submissions')
    .select(`
      *,
      participants!inner (
        first_name,
        last_name,
        email,
        license_plate
      )
    `)
    .order('submitted_at', { ascending: false });

  // Get all zone submissions with shadow scores
  const { data: zoneSubmissions } = await supabaseAdmin
    .from('rally_zone_submissions')
    .select('participant_id, zone_id, shadow_score, rhythm_score, view_score, answer_accuracy, created_at');

  // Create a map for quick lookup: participantId-zoneId -> shadow score
  const shadowScoreMap: Record<string, any> = {};
  zoneSubmissions?.forEach((zs: any) => {
    const key = `${zs.participant_id}-${zs.zone_id}`;
    shadowScoreMap[key] = {
      shadow_score: zs.shadow_score,
      rhythm_score: zs.rhythm_score,
      view_score: zs.view_score,
      answer_accuracy: zs.answer_accuracy,
      created_at: zs.created_at
    };
  });

  // Transform each submission into individual zone entries with correctness check
  const submissions: any[] = [];
  
  allSubmissions?.forEach((submission: any) => {
    for (let i = 1; i <= 8; i++) {
      const code = submission[`rz${i}_code`];
      if (code && code.trim() !== '') {
        const submittedCode = code.toLowerCase().trim();
        const zoneIndex = i - 1; // Convert to 0-based index for Sanity
        const correctCode = correctAnswers[zoneIndex] || '';
        const validAnswers = validAnswersMap[zoneIndex] || [];
        
        // Check if submitted code matches any valid answer
        const isCorrect = validAnswers.some(valid => valid === submittedCode);

        // Get shadow scores for this zone submission
        // Get shadow scores for this zone submission
        const shadowKey = `${submission.participant_id}-${i}`;
        const shadowData = shadowScoreMap[shadowKey] || { 
          shadow_score: null, 
          rhythm_score: null, 
          view_score: null, 
          answer_accuracy: null,
          created_at: null 
        };

        // Apply zone filter
        if (zoneFilter !== 'all' && i !== parseInt(zoneFilter)) {
          continue;
        }

        // Apply status filter
        if (statusFilter === 'correct' && !isCorrect) {
          continue;
        }
        if (statusFilter === 'incorrect' && isCorrect) {
          continue;
        }

        console.log(shadowData.created_at);

        submissions.push({
          id: `${submission.id}-zone${i}`,
          participant_id: submission.participant_id,
          zone_id: i,
          code: code,
          submitted_at: submission.submitted_at,
          participants: submission.participants,
          is_correct: isCorrect,
          shadow_score: shadowData.shadow_score,
          rhythm_score: shadowData.rhythm_score,
          view_score: shadowData.view_score,
          answer_accuracy: shadowData.answer_accuracy,
          correct_answer: correctAnswers[zoneIndex] || 'Niet beschikbaar'
        });
      }
    }
  });

  // Sort by submitted_at descending
  submissions.sort((a, b) => {
    const dateA = new Date(a.submitted_at || 0).getTime();
    const dateB = new Date(b.submitted_at || 0).getTime();
    return dateB - dateA;
  });

  const uniqueZones = [1, 2, 3, 4, 5, 6, 7, 8];

  return { 
    submissions, 
    zoneFilter, 
    statusFilter,
    uniqueZones
  };
}

export default function AdminSubmissions() {
  const { submissions, zoneFilter, statusFilter, uniqueZones } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rally Code Submissions</h1>
          <p className="text-gray-600 mt-2">{submissions.length} inzendingen gevonden</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingediend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correct Antwoord
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuraatheid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ritme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shadow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingediend op
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission: any) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.participants.first_name} {submission.participants.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{submission.participants.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rally Zone {submission.zone_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                        {submission.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-green-50 text-green-800 rounded text-sm font-mono">
                        {submission.correct_answer}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.is_correct ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          ✗ Incorrect
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.answer_accuracy !== null && submission.answer_accuracy !== undefined ? (
                        <span className="text-sm font-semibold text-orange-600">
                          {(submission.answer_accuracy * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Nog niet berekend</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.rhythm_score !== null && submission.rhythm_score !== undefined ? (
                        <span className="text-sm font-semibold text-blue-600">
                          {submission.rhythm_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.view_score !== null && submission.view_score !== undefined ? (
                        <span className="text-sm font-semibold text-green-600">
                          {submission.view_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {submission.shadow_score !== null && submission.shadow_score !== undefined ? (
                        <span className="text-sm font-bold text-purple-600">
                          {submission.shadow_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submitted_at 
                        ? new Date(submission.submitted_at).toLocaleString('nl-BE')
                        : 'Nog niet ingediend'}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
