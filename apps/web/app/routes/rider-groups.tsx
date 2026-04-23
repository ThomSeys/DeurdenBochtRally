import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Rider Groups – Deur Den Bocht" },
];

export default function RiderGroups() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
        Rider Groups
      </h1>
      <p className="text-gray-500">
        Your group members and their current status.
      </p>
      {/* TODO: load groups from Supabase */}
    </div>
  );
}
