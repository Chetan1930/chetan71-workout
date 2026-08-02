import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Repeat2, Timer, TrendingUp } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IRONLOG — Gym Workout Tracker Built for the Gym Floor" },
      {
        name: "description",
        content:
          "Open the app, see today's workout, log weight and reps set by set, rest on a timer and swap any busy machine for the closest alternative.",
      },
      { property: "og:title", content: "IRONLOG — Gym Workout Tracker" },
      {
        property: "og:description",
        content:
          "Today's split, one exercise at a time. Log sets, track overload, replace exercises intelligently.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Dumbbell, title: "One exercise at a time", body: "No scrolling. Current lift, current set, next." },
  { icon: Timer, title: "Rest timer that drives you", body: "60/90/120/180 or custom, auto-advances your set." },
  { icon: Repeat2, title: "Smart replacements", body: "Machine taken? Get ranked alternatives you can actually do." },
  { icon: TrendingUp, title: "Progressive overload", body: "Last session's numbers and a suggested jump." },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/today", replace: true });
  }, [loading, user, navigate]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 py-12">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
          <Dumbbell className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="font-display text-3xl leading-none">IRONLOG</span>
      </div>

      <h1 className="mt-12 font-display text-6xl leading-[0.9]">
        Today&apos;s workout.
        <br />
        <span className="text-primary">Nothing else.</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        A workout tracker for people who are already in the gym. Pick the day, work through the
        exercises, log every set.
      </p>

      <Button className="mt-8 h-14 w-full text-base" onClick={() => navigate({ to: "/auth" })}>
        Start training <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <ul className="mt-10 space-y-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="surface flex gap-3 p-4">
            <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-xl leading-tight">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
