import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "About – Deur Den Bocht" },
];

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <PageHeading
        size="lg"
        title="About the rally"
        subtitle="Deur Den Bocht is an annual motorcycle rally where riders navigate scenic routes, tackle challenges, and compete for glory on the leaderboard."
      />
      <p className="text-gray-600">
        {/* TODO: pull content from CMS */}
        More details coming soon.
      </p>
    </div>
  );
}
