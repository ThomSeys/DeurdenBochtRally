import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { adminClient } from "~/lib/supabase.server";
import { listEvents } from "@ddb/supabase/services/event";
import { PageHeading } from "~/components/ui/PageHeading";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { LinkButton } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { Badge } from "~/components/ui/Badge";
import { StatCard } from "~/components/ui/StatCard";

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
        <SectionHeading>Quick actions</SectionHeading>
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
          <SectionHeading>Recent events</SectionHeading>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-card">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                      <Badge intent={event.is_active ? "active" : "inactive"}>
                        {event.is_active ? "Active" : "Inactive"}
                      </Badge>
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



