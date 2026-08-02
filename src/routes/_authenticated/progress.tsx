import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { historyQuery, streakQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress & Streak — IRONLOG" },
      {
        name: "description",
        content: "Your training streak and the last 30 workout sessions you logged.",
      },
      { property: "og:title", content: "Progress & Streak — IRONLOG" },
      { property: "og:description", content: "Consistency first: streaks and session history." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useAuth();
  const { data: streak } = useQuery(streakQuery(user?.id));
  const { data: history } = useQuery(historyQuery(user?.id));

  return (
    <main className="screen-pad pt-8">
      <h1 className="font-display text-5xl leading-none">Progress</h1>

      <div className="surface glow-primary mt-5 flex items-center gap-4 p-5">
        <Flame className="h-10 w-10 text-accent" />
        <div>
          <p className="font-mono text-4xl font-bold leading-none">{streak ?? 0}</p>
          <p className="label-caps">day streak</p>
        </div>
      </div>

      <h2 className="mt-8 font-display text-2xl">Recent sessions</h2>
      <ul className="mt-3 space-y-2">
        {history?.length ? (
          history.map((h) => (
            <li key={h.id} className="surface flex items-center justify-between p-4">
              <div>
                <p className="font-display text-xl leading-tight">{h.day?.name ?? "Workout"}</p>
                <p className="font-mono text-xs text-muted-foreground">{h.session_date}</p>
              </div>
              <span
                className={`label-caps ${h.completed_at ? "text-primary" : "text-muted-foreground"}`}
              >
                {h.completed_at ? "Completed" : "In progress"}
              </span>
            </li>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No sessions logged yet.</p>
        )}
      </ul>
    </main>
  );
}
