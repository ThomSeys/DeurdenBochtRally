import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Rider Groups – Deur Den Bocht" },
];

export default function RiderGroups() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeading
        title="Rider Groups"
        subtitle="Your group members and their current status."
      />
      {/* TODO: load groups from Supabase */}
    </div>
  );
}
