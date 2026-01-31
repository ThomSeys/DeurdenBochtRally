import { Outlet, redirect } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { isFeatureEnabled } from '~/lib/feature-flags.server';
import Header from '~/components/Header';

export async function loader({ request }: any) {
  await requireAdmin(request);
  
  // Check if admin dashboard is enabled
  const adminDashboardEnabled = await isFeatureEnabled('admin-dashboard-enabled');
  
  console.log('[admin] Admin dashboard feature flag:', adminDashboardEnabled);
  
  if (!adminDashboardEnabled) {
    console.log('[admin] Blocking access - feature flag is disabled');
    throw new Response('Admin dashboard is currently disabled', { 
      status: 403,
      statusText: 'Forbidden'
    });
  }
  
  return { adminDashboardEnabled };
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
}
