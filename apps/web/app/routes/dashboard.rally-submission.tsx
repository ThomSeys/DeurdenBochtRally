import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { useState } from 'react';
import { Header } from '~/components/Header';
import { Footer } from '~/components/Footer';
import { getUser } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import { getRallyZones } from '~/lib/sanity.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Rally Inzending - Dashboard' },
    { name: 'description', content: 'Vul je rally codes in en verdien punten!' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return redirect('/login');
  }

  const rallyZones = await getRallyZones().catch(() => []);

  // Get or create submission for user
  let { data: submission } = await supabase
    .from('rally_submissions')
    .select('*')
    .eq('participant_id', user.id)
    .single();

  // If no submission exists, create one
  if (!submission) {
    const { data: newSubmission } = await supabase
      .from('rally_submissions')
      .insert({
        participant_id: user.id,
        total_points: 0,
        used_highways: false,
        weather_bonus: false,
      })
      .select()
      .single();
    
    submission = newSubmission;
  }

  // Get leaderboard for standings - include all submissions, not just submitted ones
  const { data: leaderboard, error: leaderboardError } = await supabase
    .from('rally_submissions')
    .select(`
      *,
      participants(first_name, last_name)
    `)
    .order('total_points', { ascending: false })
    .order('submitted_at', { ascending: true, nullsFirst: false });

  if (leaderboardError) {
    console.error('Leaderboard error:', leaderboardError);
  }

  // Find user's rank (add 1 since findIndex is 0-based)
  const userRankIndex = leaderboard?.findIndex((entry) => entry.participant_id === user.id);
  const userRank = userRankIndex !== undefined && userRankIndex >= 0 ? userRankIndex + 1 : null;

  console.log('Leaderboard data:', { 
    count: leaderboard?.length, 
    userRank, 
    userRankIndex,
    firstEntry: leaderboard?.[0],
    hasParticipants: leaderboard?.[0]?.participants 
  });

  return json({ user, rallyZones, submission, leaderboard: leaderboard || [], userRank });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const action = formData.get('action');

  try {
    if (action === 'updateCode') {
      const zoneNumber = formData.get('zoneNumber');
      const code = formData.get('code');
      
      if (!zoneNumber || typeof code !== 'string') {
        return json({ error: 'Ongeldige invoer' }, { status: 400 });
      }

      const columnName = `rz${zoneNumber}_code`;
      
      const { error } = await supabase
        .from('rally_submissions')
        .update({ [columnName]: code || null })
        .eq('participant_id', user.id);

      if (error) {
        console.error('Update error:', error);
        return json({ error: 'Fout bij opslaan' }, { status: 400 });
      }

      return json({ success: true, message: 'Code opgeslagen!' });
    }

    if (action === 'updateExtras') {
      const totalDistance = formData.get('totalDistance');
      const usedHighways = formData.get('usedHighways') === 'true';
      const weatherBonus = formData.get('weatherBonus') === 'true';

      const { error } = await supabase
        .from('rally_submissions')
        .update({
          total_distance: totalDistance ? parseInt(totalDistance.toString()) : null,
          used_highways: usedHighways,
          weather_bonus: weatherBonus,
        })
        .eq('participant_id', user.id);

      if (error) {
        console.error('Update error:', error);
        return json({ error: 'Fout bij opslaan' }, { status: 400 });
      }

      return json({ success: true, message: 'Extra vragen opgeslagen!' });
    }

    if (action === 'finalSubmit') {
      const { error } = await supabase
        .from('rally_submissions')
        .update({ submitted_at: new Date().toISOString() })
        .eq('participant_id', user.id);

      if (error) {
        console.error('Submit error:', error);
        return json({ error: 'Fout bij indienen' }, { status: 400 });
      }

      return redirect('/dashboard?submitted=true');
    }

    return json({ error: 'Ongeldige actie' }, { status: 400 });
  } catch (error) {
    console.error('Rally submission error:', error);
    return json({ error: 'Er is iets misgegaan' }, { status: 500 });
  }
}

