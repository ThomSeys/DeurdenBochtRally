import { Outlet } from 'react-router';
import type { Route } from './+types/admin';
import { requireAdmin } from '~/lib/session.server';
import Header from '~/components/Header';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return {};
}

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
}
