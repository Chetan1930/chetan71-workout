import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import { setsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/summary/$sessionId")({
  head: () => ({
    meta: [
      { title: "Session Summary — IRONLOG" },
      {
        name: "description",
        content: "Total volume, sets and exercises completed in the workout you just finished.",
      },
      { property: "og:title", content: "Session Summary — IRONLOG" },
      { property: "og:description", content: "Volume, sets and lifts from your finished session." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { sessionId } = useParams({ from: "/_authenticated/summary/$sessionId" });
  const { data: sets } = useQuery(setsQuery(sessionId));
  const done = sets?.filter((s) => s.completed) ?? [];
  const volume = done.reduce((n, s) => n + (s.weight ?? 0) * (s.reps ?? 0), 0);
  const exercises = new Set(done.map((s) => s.exercise_id)).size;

  return (
    <main className="screen-pad pt-10">
      <Trophy className="h-12 w-12 text-accent" />
      <h1 className="mt-3 font-display text-5xl leading-none">Session done</h1>
      <p className="mt-2 text-sm text-muted-foreground">Logged and banked. Recovery starts now.</p>

      <div className="surface mt-6 grid grid-cols-3 divide-x divide-border p-4 text-center">
        <div>
          <p className="font-mono text-2xl font-bold">{done.length}</p>
          <p className="label-caps">sets</p>
        </div>
        <div>
          <p className="font-mono text-2xl font-bold">{exercises}</p>
          <p className="label-caps">lifts</p>
        </div>
        <div>
          <p className="font-mono text-2xl font-bold">{Math.round(volume)}</p>
          <p className="label-caps">kg volume</p>
        </div>
      </div>

      <Link
        to="/today"
        className="mt-6 flex h-14 w-full items-center justify-center rounded-xl bg-primary font-bold uppercase tracking-wide text-primary-foreground"
      >
        Back to today
      </Link>
    </main>
  );
}
