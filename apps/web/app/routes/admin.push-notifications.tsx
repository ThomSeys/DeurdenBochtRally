import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { useLoaderData, Form, useActionData, Link } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { supabaseAdmin } from '~/lib/supabase.server';
import { sendBulkPushNotifications, notificationTemplates } from '~/lib/push-notifications.server';
import Header from '~/components/Header';

export const meta: MetaFunction = () => {
  return [{ title: 'Push Notifications - Admin - Deur Den Bocht' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  // Get active push subscriptions count
  const { count: activeSubscriptions } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return { activeSubscriptions: activeSubscriptions || 0 };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const notificationType = formData.get('type') as string;

  try {
    // Get all active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      return { error: 'Geen actieve subscriptions gevonden' };
    }

    let notification;

    switch (notificationType) {
      case 'rally-start':
        notification = notificationTemplates.rallyStart;
        break;
      case 'rally-end':
        notification = notificationTemplates.rallyEnd;
        break;
      case 'weather-warning':
        notification = notificationTemplates.weatherWarning;
        break;
      case 'leaderboard-update':
        notification = notificationTemplates.leaderboardUpdate(1);
        break;
      case 'reminder-24h':
        notification = notificationTemplates.reminder(24);
        break;
      case 'reminder-1h':
        notification = notificationTemplates.reminder(1);
        break;
      case 'custom':
        notification = {
          title: formData.get('title') as string,
          body: formData.get('body') as string,
          tag: 'custom',
        };
        break;
      default:
        return { error: 'Ongeldig notificatie type' };
    }

    const result = await sendBulkPushNotifications(subscriptions, notification);

    return {
      success: true,
      message: `Notificatie verzonden naar ${result.successful} van ${subscriptions.length} gebruikers`,
      successful: result.successful,
      failed: result.failed,
    };
  } catch (error) {
    console.error('[admin.push] error sending notifications', error);
    return { error: 'Fout bij verzenden notificaties' };
  }
}

export default function AdminPushNotifications() {
  const { activeSubscriptions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔔 Push Notifications</h1>
            <p className="text-gray-600 mt-2">
              {activeSubscriptions} actieve subscriptions
            </p>
          </div>
          <Link
            to="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-sm font-medium transition-colors"
          >
            ← Terug
          </Link>
        </div>

        {actionData?.message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {actionData.message}
            <div className="text-sm mt-2">
              ✓ Successful: {actionData.successful} | ✗ Failed: {actionData.failed}
            </div>
          </div>
        )}

        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}

        {activeSubscriptions === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
            ℹ️ Geen actieve subscriptions. Deelnemers moeten eerst notificaties inschakelen.
          </div>
        )}

        <div className="bg-white rounded-sm shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form method="post">
              <input type="hidden" name="type" value="rally-start" />
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                🏁 Rally Gestart
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="type" value="rally-end" />
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                🏁 Rally Afgelopen
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="type" value="weather-warning" />
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                ⛈️ Weerswarning
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="type" value="leaderboard-update" />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                🏆 Leaderboard Update
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="type" value="reminder-24h" />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                ⏰ 24u Herinnering
              </button>
            </Form>
            <Form method="post">
              <input type="hidden" name="type" value="reminder-1h" />
              <button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-sm font-medium transition-colors"
              >
                ⏰ 1u Herinnering
              </button>
            </Form>
          </div>
        </div>

        <div className="bg-white rounded-sm shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Notification</h2>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="type" value="custom" />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Bijvoorbeeld: Belangrijke Mededeling"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bericht
              </label>
              <textarea
                name="body"
                required
                rows={3}
                placeholder="Het bericht dat je wilt versturen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-sm font-medium transition-colors"
            >
              Verstuur Custom Notificatie
            </button>
          </Form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-sm p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Test notificaties eerst met je eigen account</li>
            <li>• Gebruik duidelijke, korte berichten</li>
            <li>• Stuur alleen belangrijke updates</li>
            <li>• Check het aantal actieve subscriptions voordat je verzendt</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
