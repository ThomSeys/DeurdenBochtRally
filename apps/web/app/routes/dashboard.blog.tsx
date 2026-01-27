import { useState, useCallback } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData, useNavigation } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Niet gevonden', { status: 404 });
  }

  // Get participant data
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!participant) {
    throw new Response('Deelnemer niet gevonden', { status: 404 });
  }

  // Get stories liked by this participant
  const { data: likedStories } = await (supabaseAdmin as any)
    .from('ride_story_likes')
    .select('story_id')
    .eq('participant_id', participant.id);

  const likedStoryIds = new Set(
    likedStories?.map((like: any) => like.story_id) || []
  );

  // Get participant's own stories
  const { data: myStories } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select('*')
    .eq('participant_id', participant.id)
    .order('created_at', { ascending: false});

  // Get all approved stories with participant info
  const { data: allStories } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select(`
      *,
      participants (
        first_name,
        last_name
      )
    `)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return {
    participant,
    myStories: myStories || [],
    allStories: allStories || [],
    likedStoryIds: Array.from(likedStoryIds),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('id')
    .eq('id', userId)
    .single();

  if (!participant) {
    return { error: 'Deelnemer niet gevonden' };
  }

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'like') {
    const storyId = formData.get('storyId') as string;
    const { error } = await (supabaseAdmin as any)
      .from('ride_story_likes')
      .insert({
        story_id: storyId,
        participant_id: participant.id,
      });

    if (error) {
      return { error: error.message };
    }
    return { success: true };
  }

  if (intent === 'unlike') {
    const storyId = formData.get('storyId') as string;
    const { error } = await (supabaseAdmin as any)
      .from('ride_story_likes')
      .delete()
      .eq('story_id', storyId)
      .eq('participant_id', participant.id);

    if (error) {
      return { error: error.message };
    }
    return { success: true };
  }

  return { error: 'Ongeldig verzoek' };
}

export default function DashboardBlog() {
  const loaderData = useLoaderData<typeof loader>();
  const { participant, myStories, allStories, likedStoryIds } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [localLikes, setLocalLikes] = useState<Set<string>>(
    new Set(likedStoryIds as string[])
  );

  const isSubmitting = navigation.state === 'submitting';

  const toggleLike = useCallback((storyId: string) => {
    setLocalLikes(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }, []);

  const displayStories = filter === 'mine' 
    ? (myStories as any[]).map((s: any) => ({
        _id: s.id,
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt,
        participantName: `${(participant as any).first_name} ${(participant as any).last_name}`,
        publishedAt: s.published_at,
        likeCount: s.like_count || 0,
        viewCount: s.view_count || 0,
      }))
    : (allStories as any[]).map((s: any) => ({
        _id: s.id,
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt,
        participantName: s.participants 
          ? `${s.participants.first_name} ${s.participants.last_name}`
          : 'Onbekend',
        publishedAt: s.published_at,
        likeCount: s.like_count || 0,
        viewCount: s.view_count || 0,
      }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="book-open" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Blog & Verhalen</h1>
          <p className="text-xl text-white/90">Deel en ontdek verhalen van de rit</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Create Button */}
        <div className="mb-8 flex items-center justify-between">
          <div></div>
          <a
            href="/dashboard/blog/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-sm font-medium hover:shadow-lg transition-all hover:scale-105"
          >
            <Icon name="plus" className="w-5 h-5" />
            Nieuw verhaal
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 px-2 font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alle verhalen
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`pb-4 px-2 font-medium transition-colors ${
              filter === 'mine'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mijn verhalen
          </button>
        </div>

        {actionData?.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {actionData.error}
          </div>
        )}

        {/* Stories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayStories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Icon name="inbox" className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {filter === 'mine' 
                  ? "Je hebt nog geen verhalen gedeeld"
                  : 'Geen verhalen beschikbaar'}
              </p>
            </div>
          ) : (
            displayStories.map((story: any) => (
              <div
                key={story._id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 flex flex-col"
              >
                <a href={`/dashboard/blog/${story.slug}`} className="block p-6 flex-1 hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                    {story.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="font-medium">{story.participantName}</span>
                    {story.publishedAt && (
                      <span>{new Date(story.publishedAt).toLocaleDateString('nl-NL')}</span>
                    )}
                  </div>
                </a>

                <div className="flex items-center justify-between p-6 pt-0 border-t">
                  <div className="flex items-center gap-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-1">
                      <Icon
                        name="heart"
                        className={`w-4 h-4 ${
                          localLikes.has(story._id) ? 'fill-red-500 text-red-500' : ''
                        }`}
                      />
                      <span className="font-medium">{story.likeCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="eye" className="w-4 h-4" />
                      <span>{story.viewCount || 0}</span>
                    </div>
                  </div>

                  {filter === 'all' && (
                    <Form method="POST" className="flex gap-2">
                      <input type="hidden" name="intent" value={localLikes.has(story._id) ? 'unlike' : 'like'} />
                      <input type="hidden" name="storyId" value={story._id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          localLikes.has(story._id)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                        onClick={() => toggleLike(story._id)}
                      >
                        <Icon 
                          name="heart" 
                          className={`w-4 h-4 ${localLikes.has(story._id) ? 'fill-current' : ''}`}
                        />
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Stories Button */}
        {filter === 'mine' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setFilter('all')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-sm font-medium hover:shadow-lg transition-all hover:scale-105"
            >
              <Icon name="arrow-right" className="w-5 h-5" />
              Alle verhalen bekijken
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
