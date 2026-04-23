import type { MetaFunction } from "react-router";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Rally – Deur Den Bocht" },
];

export default function Rally() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeading
        title="Rally"
        subtitle="Live rally view — map, current position, active tasks."
      />
      {/* TODO: integrate Leaflet map + live GPS tracking */}
    </div>
  );
}
