import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Leaderboard – Deur Den Bocht" },
];

export default function Leaderboard() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeading
        title="Leaderboard"
        subtitle="Live standings — updated in real time."
      />

      {/* Placeholder table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-card">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Rider / Group</th>
              <th className="px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                {/* TODO: stream leaderboard from Supabase Realtime */}
                No data yet — rally hasn&apos;t started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
