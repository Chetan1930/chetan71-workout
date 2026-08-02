import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";

import { ExerciseVisual } from "@/components/exercise-visual";
import { Badge } from "@/components/ui/badge";
import { exerciseBySlugQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/exercise/$slug")({
  head: () => ({
    meta: [
      { title: "Exercise Detail — IRONLOG" },
      {
        name: "description",
        content: "Instructions, cues, common mistakes, muscles worked and equipment for this exercise.",
      },
      { property: "og:title", content: "Exercise Detail — IRONLOG" },
      { property: "og:description", content: "How to perform the lift, and what it trains." },
    ],
  }),
  component: ExerciseDetail,
});

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="surface mt-3 p-4">
      <h2 className="font-display text-xl">{title}</h2>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">—</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseDetail() {
  const { slug } = useParams({ from: "/_authenticated/exercise/$slug" });
  const { data: ex, isLoading } = useQuery(exerciseBySlugQuery(slug));

  if (isLoading || !ex) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const pattern = ex.movement_pattern;
  const instructions = ex.instructions.length ? ex.instructions : (pattern?.default_instructions ?? []);
  const tips = ex.tips.length ? ex.tips : (pattern?.default_tips ?? []);
  const mistakes = ex.common_mistakes.length ? ex.common_mistakes : (pattern?.default_mistakes ?? []);

  return (
    <main className="screen-pad pt-6">
      <Link to="/library" className="flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Library
      </Link>

      <ExerciseVisual
        name={ex.name}
        gifUrl={ex.gif_url}
        imageUrl={ex.image_url}
        muscle={ex.primary_muscle?.name}
        className="mt-4 h-56"
      />

      <h1 className="mt-4 font-display text-4xl leading-none">{ex.name}</h1>
      {ex.description && <p className="mt-2 text-sm text-muted-foreground">{ex.description}</p>}

      <div className="mt-3 flex flex-wrap gap-1">
        <Badge>{ex.primary_muscle?.name}</Badge>
        {ex.secondary.map((s) => (
          <Badge key={s.muscle?.id} variant="secondary">
            {s.muscle?.name}
          </Badge>
        ))}
      </div>

      <div className="surface mt-4 grid grid-cols-3 divide-x divide-border p-3 text-center">
        <div>
          <p className="label-caps">Equipment</p>
          <p className="text-sm font-semibold">{ex.equipment?.name ?? "Any"}</p>
        </div>
        <div>
          <p className="label-caps">Difficulty</p>
          <p className="font-mono text-sm font-bold">{ex.difficulty}/5</p>
        </div>
        <div>
          <p className="label-caps">Fatigue</p>
          <p className="font-mono text-sm font-bold">{ex.fatigue_score}/10</p>
        </div>
      </div>

      {pattern && (
        <p className="mt-3 text-xs text-muted-foreground">
          Movement pattern: <span className="text-foreground">{pattern.name}</span>
        </p>
      )}

      <Section title="Instructions" items={instructions} />
      <Section title="Tips" items={tips} />
      <Section title="Common mistakes" items={mistakes} />

      {ex.video_url && (
        <a
          href={ex.video_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-sm text-primary underline"
        >
          Watch video demonstration
        </a>
      )}
    </main>
  );
}
