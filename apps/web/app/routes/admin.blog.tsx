import { useState, useEffect } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useActionData, Form, useNavigation } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useToast } from '~/contexts/ToastContext';
import { createRequestLogger } from '~/lib/logger.server';

interface Story {
  id: string;
  participant_id: string;
  sanity_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string;
  is_approved: boolean;
  is_featured: boolean;
  like_count: number;
  view_count: number;
  created_at: string;
  participant?: {
    name: string;
    bib_number: number | null;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin blog management loaded');

  // Get all ride stories with participant info
  const { data: stories, error } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select(`
      *
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stories:', error);
  }

  // Flatten the participant data
  const formattedStories = stories?.map((story: any) => ({
    ...story,
    participant: Array.isArray(story.participants) ? story.participants[0] : story.participants
  })) || [];

  return { stories: formattedStories };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const storyId = formData.get('storyId') as string;

  if (!storyId) {
    return { error: 'Story ID is required' };
  }

  try {
    switch (intent) {
      case 'approve': {
        const { error } = await (supabaseAdmin as any)
          .from('ride_stories')
          .update({ is_approved: true })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story approved' };
      }

      case 'unapprove': {
        const { error } = await (supabaseAdmin as any)
          .from('ride_stories')
          .update({ is_approved: false })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story unapproved' };
      }

      case 'feature': {
        const { error } = await (supabaseAdmin as any)
          .from('ride_stories')
          .update({ is_featured: true })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story featured' };
      }

      case 'unfeature': {
        const { error } = await (supabaseAdmin as any)
          .from('ride_stories')
          .update({ is_featured: false })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story unfeatured' };
      }

      case 'delete': {
        const { error } = await (supabaseAdmin as any)
          .from('ride_stories')
          .delete()
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story deleted' };
      }

      default:
        return { error: 'Invalid action' };
    }
  } catch (error) {
    console.error('Error performing action:', error);
    return { error: 'Failed to perform action' };
  }
}

export default function AdminBlog() {
  const { stories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { success, error } = useToast();
  const isSubmitting = navigation.state === 'submitting';

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

  useEffect(() => {
    if (actionData?.success) {
      success(actionData.success);
    }
    if (actionData?.error) {
      error(actionData.error);
    }
  }, [actionData, success, error]);

  const typedStories = stories as unknown as Story[];

  const filteredStories = typedStories.filter((story: Story) => {
    if (filter === 'pending') return !story.is_approved;
    if (filter === 'approved') return story.is_approved;
    if (filter === 'featured') return story.is_featured;
    return true;
  }) as Story[];

  const pendingCount = typedStories.filter((s) => !s.is_approved).length;
  const approvedCount = typedStories.filter((s) => s.is_approved).length;
  const featuredCount = typedStories.filter((s) => s.is_featured).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ride Stories Moderatie</h1>
          <p className="text-gray-600">Beheer en modereer verhalen van deelnemers</p>
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-sm shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-col md:flex-row space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setFilter('all')}
                className={`${
                  filter === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Alle ({typedStories.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`${
                  filter === 'pending'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                In afwachting ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`${
                  filter === 'approved'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Goedgekeurd ({approvedCount})
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`${
                  filter === 'featured'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Featured ({featuredCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Stories list */}
        {filteredStories.length === 0 ? (
          <div className="bg-white rounded-sm shadow p-12 text-center">
            <Icon name="book-open" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Geen verhalen gevonden</p>
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {filteredStories.map((story: Story) => (
                <li key={story.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                          {story.title}
                        </h3>
                        {story.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
                            ⭐ Featured
                          </span>
                        )}
                        {story.is_approved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                            ✓ Goedgekeurd
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                            In afwachting
                          </span>
                        )}
                      </div>
                      
                      {story.excerpt && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">
                          {story.excerpt}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Icon name="user" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {story.participant?.name || 'Onbekend'}
                            {story.participant?.bib_number && ` (#${story.participant.bib_number})`}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Icon name="heart" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {story.like_count}
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Icon name="eye" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {story.view_count}
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Icon name="calendar" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {new Date(story.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col gap-2 sm:ml-6">
                      <Form method="post" className="flex-1 sm:flex-initial">
                        <input type="hidden" name="storyId" value={story.id} />
                        {!story.is_approved ? (
                          <button
                            type="submit"
                            name="intent"
                            value="approve"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Icon name="check" className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Goedkeuren</span>
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="unapprove"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Icon name="x" className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Afkeuren</span>
                          </button>
                        )}
                      </Form>

                      <Form method="post" className="flex-1 sm:flex-initial">
                        <input type="hidden" name="storyId" value={story.id} />
                        {!story.is_featured ? (
                          <button
                            type="submit"
                            name="intent"
                            value="feature"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Icon name="star" className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Feature</span>
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="unfeature"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 whitespace-nowrap"
                          >
                            <Icon name="star" className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Unfeature</span>
                          </button>
                        )}
                      </Form>

                      <Form
                        method="post"
                        className="flex-1 sm:flex-initial"
                        onSubmit={(e) => {
                          if (!confirm('Weet je zeker dat je dit verhaal wilt verwijderen?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="storyId" value={story.id} />
                        <button
                          type="submit"
                          name="intent"
                          value="delete"
                          disabled={isSubmitting}
                          className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 whitespace-nowrap"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Verwijderen</span>
                        </button>
                      </Form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