export default function RallySubmission() {
  const { user, rallyZones, submission, leaderboard, userRank } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [editingZone, setEditingZone] = useState<number | null>(null);

  const isSubmitted = !!submission?.submitted_at;

  const getCodeForZone = (zoneIndex: number) => {
    const columnName = `rz${zoneIndex + 1}_code` as keyof typeof submission;
    return submission?.[columnName] as string | null;
  };

  // Calculate filled zones count
  const filledZonesCount = rallyZones.filter((_, index) => getCodeForZone(index)).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 py-16">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-display font-bold mb-4">Rally Inzending</h1>
            <p className="text-xl text-gray-700">
              Vul je rally zone codes in om punten te verdienen 🏍
            </p>
          </div>

          {actionData && 'success' in actionData && actionData.success && (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6 max-w-6xl mx-auto">
              <p className="text-green-700 font-bold">✅ {actionData.message}</p>
            </div>
          )}

          {actionData && 'error' in actionData && actionData.error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6 max-w-6xl mx-auto">
              <p className="text-red-700 font-bold">❌ {actionData.error}</p>
            </div>
          )}
  {/* Rally Zones */}
            <div className="space-y-4 mb-8">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Card */}
              <div className="card bg-brand-600 text-white sticky top-24">
                <h3 className="text-2xl font-display font-bold mb-4">📊 Jouw Stats</h3>
                
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-brand-100 mb-1">Totale Punten</p>
                    <p className="text-4xl font-black">{submission?.total_points || 0}</p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-brand-100 mb-1">Jouw Positie</p>
                    <p className="text-4xl font-black">#{userRank ?? '-'}</p>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-brand-100 mb-1">Zones Ingevuld</p>
                    <p className="text-4xl font-black">{filledZonesCount}/{rallyZones.length}</p>
                  </div>

                  {submission?.submitted_at && (
                    <div className="bg-green-500 rounded-lg p-4 text-center">
                      <p className="text-2xl mb-2">✅</p>
                      <p className="font-black">Ingediend!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top 5 Leaderboard */}
              <div className="card">
                <h3 className="text-xl font-display font-bold mb-4">🏆 Top 5</h3>
                <div className="space-y-3">
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.slice(0, 5).map((entry, index) => {
                      const participant = entry.participants as any;
                      const isCurrentUser = entry.participant_id === user.id;
                      
                      return (
                        <div 
                          key={entry.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isCurrentUser ? 'bg-brand-100 border-2 border-brand-600' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl font-black text-gray-400">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                            <div>
                              <p className={`font-bold ${isCurrentUser ? 'text-brand-600' : ''}`}>
                                {participant?.team_name || `${participant?.first_name} ${participant?.last_name}`}
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-brand-600">{entry.total_points}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nog geen deelnemers</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">

            {/* Rally Zones */}
            <div className="space-y-4 mb-8">
              <h2 className="text-2xl font-display font-bold">Rally Zones</h2>
              
              {rallyZones.filter((z) => z !== null).map((zone, index) => {
                const currentCode = getCodeForZone(index);
                const isEditing = editingZone === index;
                const colorClasses: Record<string, string> = {
                  green: 'border-l-4 border-green-500',
                  yellow: 'border-l-4 border-yellow-500',
                  orange: 'border-l-4 border-orange-500',
                  red: 'border-l-4 border-red-500',
                };

                return (
                  <div key={zone._id} className={`card ${colorClasses[zone.color] || 'border-l-4 border-gray-500'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{zone.title}</h3>
                        <p className="text-sm text-gray-600">{zone.checkpoint}</p>
                        <p className="text-primary-600 font-bold">{zone.points} punten</p>
                      </div>
                      {currentCode && !isEditing && (
                        <span className="text-2xl">✅</span>
                      )}
                    </div>

                    {isEditing ? (
                      <Form method="post" className="space-y-3">
                        <input type="hidden" name="action" value="updateCode" />
                        <input type="hidden" name="zoneNumber" value={index + 1} />
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Code (gevonden bij het checkpoint)
                          </label>
                          <input
                            type="text"
                            name="code"
                            defaultValue={currentCode || ''}
                            placeholder="Bijv. DDB123"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary flex-1"
                          >
                            {isSubmitting ? 'Opslaan...' : 'Opslaan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingZone(null)}
                            className="btn-secondary flex-1"
                          >
                            Annuleren
                          </button>
                        </div>
                      </Form>
                    ) : (
                      <div>
                        {currentCode ? (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-600">Jouw code:</p>
                            <p className="font-mono font-bold text-lg">{currentCode}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm mb-3">Nog geen code ingevuld</p>
                        )}
                        <button
                          onClick={() => setEditingZone(index)}
                          className="btn-secondary w-full"
                        >
                          {currentCode ? 'Code aanpassen' : 'Code invullen'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>

              {/* Extra Questions */}
              <div className="card bg-blue-50 border-2 border-blue-400 mb-8">
                <h2 className="text-2xl font-display font-bold mb-4">Extra Vragen</h2>
                
                <Form method="post" className="space-y-4">
                  <input type="hidden" name="action" value="updateExtras" />
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Totale afstand (km)
                    </label>
                    <input
                      type="number"
                      name="totalDistance"
                      defaultValue={submission?.total_distance || ''}
                      placeholder="Bijv. 250"
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-600"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="usedHighways"
                        value="true"
                        defaultChecked={submission?.used_highways}
                        className="w-5 h-5"
                      />
                      <span className="font-bold">Heb je snelwegen gebruikt?</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="weatherBonus"
                        value="true"
                        defaultChecked={submission?.weather_bonus}
                        className="w-5 h-5"
                      />
                      <span className="font-bold">Slecht weer bonus (regen tijdens de rit)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full"
                  >
                    {isSubmitting ? 'Opslaan...' : 'Extra vragen opslaan'}
                  </button>
                </Form>
              </div>

              {/* Final Submit */}
              <div className="card bg-yellow-50 border-2 border-yellow-400">
                <h3 className="text-xl font-bold mb-4">🏁 Klaar om in te dienen?</h3>
                <p className="text-gray-700 mb-4">
                  Let op: Na het indienen kun je geen wijzigingen meer aanbrengen. 
                  Zorg ervoor dat alle codes correct zijn ingevuld!
                </p>
                <Form method="post">
                  <input type="hidden" name="action" value="finalSubmit" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-lg"
                  >
                    {isSubmitting ? 'Indienen...' : 'Definitief indienen'}
                  </button>
                </Form>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
                   
