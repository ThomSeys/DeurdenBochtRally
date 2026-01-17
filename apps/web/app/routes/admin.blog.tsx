import { useState } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useActionData, Form, useNavigation } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabase } from '~/lib/supabase.server';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';

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
  await requireAdmin(request);

  // Get all ride stories with participant info
  const { data: stories, error } = await (supabase as any)
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
        const { error } = await (supabase as any)
          .from('ride_stories')
          .update({ is_approved: true })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story approved' };
      }

      case 'unapprove': {
        const { error } = await (supabase as any)
          .from('ride_stories')
          .update({ is_approved: false })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story unapproved' };
      }

      case 'feature': {
        const { error } = await (supabase as any)
          .from('ride_stories')
          .update({ is_featured: true })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story featured' };
      }

      case 'unfeature': {
        const { error } = await (supabase as any)
          .from('ride_stories')
          .update({ is_featured: false })
          .eq('id', storyId);

        if (error) throw error;
        return { success: 'Story unfeatured' };
      }

      case 'delete': {
        const { error } = await (supabase as any)
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
  const isSubmitting = navigation.state === 'submitting';

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');

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

        {/* Alert messages */}
        {actionData?.success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-sm">
            {actionData.success}
          </div>
        )}
        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-sm">
            {actionData.error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-white rounded-sm shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
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
                <li key={story.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {story.title}
                        </h3>
                        {story.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ Featured
                          </span>
                        )}
                        {story.is_approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Goedgekeurd
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            In afwachting
                          </span>
                        )}
                      </div>
                      
                      {story.excerpt && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {story.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Icon name="user" className="w-4 h-4" />
                          {story.participant?.name || 'Onbekend'}
                          {story.participant?.bib_number && ` (#${story.participant.bib_number})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="heart" className="w-4 h-4" />
                          {story.like_count} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="eye" className="w-4 h-4" />
                          {story.view_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" className="w-4 h-4" />
                          {new Date(story.created_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      <Form method="post" className="inline">
                        <input type="hidden" name="storyId" value={story.id} />
                        {!story.is_approved ? (
                          <button
                            type="submit"
                            name="intent"
                            value="approve"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <Icon name="check" className="w-4 h-4 mr-1" />
                            Goedkeuren
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="unapprove"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <Icon name="x" className="w-4 h-4 mr-1" />
                            Afkeuren
                          </button>
                        )}
                      </Form>

                      <Form method="post" className="inline">
                        <input type="hidden" name="storyId" value={story.id} />
                        {!story.is_featured ? (
                          <button
                            type="submit"
                            name="intent"
                            value="feature"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <Icon name="star" className="w-4 h-4 mr-1" />
                            Feature
                          </button>
                        ) : (
                          <button
                            type="submit"
                            name="intent"
                            value="unfeature"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <Icon name="star" className="w-4 h-4 mr-1" />
                            Unfeature
                          </button>
                        )}
                      </Form>

                      <Form
                        method="post"
                        className="inline"
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
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <Icon name="trash" className="w-4 h-4 mr-1" />
                          Verwijderen
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
