import { useState } from 'react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { Form, useLoaderData, useNavigation, redirect } from 'react-router';
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
    .select('id')
    .eq('id', user.id)
    .single();

  if (!participant) {
    throw new Response('Deelnemer niet gevonden', { status: 404 });
  }

  return { participant };
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

  if (request.method !== 'POST') {
    return { error: 'Ongeldig verzoek' };
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const excerpt = formData.get('excerpt') as string;

  if (!title || !excerpt) {
    return { error: 'Alle velden zijn vereist' };
  }

  try {
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Generate a unique sanity_id
    const sanityId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('Creating story with participant_id:', participant.id, 'title:', title, 'excerpt:', excerpt);

    const { data: story, error } = await (supabaseAdmin as any)
      .from('ride_stories')
      .insert({
        participant_id: participant.id,
        title,
        excerpt,
        slug,
        sanity_id: sanityId,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Full error creating story:', error);
      console.error('Story data attempted:', { participant_id: participant.id, title, excerpt, slug, sanity_id: sanityId });
      return { error: 'Fout bij het maken van verhaal' };
    }

    return redirect('/dashboard/blog');
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Een onverwachte fout is opgetreden' };
  }
}

export default function NewStory() {
  const { participant } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    const title = formData.get('title') as string;
    const excerpt = formData.get('excerpt') as string;

    if (!title || title.trim().length === 0) {
      newErrors.title = 'Titel is vereist';
    } else if (title.length > 200) {
      newErrors.title = 'Titel mag niet langer zijn dan 200 tekens';
    }

    if (!excerpt || excerpt.trim().length === 0) {
      newErrors.excerpt = 'Samenvatting is vereist';
    } else if (excerpt.length > 500) {
      newErrors.excerpt = 'Samenvatting mag niet langer zijn dan 500 tekens';
    } else if (excerpt.length < 20) {
      newErrors.excerpt = 'Samenvatting moet minstens 20 tekens zijn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    if (!validateForm(formData)) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400 text-white py-16 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
            <Icon name="pen" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Nieuw verhaal</h1>
          <p className="text-xl text-white/90">Deel jouw ervaring met de deelnemers</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Form method="post" onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
          {/* Title Field */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              Titel
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Geef je verhaal een titel..."
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icon name="alert-circle" className="w-4 h-4" />
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Max 200 tekens</p>
          </div>

          {/* Excerpt Field */}
          <div className="mb-6">
            <label htmlFor="excerpt" className="block text-sm font-semibold text-gray-900 mb-2">
              Samenvatting
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              placeholder="Geef een korte samenvatting van je verhaal..."
              maxLength={500}
              minLength={20}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <Icon name="alert-circle" className="w-4 h-4" />
                {errors.excerpt}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">20 - 500 tekens</p>
          </div>

          {/* Info Box */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <Icon name="info" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Waar gaat het volledige verhaal heen?</p>
                <p>Het volledige verhaal wordt beheerd via Sanity CMS. Je titel en samenvatting worden eerst hier opgeslagen, en daarna kan je het volledige verhaal toevoegen in het contentbeheersysteem.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href="/dashboard/blog"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
            >
              Annuleren
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="w-5 h-5 animate-spin" />
                  Bezig met opslaan...
                </>
              ) : (
                <>
                  <Icon name="check" className="w-5 h-5" />
                  Verhaal publiceren
                </>
              )}
            </button>
          </div>
        </Form>

        {/* Tips Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon name="lightbulb" className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Schrijftips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Maak je titel aantrekkelijk en duidelijk</li>
                  <li>• Schrijf een samenvatting die aandacht trekt</li>
                  <li>• Wees eerlijk over je ervaring</li>
                  <li>• Delen is zeggen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon name="heart" className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Wat werkt goed</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Persoonlijke anekdotes en verhalen</li>
                  <li>• Leuke momenten en hoogtepunten</li>
                  <li>• Uitdagingen die je hebt overwonnen</li>
                  <li>• Tips voor andere deelnemers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
