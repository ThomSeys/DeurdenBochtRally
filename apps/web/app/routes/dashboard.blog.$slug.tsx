import { useState, useEffect } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useActionData, useNavigation, redirect } from 'react-router';
import { requireUserId, getUser } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { createClient } from '@sanity/client';
import { PortableText } from '@portabletext/react';
import Header from '~/components/Header';
import { Icon } from '~/components/Icon';
import { useToast } from '~/contexts/ToastContext';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const user = await getUser(request);

  if (!user) {
    throw new Response('Niet gevonden', { status: 404 });
  }

  const { slug } = params;

  if (!slug) {
    throw new Response('Niet gevonden', { status: 404 });
  }

  // Get the story from the database
  const { data: story } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select(`
      *,
      participants (
        first_name,
        last_name
      )
    `)
    .eq('slug', slug)
    .eq('is_approved', true)
    .single();

  if (!story) {
    throw new Response('Verhaal niet gevonden', { status: 404 });
  }

  // Get the full content from Sanity
  const sanityStory = await sanityClient.fetch(
    `*[_type == "rideStory" && _id == $sanityId][0]{
      _id,
      title,
      slug,
      excerpt,
      body,
      featuredImage {
        asset -> {
          url,
          metadata {
            dimensions
          }
        }
      },
      publishedAt
    }`,
    { sanityId: story.sanity_id }
  );

  // Get participant data
  const { data: participant } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!participant) {
    throw new Response('Deelnemer niet gevonden', { status: 404 });
  }

  // Check if user has liked this story
  const { data: userLike } = await (supabaseAdmin as any)
    .from('ride_story_likes')
    .select('id')
    .eq('story_id', story.id)
    .eq('participant_id', participant.id)
    .single();

  // Get comments for this story
  const { data: commentsRaw, error: commentsError } = await (supabaseAdmin as any)
    .from('ride_story_comments')
    .select('*')
    .eq('story_id', story.id)
    .order('created_at', { ascending: false });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  // Fetch participant data for each comment
  const comments = await Promise.all(
    (commentsRaw || []).map(async (comment: any) => {
      const { data: participant } = await supabaseAdmin
        .from('participants')
        .select('first_name, last_name')
        .eq('id', comment.participant_id)
        .single();
      
      return {
        ...comment,
        participants: participant || null,
      };
    })
  );

  // Increment view count
  await (supabaseAdmin as any)
    .from('ride_stories')
    .update({ view_count: (story.view_count || 0) + 1 })
    .eq('id', story.id);

  return {
    story: {
      ...story,
      participantName: story.participants
        ? `${story.participants.first_name} ${story.participants.last_name}`
        : 'Onbekend',
    },
    sanityStory,
    participant,
    hasLiked: !!userLike,
    comments: comments || [],
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
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

  const { slug } = params;
  const { data: story } = await (supabaseAdmin as any)
    .from('ride_stories')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!story) {
    return { error: 'Verhaal niet gevonden' };
  }

  if (intent === 'like') {
    const { error } = await (supabaseAdmin as any)
      .from('ride_story_likes')
      .insert({
        story_id: story.id,
        participant_id: participant.id,
      });

    if (error) {
      return { error: error.message };
    }
    return { success: true };
  }

  if (intent === 'unlike') {
    const { error } = await (supabaseAdmin as any)
      .from('ride_story_likes')
      .delete()
      .eq('story_id', story.id)
      .eq('participant_id', participant.id);

    if (error) {
      return { error: error.message };
    }
    return { success: true };
  }

  if (intent === 'comment') {
    const content = formData.get('content') as string;

    if (!content || content.trim().length === 0) {
      return { error: 'Reactie kan niet leeg zijn' };
    }

    console.log('Inserting comment for story:', story.id, 'participant:', participant.id);
    
    const { data: insertedComment, error } = await (supabaseAdmin as any)
      .from('ride_story_comments')
      .insert({
        story_id: story.id,
        participant_id: participant.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Comment error:', error);
      return { error: error.message };
    }

    console.log('Comment inserted successfully:', insertedComment);
    return redirect(`/dashboard/blog/${slug}`);
  }

  return { error: 'Ongeldige actie' };
}

