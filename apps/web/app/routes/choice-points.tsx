import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Choice Points – Deur Den Bocht" },
];

export default function ChoicePoints() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeading
        title="Choice Points"
        subtitle="Upcoming decision forks — sidetrack or rally zone?"
      />
      {/* TODO: load choice points from Supabase */}
    </div>
  );
}
