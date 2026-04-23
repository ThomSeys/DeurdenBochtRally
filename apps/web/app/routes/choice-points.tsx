import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Choice Points – Deur Den Bocht" },
];

export default function ChoicePoints() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
        Choice Points
      </h1>
      <p className="text-gray-500">
        Upcoming decision forks — sidetrack or rally zone?
      </p>
      {/* TODO: load choice points from Supabase */}
    </div>
  );
}