export default function BlogDetail() {
  const { story, sanityStory, participant, hasLiked, comments } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { success, error } = useToast();
  const isSubmitting = navigation.state === 'submitting';
  const [localLiked, setLocalLiked] = useState(hasLiked);
  const [localLikeCount, setLocalLikeCount] = useState(story.like_count || 0);

  useEffect(() => {
    if (actionData?.error) {
      error(actionData.error);
    }
  }, [actionData, error, success]);

  useEffect(() => {
    setLocalLiked(hasLiked);
    setLocalLikeCount(story.like_count || 0);
  }, [hasLiked, story.like_count]);

  const toggleLike = () => {
    setLocalLiked(!localLiked);
    setLocalLikeCount(localLiked ? localLikeCount - 1 : localLikeCount + 1);
  };

  const portableTextComponents = {
    block: {
      h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
      h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
      h3: ({ children }: any) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
      normal: ({ children }: any) => <p className="mb-4 leading-relaxed">{children}</p>,
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-primary-600 pl-4 italic my-6 text-gray-700">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
      number: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
    },
    marks: {
      strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
      em: ({ children }: any) => <em className="italic">{children}</em>,
      link: ({ children, value }: any) => (
        <a href={value.href} className="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      ),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <a
            href="/dashboard/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Icon name="arrow-left" className="w-5 h-5" />
            Terug naar overzicht
          </a>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Image */}
        {sanityStory?.featuredImage?.asset?.url && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={sanityStory.featuredImage.asset.url}
              alt={sanityStory.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {story.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Icon name="user" className="w-5 h-5 text-primary-600" />
              </div>
              <span className="font-medium">{story.participantName}</span>
            </div>
            <span>•</span>
            <time dateTime={story.published_at}>
              {new Date(story.published_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </time>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Icon name="eye" className="w-4 h-4" />
              <span>{story.view_count || 0} weergaven</span>
            </div>
          </div>

          {story.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {story.excerpt}
            </p>
          )}
        </header>

        {/* Article Body */}
        <div className="prose prose-lg max-w-none mb-12">
          {sanityStory?.body ? (
            <PortableText value={sanityStory.body} components={portableTextComponents} />
          ) : (
            <p className="text-gray-500 italic">Geen inhoud beschikbaar</p>
          )}
        </div>

        {/* Engagement Section */}
        <div className="border-t border-b py-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Form method="POST" className="flex items-center gap-2">
                <input type="hidden" name="intent" value={localLiked ? 'unlike' : 'like'} />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={toggleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${
                    localLiked
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon
                    name="heart"
                    className={`w-5 h-5 ${localLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span>{localLikeCount}</span>
                </button>
              </Form>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="message-circle" className="w-5 h-5" />
                <span>{comments.length} reacties</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reacties ({comments.length})
          </h2>

          {/* Comment Form */}
          <Form method="POST" className="mb-8">
            <input type="hidden" name="intent" value="comment" />
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Plaats een reactie
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Deel je gedachten..."
                required
              />
              {actionData?.error && (
                <p className="mt-2 text-sm text-red-600">{actionData.error}</p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="loader" className="w-4 h-4 animate-spin" />
                      Versturen...
                    </>
                  ) : (
                    <>
                      <Icon name="send" className="w-4 h-4" />
                      Plaatsen
                    </>
                  )}
                </button>
              </div>
            </div>
          </Form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="message-circle" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nog geen reacties. Wees de eerste!</p>
              </div>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="user" className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {comment.participants
                            ? `${comment.participants.first_name} ${comment.participants.last_name}`
                            : 'Onbekend'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(comment.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
