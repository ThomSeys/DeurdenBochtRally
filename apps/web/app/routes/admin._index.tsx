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

export default function AdminIndex() {
  const { events, error } = useLoaderData<typeof loader>();

  const activeEvent = events.find((e) => e.is_active);
  const totalEvents = events.length;

  return (
    <div className="space-y-8">
      <PageHeading
        title="Admin Overview"
        subtitle="Manage your Deur Den Bocht events and data."
      />

      {error && <Alert intent="error">{error}</Alert>}

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total events" value={String(totalEvents)} />
        <StatCard
          label="Active event"
          value={activeEvent?.name ?? "None"}
          highlight={!!activeEvent}
        />
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
          Quick actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <LinkButton to="/admin/events" intent="secondary" size="sm">
            Manage events
          </LinkButton>
          <LinkButton to="/admin/events/new" intent="primary" size="sm">
            Create event
          </LinkButton>
        </div>
      </div>

      {/* Recent events */}
      {events.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500">
            Recent events
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-card">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.slice(0, 5).map((event) => (
                  <tr key={event.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">
                      <Link
                        to={`/admin/events`}
                        className="hover:text-orange-400 transition-colors"
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{event.event_date}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div className="rounded-xl border border-white/10 bg-surface-card p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
    <p
      className={`mt-1 text-2xl font-bold ${highlight ? "text-orange-400" : "text-white"}`}
    >
      {value}
    </p>
  </div>
);
