import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Link, useParams } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Deelnemer Antwoorden - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  const participantId = params.participantId || "";

  // Get participant info
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', participantId)
    .single();

  if (!participant) {
    throw new Response('Participant not found', { status: 404 });
  }

  console.log('Looking for submissions for participant:', { 
    id: participantId, 
    email: participant.email,
    name: `${participant.first_name} ${participant.last_name}`
  });

  // Get the rally submission (single row with all zone codes)
  const { data: rallySubmission } = await supabaseAdmin
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .single();

  console.log('Rally submission row:', rallySubmission);

  // Transform the single row into individual zone submissions
  const submissions = [];
  if (rallySubmission) {
    for (let i = 1; i <= 8; i++) {
      const code = (rallySubmission as any)[`rz${i}_code`];
      if (code && code.trim() !== '') {
        submissions.push({
          zone_id: i,
          code: code,
          submitted_at: rallySubmission.submitted_at,
          // Note: We don't have individual correct/incorrect info per zone in this structure
          // Would need to compare against correct answers to determine this
        });
      }
    }
  }

  console.log('Transformed submissions:', submissions);

  // Calculate total points from the rally_submission row
  const totalPoints = rallySubmission?.total_points || 0;
  
  const score = {
    total_points: totalPoints,
    shadow_total: rallySubmission?.shadow_total || 0,
    final_score: rallySubmission?.final_score || totalPoints
  };

  // No need to query zone start times separately since we only have one submission row
  return { 
    participant,
    submissions,
    score,
    rallySubmission
  };
}

export default function ParticipantSubmissions() {
  const { participant, submissions, score, rallySubmission } = useLoaderData<typeof loader>();

  console.log('Participant submissions data:', { 
    participantId: participant.id,
    submissionsCount: submissions.length,
    submissions,
    rallySubmission
  });

  // Group submissions by zone
  const submissionsByZone: Record<string, any[]> = {};
  submissions.forEach((sub: any) => {
    const zoneId = String(sub.zone_id);
    if (!submissionsByZone[zoneId]) {
      submissionsByZone[zoneId] = [];
    }
    submissionsByZone[zoneId].push(sub);
  });

  const zoneIds = Object.keys(submissionsByZone).sort((a, b) => Number(a) - Number(b));

  console.log('Grouped by zone:', { submissionsByZone, zoneIds });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Link 
            to="/admin/participants" 
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            ← Terug naar deelnemers
          </Link>
        </div>

        {/* Participant Header */}
        <div className="bg-white rounded-sm shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {participant.first_name} {participant.last_name}
              </h1>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>{participant.email}</p>
                <p>{participant.motorcycle_brand} {participant.motorcycle_model} • {participant.license_plate}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Rally Punten</div>
              <div className="text-4xl font-bold text-primary-600">
                {score.total_points}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Uit {submissions.length} ingevulde zones
              </div>
            </div>
          </div>
        </div>

        {/* Additional Rally Info */}
        {rallySubmission && (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Totale afstand:</span>
                <span className="ml-2 font-semibold">{rallySubmission.total_distance} km</span>
              </div>
              <div>
                <span className="text-gray-600">Start KM:</span>
                <span className="ml-2 font-semibold">{rallySubmission.start_km}</span>
              </div>
              <div>
                <span className="text-gray-600">Eind KM:</span>
                <span className="ml-2 font-semibold">{rallySubmission.end_km}</span>
              </div>
              <div>
                <span className="text-gray-600">Snelweg gebruikt:</span>
                <span className={`ml-2 font-semibold ${rallySubmission?.used_highways ? 'text-red-600' : 'text-green-600'}`}>
                  {rallySubmission?.used_highways ? 'Ja' : 'Nee'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-sm shadow p-4">
            <div className="text-sm text-gray-600">Zones Ingevuld</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {submissions.length} / 8
            </div>
          </div>
          <div className="bg-white rounded-sm shadow p-4">
            <div className="text-sm text-gray-600">Totale Afstand</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {rallySubmission?.total_distance || 0} km
            </div>
          </div>
          <div className="bg-white rounded-sm shadow p-4">
            <div className="text-sm text-gray-600">Rally Punten</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {score.total_points}
            </div>
          </div>
          <div className="bg-white rounded-sm shadow p-4">
            <div className="text-sm text-gray-600">Ingediend</div>
            <div className="text-sm font-bold text-gray-900 mt-1">
              {rallySubmission?.submitted_at 
                ? new Date(rallySubmission.submitted_at).toLocaleString('nl-BE')
                : 'Nog niet ingediend'}
            </div>
          </div>
        </div>

        {/* Submissions by Zone */}
        <div className="space-y-6">
          {zoneIds.length === 0 ? (
            <div className="bg-white rounded-sm shadow p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>Deze deelnemer heeft nog geen rally codes ingediend</p>
            </div>
          ) : (
            zoneIds.map((zoneId) => {
              const zoneSubmissions = submissionsByZone[zoneId];
              const submission = zoneSubmissions[0]; // Only one submission per zone in this data structure

              return (
                <div key={zoneId} className="bg-white rounded-sm shadow overflow-hidden">
                  <div className="bg-primary-50 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-900">Rally Zone {zoneId}</h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">📍</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-600">Antwoord:</span>
                          <code className="px-4 py-2 bg-gray-100 rounded font-mono text-lg font-semibold">
                            {submission.code}
                          </code>
                        </div>
                        {rallySubmission?.submitted_at && (
                          <div className="text-xs text-gray-500">
                            Ingediend op {new Date(rallySubmission.submitted_at).toLocaleString('nl-BE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
