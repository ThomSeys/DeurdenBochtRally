import { type LoaderFunctionArgs, type MetaFunction } from 'react-router';
import { useLoaderData, Form, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { useState } from 'react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { createRequestLogger } from '~/lib/logger.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Route Challenges - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);

  const url = new URL(request.url);
  const filter = url.searchParams.get('filter') || 'all';
  const type = url.searchParams.get('type') || 'all';

  let query = supabaseAdmin
    .from('route_challenge_submissions')
    .select(`
      *,
      participants!inner(id, first_name, last_name, email, motorcycle_brand)
    `)
    .order('submitted_at', { ascending: false });

  if (filter === 'pending') {
    query = query.eq('is_validated', false);
  } else if (filter === 'validated') {
    query = query.eq('is_validated', true);
  }

  if (type !== 'all') {
    query = query.eq('challenge_type', type);
  }

  const { data: submissions, error } = await query;

  if (error) {
    await requestLogger.error('admin', 'Failed to fetch submissions', error as Error);
  }

  const { data: stats } = await supabaseAdmin
    .from('route_challenge_submissions')
    .select('id, is_validated, is_correct, challenge_type, points_awarded');

  const statsData = {
    total: stats?.length || 0,
    pending: stats?.filter(s => !s.is_validated).length || 0,
    validated: stats?.filter(s => s.is_validated).length || 0,
    correct: stats?.filter(s => s.is_correct === true).length || 0,
    incorrect: stats?.filter(s => s.is_correct === false).length || 0,
    totalPoints: stats?.reduce((sum, s) => sum + (s.points_awarded || 0), 0) || 0,
  };

  await requestLogger.info('admin', 'Submissions loaded', {
    total: statsData.total,
    pending: statsData.pending,
  });

  return { submissions: submissions || [], stats: statsData, filter, type };
}

export default function AdminChallenges() {
  const { submissions, stats, filter, type } = useLoaderData<typeof loader>();
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const getStatusBadge = (submission: any) => {
    if (!submission.is_validated) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700">
        ⏳ In onderzoek
      </span>;
    }
    if (submission.is_correct) {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
        ✓ Correct
      </span>;
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700">
      ✗ Incorrect
    </span>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      photo: 'bg-blue-50 text-blue-700',
      text: 'bg-purple-50 text-purple-700',
      multiple_choice: 'bg-indigo-50 text-indigo-700',
      number: 'bg-pink-50 text-pink-700',
    };
    const labels: Record<string, string> = {
      photo: '📸 Foto',
      text: '📝 Tekst',
      multiple_choice: '❓ Multiple Choice',
      number: '🔢 Getal',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[type] || 'bg-gray-50 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative bg-gradient-to-br from-green-900 via-green-600 to-teal-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="target" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Route Challenges</h1>
          <p className="text-xl text-green-100">Controleer en valideer challenge inzendingen</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Submissions Management</h2>
            <p className="text-gray-600 mt-2">{submissions.length} inzendingen gevonden</p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-sm shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Totaal inzendingen</div>
          </div>
          <div className="bg-white rounded-sm shadow p-6 border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">In onderzoek</div>
          </div>
          <div className="bg-white rounded-sm shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900">{stats.correct}</div>
            <div className="text-sm text-gray-600 mt-1">Correct beantwoord</div>
          </div>
          <div className="bg-white rounded-sm shadow p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-gray-900">{stats.totalPoints}</div>
            <div className="text-sm text-gray-600 mt-1">Totale punten</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-sm shadow p-6 mb-6">
          <Form method="get" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select 
                name="filter" 
                defaultValue={filter}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900"
              >
                <option value="all">Alles</option>
                <option value="pending">In onderzoek</option>
                <option value="validated">Geverifieerd</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select 
                name="type"
                defaultValue={type}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900"
              >
                <option value="all">Alle typen</option>
                <option value="photo">Foto</option>
                <option value="text">Tekst</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="number">Getal</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sm font-medium transition-colors"
              >
                Filter toepassen
              </button>
            </div>
          </Form>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-sm shadow overflow-x-auto">
          {submissions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Icon name="inbox" className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Geen inzendingen gevonden</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Deelnemer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Locatie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Antwoord</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Punten</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission: any) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.participants.first_name} {submission.participants.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{submission.participants.motorcycle_brand}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{submission.zone_id}</div>
                      <div className="text-sm text-gray-500">{submission.location_key}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(submission.challenge_type)}
                    </td>
                    <td className="px-6 py-4">
                      {submission.challenge_type === 'photo' ? (
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Bekijk foto
                        </button>
                      ) : (
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {submission.text_answer || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.points_awarded}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submitted_at).toLocaleString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!submission.is_validated && (
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Controleren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <ValidationModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}

function ValidationModal({ submission, onClose }: { submission: any; onClose: () => void }) {
  const [validating, setValidating] = useState(false);
  const [notes, setNotes] = useState('');

  const handleValidate = async (isCorrect: boolean, points: number) => {
    setValidating(true);
    try {
      const response = await fetch('/api/challenges/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          isCorrect,
          points,
          notes,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('Kon inzending niet valideren');
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Kon inzending niet valideren');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1100]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-90vh">
        <div className="flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
          <h3 className="text-lg font-bold">Inzending controleren</h3>
          <button onClick={onClose} className="text-white hover:text-green-100 text-2xl font-light">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deelnemer</label>
            <p className="text-gray-900">{submission.participants.first_name} {submission.participants.last_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Locatie</label>
            <p className="text-gray-900">{submission.zone_id} - {submission.location_key}</p>
          </div>

          {submission.challenge_type === 'photo' && submission.photo_url ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
              <img src={submission.photo_url} alt="Inzending" className="w-full rounded-sm max-h-96 object-cover" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Antwoord</label>
              <p className="text-gray-900">{submission.text_answer}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aantekeningen (optioneel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm text-gray-900"
              rows={3}
              placeholder="Voeg notities toe over deze inzending..."
            />
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={validating}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={() => handleValidate(false, 0)}
            disabled={validating}
            className="px-4 py-2 text-white bg-red-600 rounded-sm hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
          >
            Afwijzen
          </button>
          <button
            onClick={() => handleValidate(true, 5)}
            disabled={validating}
            className="px-4 py-2 text-white bg-blue-600 rounded-sm hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            Goedkeuren (5 pts)
          </button>
          <button
            onClick={() => handleValidate(true, 10)}
            disabled={validating}
            className="px-4 py-2 text-white bg-green-600 rounded-sm hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
          >
            Goedkeuren (10 pts)
          </button>
        </div>
      </div>
    </div>
  );
}
