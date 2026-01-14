import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, Link, useActionData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [{ title: 'Foto Beheer - Admin - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get all photos (pending and approved)
  const { data: photos } = await supabaseAdmin
    .from('participant_photos')
    .select(`
      *,
      participant:participants(first_name, last_name, email)
    `)
    .order('created_at', { ascending: false });

  const pendingCount = photos?.filter(p => !p.is_approved).length || 0;

  return { photos: photos || [], pendingCount };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action');
  const photoId = formData.get('photo_id') as string;

  if (action === 'approve') {
    await supabaseAdmin
      .from('participant_photos')
      .update({ is_approved: true })
      .eq('id', photoId);

    return { success: true, message: 'Foto goedgekeurd!' };
  }

  if (action === 'reject' || action === 'delete') {
    await supabaseAdmin
      .from('participant_photos')
      .delete()
      .eq('id', photoId);

    return { success: true, message: 'Foto verwijderd!' };
  }

  if (action === 'feature') {
    const isFeatured = formData.get('is_featured') === 'true';
    await supabaseAdmin
      .from('participant_photos')
      .update({ is_featured: !isFeatured })
      .eq('id', photoId);

    return { success: true, message: isFeatured ? 'Niet meer uitgelicht' : 'Foto uitgelicht!' };
  }

  return { error: 'Invalid action' };
}

export default function AdminGallery() {
  const { photos, pendingCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const pendingPhotos = photos.filter(p => !p.is_approved);
  const approvedPhotos = photos.filter(p => p.is_approved);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📸 Foto Beheer</h1>
            <p className="text-gray-600 mt-2">
              {pendingCount} foto{pendingCount !== 1 ? "'s" : ''} wacht{pendingCount === 1 ? '' : 'en'} op goedkeuring
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug naar Dashboard
          </Link>
        </div>

        {actionData?.message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* Pending Photos */}
        {pendingPhotos.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⏳ In behandeling 
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {pendingPhotos.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingPhotos.map((photo: any) => (
                <div key={photo.id} className="bg-white rounded-sm shadow-lg overflow-hidden border-2 border-yellow-400">
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || 'Rally foto'}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="font-medium text-gray-900">
                        {photo.participant?.first_name} {photo.participant?.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{photo.participant?.email}</div>
                    </div>
                    
                    {photo.caption && (
                      <p className="text-gray-700 mb-2 text-sm">{photo.caption}</p>
                    )}
                    {photo.location && (
                      <p className="text-sm text-gray-600 mb-3">📍 {photo.location}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-4">
                      {new Date(photo.created_at).toLocaleString('nl-BE')}
                    </div>

                    <div className="flex gap-2">
                      <Form method="post" className="flex-1">
                        <input type="hidden" name="action" value="approve" />
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-sm text-sm font-medium transition-colors"
                        >
                          ✓ Goedkeuren
                        </button>
                      </Form>
                      <Form method="post" className="flex-1">
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <button
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-sm text-sm font-medium transition-colors"
                        >
                          ✕ Afwijzen
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Photos */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            ✓ Goedgekeurd
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              {approvedPhotos.length}
            </span>
          </h2>
          
          {approvedPhotos.length === 0 ? (
            <div className="bg-white rounded-sm shadow p-12 text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-gray-600">Nog geen goedgekeurde foto's</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {approvedPhotos.map((photo: any) => (
                <div key={photo.id} className={`bg-white rounded-sm shadow overflow-hidden ${photo.is_featured ? 'ring-4 ring-yellow-400' : ''}`}>
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || 'Rally foto'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {photo.participant?.first_name} {photo.participant?.last_name}
                    </div>
                    {photo.caption && (
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>❤️ {photo.likes_count}</span>
                      {photo.is_featured && <span>⭐ Featured</span>}
                    </div>
                    
                    <div className="flex gap-1">
                      <Form method="post" className="flex-1">
                        <input type="hidden" name="action" value="feature" />
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <input type="hidden" name="is_featured" value={photo.is_featured.toString()} />
                        <button
                          type="submit"
                          className={`w-full py-1 rounded text-xs font-medium transition-colors ${
                            photo.is_featured 
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {photo.is_featured ? '- Featured' : '⭐ Feature'}
                        </button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="action" value="delete" />
                        <input type="hidden" name="photo_id" value={photo.id} />
                        <button
                          type="submit"
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium transition-colors"
                          onClick={(e) => !confirm('Weet je zeker dat je deze foto wilt verwijderen?') && e.preventDefault()}
                        >
                          🗑️
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
