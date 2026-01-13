import type { LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from 'react-router';
import { useLoaderData, Form, redirect, useActionData } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Instellingen - Admin - Deur Den Bocht' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  
  try {
    // Get all participants to see admin status
    const { data: admins } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email, is_admin')
      .eq('is_admin', true)
      .order('first_name');

    const { data: allParticipants } = await supabaseAdmin
      .from('participants')
      .select('id, first_name, last_name, email, is_admin')
      .order('first_name');

    return { admins: admins || [], allParticipants: allParticipants || [] };
  } catch (error) {
    console.log('[AdminSettings] Offline:', error);
    return { admins: [], allParticipants: [] };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  console.info('[admin.settings] action start');

  try {
    await requireAdmin(request);
    const formData = await request.formData();
    const action = formData.get('action') as string;

    if (action === 'toggle_admin') {
      const participantId = formData.get('participant_id') as string;
      const currentStatus = formData.get('current_status') === 'true';

      const { error } = await supabaseAdmin
        .from('participants')
        .update({ is_admin: !currentStatus })
        .eq('id', participantId);

      if (error) {
        return { error: error.message };
      }

      console.info('[admin.settings] action success', { action, participantId });
      return redirect('/admin/settings');
    }

    console.info('[admin.settings] action success', { action: 'noop' });
    return null;
  } catch (error) {
    console.error('[admin.settings] action error', error);
    return { error: 'Onverwachte fout' };
  }
}

export default function AdminSettings() {
  const { admins, allParticipants } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
          <p className="text-gray-600 mt-2">Beheer systeem instellingen en admin gebruikers</p>
        </div>

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {/* Current Admins */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Admin Gebruikers ({admins.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {admins.map((admin: any) => (
              <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {admin.first_name} {admin.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{admin.email}</div>
                </div>
                <Form method="post" className="inline">
                  <input type="hidden" name="action" value="toggle_admin" />
                  <input type="hidden" name="participant_id" value={admin.id} />
                  <input type="hidden" name="current_status" value="true" />
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
                  >
                    Admin rechten intrekken
                  </button>
                </Form>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                Geen admin gebruikers gevonden
              </div>
            )}
          </div>
        </div>

        {/* All Participants */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alle Deelnemers</h2>
            <p className="text-sm text-gray-600 mt-1">Klik om admin rechten toe te kennen</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allParticipants.map((participant: any) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.first_name} {participant.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {participant.is_admin ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Gebruiker
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Form method="post" className="inline">
                        <input type="hidden" name="action" value="toggle_admin" />
                        <input type="hidden" name="participant_id" value={participant.id} />
                        <input type="hidden" name="current_status" value={participant.is_admin ? 'true' : 'false'} />
                        <button
                          type="submit"
                          className={`${
                            participant.is_admin
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-primary-600 hover:text-primary-900'
                          }`}
                        >
                          {participant.is_admin ? 'Intrekken' : 'Maak admin'}
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
