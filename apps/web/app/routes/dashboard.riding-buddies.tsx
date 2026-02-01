import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useNavigation, useActionData, Link } from 'react-router';
import { useState } from 'react';
import { redirect } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabase, supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export const meta: MetaFunction = () => {
  return [{ title: 'Naftgenoten - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Not Found', { status: 404 });
  }

  // Get all buddies using the view
  const { data: buddies, error } = await supabase
    .from('participant_buddies')
    .select('*')
    .eq('participant_id', userId)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching buddies:', error);
  }

  // Get pending requests sent by me
  const { data: pendingSent } = await supabaseAdmin
    .from('riding_buddies')
    .select(`
      *,
      buddy:participants!riding_buddies_buddy_id_fkey(
        id, first_name, last_name, email, motorcycle_brand, motorcycle_model, 
        profile_photo_url, route_preference, phone
      )
    `)
    .eq('participant_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get pending requests I need to accept
  const { data: pendingReceived } = await supabaseAdmin
    .from('riding_buddies')
    .select(`
      *,
      requester:participants!riding_buddies_participant_id_fkey(
        id, first_name, last_name, email, motorcycle_brand, motorcycle_model,
        profile_photo_url, route_preference, phone
      )
    `)
    .eq('buddy_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  // Get buddy achievements for this user
  const { data: achievements } = await supabase
    .from('buddy_group_achievements')
    .select(`
      *,
      achievement:buddy_achievements(*),
      members:buddy_group_achievement_members(
        participant:participants(
          id,
          first_name,
          last_name,
          profile_photo_url
        )
      )
    `)
    .or(`primary_participant_id.eq.${userId},buddy_group_achievement_members.participant_id.eq.${userId}`)
    .eq('is_unlocked', true)
    .order('unlocked_at', { ascending: false });

  // Get buddy check-ins (recent activity)
  const { data: recentCheckIns } = await supabase
    .from('rally_zone_checkins')
    .select(`
      *,
      participant:participants(id, first_name, last_name, profile_photo_url),
      zone:rally_zones(name, zone_number)
    `)
    .in('participant_id', buddies?.map((b: any) => b.buddy_id) || [])
    .order('checked_in_at', { ascending: false })
    .limit(10);

  return { 
    user, 
    buddies: buddies || [],
    pendingSent: pendingSent || [],
    pendingReceived: pendingReceived || [],
    achievements: achievements || [],
    recentCheckIns: recentCheckIns || []
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const action = formData.get('action');
  const buddyId = formData.get('buddyId');

  if (!buddyId || typeof buddyId !== 'string') {
    return { error: 'Buddy ID is verplicht' };
  }

  if (action === 'accept') {
    // Accept buddy request
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .update({ status: 'accepted' })
      .eq('participant_id', buddyId)
      .eq('buddy_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error accepting buddy request:', error);
      return { error: 'Kon verzoek niet accepteren' };
    }

    return { success: true, message: 'Naftgenoot toegevoegd!' };
  }

  if (action === 'reject') {
    // Reject buddy request
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .delete()
      .eq('participant_id', buddyId)
      .eq('buddy_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error rejecting buddy request:', error);
      return { error: 'Kon verzoek niet afwijzen' };
    }

    return { success: true, message: 'Verzoek afgewezen' };
  }

  if (action === 'remove') {
    const { error } = await supabaseAdmin
      .from('riding_buddies')
      .delete()
      .or(`and(participant_id.eq.${userId},buddy_id.eq.${buddyId}),and(participant_id.eq.${buddyId},buddy_id.eq.${userId})`);

    if (error) {
      return { error: 'Kon buddy niet verwijderen' };
    }

    return { success: true, message: 'Buddy verwijderd' };
  }

  return { error: 'Ongeldige actie' };
}

