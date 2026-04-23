import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Dashboard – Deur Den Bocht" },
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeading
        title="Dashboard"
        subtitle="Your personal overview — points, completed tasks, and upcoming stages."
      />
      {/* TODO: load rider stats from Supabase */}
    </div>
  );
}
