import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { adminClient } from "~/lib/supabase.server";
import { listEvents } from "@ddb/supabase/services/event";
import { PageHeading } from "~/components/ui/PageHeading";
import { LinkButton } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";

export async function loader(_: LoaderFunctionArgs) {
  const admin = adminClient();
  const { events, error } = await listEvents(admin);
  return { events, error };
}

export default function AdminEventsIndex() {
  const { events, error } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeading title="Events" subtitle="All editions of Deur Den Bocht." />
        <LinkButton to="/admin/events/new" intent="primary" size="sm">
          + New event
        </LinkButton>
      </div>

      {error && <Alert intent="error">{error}</Alert>}

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-surface-card px-6 py-16 text-center">
          <p className="text-sm text-gray-500">No events yet.</p>
          <LinkButton to="/admin/events/new" intent="primary" size="sm" className="mt-4">
            Create your first event
          </LinkButton>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-card">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Registration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{event.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-400">{event.slug}</td>
                  <td className="px-4 py-3 text-gray-400">{event.event_date}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {event.registration_opens_at
                      ? `${formatDate(event.registration_opens_at)} → ${event.registration_closes_at ? formatDate(event.registration_closes_at) : "open"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {event.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/events/${event.id}/edit`}
                      className="text-xs font-medium text-orange-500 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-BE", { day: "2-digit", month: "short", year: "numeric" });
