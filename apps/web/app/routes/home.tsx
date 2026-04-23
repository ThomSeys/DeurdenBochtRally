import type { MetaFunction } from "react-router";
import { Card } from "~/components/ui/Card";
import { LinkButton } from "~/components/ui/Button";

export const meta: MetaFunction = () => [
  { title: "Deur Den Bocht – Motorcycle Rally" },
  { name: "description", content: "The ultimate motorcycle rally experience." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex min-h-[calc(100svh-64px)] flex-col items-center justify-center gap-6 px-4 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-500">
          2026 Edition
        </p>
        <h1 className="max-w-2xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
          Deur&nbsp;Den&nbsp;Bocht
        </h1>
        <p className="max-w-xl text-lg text-gray-400">
          Navigate. Discover. Conquer. The motorcycle rally that takes you off
          the beaten path through the most scenic roads.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton to="/register" size="lg">
            Register now
          </LinkButton>
          <LinkButton to="/about" intent="secondary" size="lg">
            Learn more
          </LinkButton>
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-white/5 bg-surface-card/40 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-3">
          {[
            {
              title: "Live leaderboard",
              body: "Track your position against other riders in real time.",
            },
            {
              title: "Choice points",
              body: "Decide your own route at every fork — risk vs. reward.",
            },
            {
              title: "Rally zones",
              body: "Complete tasks, collect points, and explore freely.",
            },
          ].map(({ title, body }) => (
            <Card key={title} title={title} body={body} />
          ))}
        </div>
      </section>
    </>
  );
}
