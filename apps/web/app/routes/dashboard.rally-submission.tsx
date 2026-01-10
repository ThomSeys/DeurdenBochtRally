import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { getRallyZones } from '~/lib/sanity.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Inzending - Dashboard' },
    { name: 'description', content: 'Dien je rally foto\'s in en verdien punten!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return redirect('/login');
  }

  const rallyZones = await getRallyZones().catch(() => []);

  // Check if user already has a submission
  const { data: existingSubmission } = await supabase
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .single();

  return json({ user, rallyZones, existingSubmission });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const zoneId = formData.get('zoneId');
  const photoUrl = formData.get('photoUrl');
  const notes = formData.get('notes');

  if (typeof zoneId !== 'string' || typeof photoUrl !== 'string') {
    return json(
      { error: 'Zone en foto zijn verplicht' },
      { status: 400 }
    );
  }

  try {
    // Insert rally submission
    const { error: submissionError } = await supabase
      .from('rally_submissions')
      .insert({
        participant_id: user.id,
        zone_id: zoneId,
        photo_url: photoUrl,
        notes: notes?.toString() || null,
        submitted_at: new Date().toISOString(),
      });

    if (submissionError) {
      console.error('Submission error:', submissionError);
      return json(
        { error: 'Fout bij het indienen. Probeer het opnieuw.' },
        { status: 400 }
      );
    }

    return redirect('/dashboard?submitted=true');
  } catch (error) {
    console.error('Rally submission error:', error);
    return json(
      { error: 'Er is iets misgegaan. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}

export default function RallySubmission() {
  const { user, rallyZones, existingSubmission } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  if (existingSubmission) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <main className="flex-1 py-16">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto">
              <div className="card text-center">
                <span className="text-6xl mb-4 block">✅</span>
                <h1 className="text-4xl font-display font-bold mb-4">Je hebt al ingediend!</h1>
                <p className="text-xl text-gray-700 mb-6">
                  Je rally inzending is ontvangen. De resultaten worden bekendgemaakt tijdens het feest.
                </p>
                <a href="/dashboard" className="btn-primary inline-block">
                  Terug naar Dashboard
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-display font-bold mb-4">Rally Inzending</h1>
              <p className="text-xl text-gray-700">
                Upload je foto's en verdien punten! 📸
              </p>
            </div>

            <div className="card">
              {actionData?.error && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
                  <p className="text-red-700 font-bold">❌ {actionData.error}</p>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">📋 Instructies:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload een duidelijke foto bij elke rally zone</li>
                  <li>• Je moet zichtbaar zijn op de foto samen met je motor</li>
                  <li>• Foto's worden beoordeeld door de jury</li>
                  <li>• De meeste punten wint!</li>
                </ul>
              </div>

              <Form method="post" className="space-y-6">
                <div>
                  <label htmlFor="zoneId" className="block text-sm font-bold text-gray-700 mb-2">
                    Selecteer Rally Zone *
                  </label>
                  <select
                    id="zoneId"
                    name="zoneId"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                  >
                    <option value="">Kies een zone...</option>
                    {rallyZones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.icon} {zone.name} - {zone.points} punten
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="photoUrl" className="block text-sm font-bold text-gray-700 mb-2">
                    Foto URL *
                  </label>
                  <input
                    type="url"
                    id="photoUrl"
                    name="photoUrl"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                    placeholder="https://..."
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Upload je foto eerst naar een bestandshost (bijv. Imgur) en plak hier de link
                  </p>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-bold text-gray-700 mb-2">
                    Notities (optioneel)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-0 transition-colors"
                    placeholder="Voeg extra informatie toe over je foto..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Bezig met indienen...' : 'Dien in 🚀'}
                  </button>
                  <a
                    href="/dashboard"
                    className="btn-secondary flex-1 text-center"
                  >
                    Annuleren
                  </a>
                </div>
              </Form>
            </div>

            <div className="mt-8">
              <div className="card bg-yellow-50 border-2 border-yellow-400">
                <h3 className="text-lg font-bold mb-2">⚠️ Let op!</h3>
                <p className="text-sm text-gray-700">
                  Je kunt maar één keer indienen. Zorg ervoor dat je alle foto's hebt voordat je indient.
                  In de toekomst kun je meerdere zones uploaden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
