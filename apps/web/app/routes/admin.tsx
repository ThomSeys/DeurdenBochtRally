import { Outlet, redirect } from 'react-router';
import { requireAdmin } from '~/lib/session.server';
import { isFeatureEnabled } from '~/lib/feature-flags.server';
import Header from '~/components/Header';
import { createRequestLogger } from '~/lib/logger.server';

export async function loader({ request }: any) {
  const userId = await requireAdmin(request);
  const requestLogger = createRequestLogger(request, userId);
  
  await requestLogger.info('page-view', 'Admin layout loaded');
  
  // Check if admin dashboard is enabled
  const adminDashboardEnabled = await isFeatureEnabled('admin-dashboard-enabled');
  
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
