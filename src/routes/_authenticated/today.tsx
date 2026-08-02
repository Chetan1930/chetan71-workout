import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Flame, Play } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  dayExercisesQuery,
  daysQuery,
  isoWeekday,
  sessionQuery,
  setsQuery,
  streakQuery,
  todayISO,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Today's Workout — IRONLOG" },
      {
        name: "description",
        content: "See the exercises scheduled for today, your streak and jump straight into training.",
      },
      { property: "og:title", content: "Today's Workout — IRONLOG" },
      { property: "og:description", content: "Your split for today, ready to log set by set." },
    ],
  }),
  component: TodayPage,
});

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function TodayPage() {
  const { user } = useAuth();
  const dow = isoWeekday();
  const { data: days } = useQuery(daysQuery());
  const { data: streak } = useQuery(streakQuery(user?.id));

  const today = days?.find((d) => d.day_of_week === dow);
  const { data: exercises } = useQuery(dayExercisesQuery(today?.id));
  const { data: session } = useQuery(sessionQuery(user?.id, today?.id, todayISO()));
  const { data: sets } = useQuery(setsQuery(session?.id));

  const targetSets = exercises?.reduce((n, e) => n + e.target_sets, 0) ?? 0;
  const doneSets = sets?.filter((s) => s.completed).length ?? 0;
  const pct = targetSets ? Math.min(100, Math.round((doneSets / targetSets) * 100)) : 0;

  return (
    <main className="screen-pad pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="label-caps">{WEEKDAYS[dow - 1]}</p>
          <h1 className="font-display text-5xl leading-none">Today</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1.5">
          <Flame className="h-4 w-4 text-accent" />
          <span className="font-mono text-sm font-bold">{streak ?? 0}</span>
          <span className="label-caps">day streak</span>
        </div>
      </header>

      {!today ? (
        <section className="surface mt-6 p-6 text-center">
          <h2 className="font-display text-3xl">Rest day</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing scheduled today. Pick any day below if you want to train anyway.
          </p>
        </section>
      ) : (
        <section className="surface glow-primary mt-6 p-5">
          <p className="label-caps">Scheduled</p>
          <h2 className="font-display text-4xl leading-none">{today.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {exercises?.length ?? 0} exercises · {targetSets} sets
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-mono">
                {doneSets}/{targetSets}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          <Link
            to="/workout/$dayId"
            params={{ dayId: today.id }}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold uppercase tracking-wide text-primary-foreground"
          >
            <Play className="h-5 w-5" />
            {doneSets > 0 ? "Continue workout" : "Start workout"}
          </Link>
        </section>
      )}

      <h2 className="mt-8 font-display text-2xl">Your split</h2>
      <ul className="mt-3 space-y-2">
        {days?.map((d) => (
          <li key={d.id}>
            <Link
              to="/workout/$dayId"
              params={{ dayId: d.id }}
              className="surface flex items-center justify-between p-4"
            >
              <div>
                <p className="label-caps">{d.day_of_week ? WEEKDAYS[d.day_of_week - 1] : "Flexible"}</p>
                <p className="font-display text-2xl leading-tight">{d.name}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