export default function RidingBuddies() {
  const { user, buddies, pendingSent, pendingReceived, achievements, recentCheckIns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addingBuddy, setAddingBuddy] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchEmail.trim()) {
      setSearchError('Vul een e-mailadres in');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const response = await fetch(`/api/riding-buddies?email=${encodeURIComponent(searchEmail)}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || 'Geen deelnemer gevonden');
        return;
      }

      setSearchResult(data);
    } catch (error) {
      setSearchError('Er ging iets mis bij het zoeken');
    } finally {
      setSearching(false);
    }
  };

  const handleAddBuddy = async () => {
    if (!searchResult?.participant?.id) return;

    setAddingBuddy(true);

    try {
      const formData = new FormData();
      formData.append('action', 'add');
      formData.append('buddyId', searchResult.participant.id);

      const response = await fetch('/api/riding-buddies', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh page to show new buddy
        window.location.reload();
      } else {
        setSearchError(data.error || 'Kon buddy niet toevoegen');
      }
    } catch (error) {
      setSearchError('Er ging iets mis');
    } finally {
      setAddingBuddy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Naftgenoten</h1>
          <p className="text-gray-600">
            Voeg mederijders toe om samen in een groep te rijden. Zo weten wij wie er samen onderweg is.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Naftgenoten</p>
                <p className="text-3xl font-bold text-gray-900">{buddies.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="users" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Openstaande Verzoeken</p>
                <p className="text-3xl font-bold text-gray-900">{pendingReceived.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Icon name="clock" className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recente Check-ins</p>
                <p className="text-3xl font-bold text-gray-900">{recentCheckIns.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="map-pin" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests to Accept */}
        {pendingReceived.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="user-plus" className="w-5 h-5" />
                Nieuwe Verzoeken ({pendingReceived.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingReceived.map((request: any) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      {request.requester.profile_photo_url ? (
                        <img
                          src={request.requester.profile_photo_url}
                          alt={request.requester.first_name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon name="user" className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                          {request.requester.first_name} {request.requester.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm truncate">{request.requester.email}</p>
                        <p className="text-gray-600 text-sm truncate">
                          {request.requester.motorcycle_brand} {request.requester.motorcycle_model}
                        </p>
                        {request.requester.route_preference && (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                            request.requester.route_preference === 'rally'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <Icon name={request.requester.route_preference === 'rally' ? 'zap' : 'leaf'} className="w-3 h-3" />
                            <span>{request.requester.route_preference === 'rally' ? 'Rally' : 'Scenic'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Form method="post" className="flex-1">
                        <input type="hidden" name="action" value="accept" />
                        <input type="hidden" name="buddyId" value={request.participant_id} />
                        <button
                          type="submit"
                          disabled={navigation.state !== 'idle'}
                          className="w-full px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                          Accepteer
                        </button>
                      </Form>
                      <Form method="post" className="flex-1">
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="buddyId" value={request.participant_id} />
                        <button
                          type="submit"
                          disabled={navigation.state !== 'idle'}
                          className="w-full px-4 py-3 sm:py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                          Weiger
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Requests Sent by Me */}
        {pendingSent.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="clock" className="w-5 h-5" />
                Verstuurde Verzoeken ({pendingSent.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingSent.map((request: any) => (
                <div key={request.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      {request.buddy.profile_photo_url ? (
                        <img
                          src={request.buddy.profile_photo_url}
                          alt={request.buddy.first_name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon name="user" className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {request.buddy.first_name} {request.buddy.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm truncate">{request.buddy.email}</p>
                        <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                          <Icon name="clock" className="w-3 h-3" />
                          Wacht op acceptatie
                        </p>
                      </div>
                    </div>
                    <Form method="post" className="w-full sm:w-auto">
                      <input type="hidden" name="action" value="remove" />
                      <input type="hidden" name="buddyId" value={request.buddy_id} />
                      <button
                        type="submit"
                        disabled={navigation.state !== 'idle'}
                        className="w-full px-4 py-3 sm:py-2 text-gray-600 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                      >
                        Intrekken
                      </button>
                    </Form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buddy Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="trophy" className="w-5 h-5" />
                Groep Achievements
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 border-${achievement.achievement.badge_color}-200 bg-${achievement.achievement.badge_color}-50`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 bg-${achievement.achievement.badge_color}-200 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon name={achievement.achievement.icon} className={`w-6 h-6 text-${achievement.achievement.badge_color}-700`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{achievement.achievement.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{achievement.achievement.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon name="calendar" className="w-3 h-3" />
                        <span>{new Date(achievement.unlocked_at).toLocaleDateString('nl-NL')}</span>
                      </div>
                      {achievement.members && achievement.members.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {achievement.members.slice(0, 3).map((member: any) => (
                            <div key={member.participant.id} className="relative group">
                              {member.participant.profile_photo_url ? (
                                <img
                                  src={member.participant.profile_photo_url}
                                  alt={member.participant.first_name}
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                  title={`${member.participant.first_name} ${member.participant.last_name}`}
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                  <Icon name="user" className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                            </div>
                          ))}
                          {achievement.members.length > 3 && (
                            <span className="text-xs text-gray-500 ml-1">+{achievement.members.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentCheckIns.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Icon name="activity" className="w-5 h-5" />
                Recente Buddy Activiteit
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentCheckIns.slice(0, 5).map((checkIn: any) => (
                <div key={checkIn.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {checkIn.participant.profile_photo_url ? (
                      <img
                        src={checkIn.participant.profile_photo_url}
                        alt={checkIn.participant.first_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Icon name="user" className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{checkIn.participant.first_name} {checkIn.participant.last_name}</span>
                        {' '}checked in bij {' '}
                        <span className="font-semibold">{checkIn.zone.name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(checkIn.checked_in_at).toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Icon name="map-pin" className="w-4 h-4" />
                      <span>Zone {checkIn.zone.zone_number}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Buddy Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="search" className="w-5 h-5" />
            Naftgenoot Toevoegen
          </h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Zoek op e-mailadres
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="email"
                  id="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="voorbeeld@email.com"
                  className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                  disabled={searching}
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {searching ? 'Zoeken...' : 'Zoeken'}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    {searchResult.participant.profile_photo_url ? (
                      <img
                        src={searchResult.participant.profile_photo_url}
                        alt={searchResult.participant.first_name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon name="user" className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                        {searchResult.participant.first_name} {searchResult.participant.last_name}
                      </h3>
                      <p className="text-gray-600 text-sm truncate">{searchResult.participant.email}</p>
                      <p className="text-gray-600 text-sm truncate">
                        {searchResult.participant.motorcycle_brand} {searchResult.participant.motorcycle_model}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    {searchResult.alreadyBuddy ? (
                      <span className="text-green-600 font-medium block text-center sm:text-left">✓ Al naftgenoten</span>
                    ) : searchResult.isPending ? (
                      <span className="text-yellow-600 font-medium block text-center sm:text-left">⏳ Verzoek verstuurd</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddBuddy}
                        disabled={addingBuddy}
                        className="w-full px-4 py-3 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
                      >
                        {addingBuddy ? 'Versturen...' : 'Verzoek Versturen'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Buddies List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Icon name="users" className="w-5 h-5" />
              Mijn Naftgenoten ({buddies.length})
            </h2>
          </div>

          {buddies.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Icon name="users" className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Nog geen naftgenoten toegevoegd</p>
              <p className="text-sm mt-2">Zoek een naftgenoot op e-mailadres om een verzoek te versturen</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {buddies.map((buddy: any) => (
                <div key={buddy.buddy_id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                      <Link to={`/dashboard/buddies/${buddy.buddy_id}`} className="flex-shrink-0">
                        {buddy.buddy_profile_photo_url ? (
                          <img
                            src={buddy.buddy_profile_photo_url}
                            alt={buddy.buddy_first_name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover hover:ring-2 hover:ring-primary-500 transition-all"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors">
                            <Icon name="user" className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/dashboard/buddies/${buddy.buddy_id}`} className="hover:text-primary-600 block">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                            {buddy.buddy_first_name} {buddy.buddy_last_name}
                          </h3>
                        </Link>
                        
                        {/* Contact Info */}
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Icon name="mail" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <a href={`mailto:${buddy.buddy_email}`} className="hover:text-primary-600 truncate">
                              {buddy.buddy_email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Icon name="phone" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <a href={`tel:${buddy.buddy_phone}`} className="hover:text-primary-600">
                              {buddy.buddy_phone}
                            </a>
                          </div>
                        </div>

                        {/* Motorcycle Info */}
                        <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-lg">
                            <Icon name="bike" className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                            <span className="font-medium text-gray-700 truncate">
                              {buddy.buddy_motorcycle_brand} {buddy.buddy_motorcycle_model}
                            </span>
                          </div>
                        </div>

                        {/* Route Preference */}
                        {buddy.buddy_route_preference && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              buddy.buddy_route_preference === 'rally'
                                ? 'bg-red-100 text-red-700'
                                : buddy.buddy_route_preference === 'scenic'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              <Icon name={buddy.buddy_route_preference === 'rally' ? 'zap' : 'leaf'} className="w-3 h-3" />
                              <span>
                                {buddy.buddy_route_preference === 'rally' ? 'Rally Route' : 
                                 buddy.buddy_route_preference === 'scenic' ? 'Scenic Route' : 
                                 'Toertocht'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-gray-400 text-xs mt-3">
                          Naftgenoten sinds {new Date(buddy.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Link
                        to={`/dashboard/buddies/${buddy.buddy_id}`}
                        className="px-4 py-3 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-center min-h-[44px] flex items-center justify-center"
                      >
                        Bekijk Profiel
                      </Link>
                      <Form method="post" className="w-full sm:w-auto">
                        <input type="hidden" name="action" value="remove" />
                        <input type="hidden" name="buddyId" value={buddy.buddy_id} />
                        <button
                          type="submit"
                          disabled={navigation.state !== 'idle'}
                          className="w-full px-4 py-3 sm:py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                          Verwijderen
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {actionData?.error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        {actionData?.success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {actionData.message}
          </div>
        )}
      </div>
    </div>
  );
}
