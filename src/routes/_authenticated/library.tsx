import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";

import { ExerciseVisual } from "@/components/exercise-visual";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { exerciseLibraryQuery, favoritesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Exercise Library — IRONLOG" },
      {
        name: "description",
        content: "Search every exercise in your database, favourite the ones you use and open full details.",
      },
      { property: "og:title", content: "Exercise Library — IRONLOG" },
      { property: "og:description", content: "Search, favourite and study every lift in your plan." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [search, setSearch] = useState("");
  const [onlyFavs, setOnlyFavs] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: exercises } = useQuery(exerciseLibraryQuery(search));
  const { data: favs } = useQuery(favoritesQuery(user?.id));
  const favIds = new Set(favs?.map((f) => f.exercise_id));

  const toggleFav = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!user?.id) return;
      if (favIds.has(exerciseId)) {
        await supabase
          .from("favorite_exercises")
          .delete()
          .eq("user_id", user.id)
          .eq("exercise_id", exerciseId);
      } else {
        await supabase
          .from("favorite_exercises")
          .insert({ user_id: user.id, exercise_id: exerciseId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites", user?.id] }),
  });

  const list = (exercises ?? []).filter((e) => (onlyFavs ? favIds.has(e.id) : true));

  return (
    <main className="screen-pad pt-8">
      <h1 className="font-display text-5xl leading-none">Library</h1>
      <Input
        placeholder="Search exercises"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 h-12"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setOnlyFavs(false)}
          className={`rounded-full px-4 py-2 text-sm ${!onlyFavs ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}
        >
          All
        </button>
        <button
          onClick={() => setOnlyFavs(true)}
          className={`rounded-full px-4 py-2 text-sm ${onlyFavs ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}
        >
          Favourites
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {list.map((ex) => (
          <li key={ex.id} className="surface flex items-center gap-3 p-3">
            <ExerciseVisual
              name={ex.name}
              gifUrl={ex.gif_url}
              imageUrl={ex.image_url}
              muscle={ex.primary_muscle?.name}
              className="h-16 w-16 shrink-0"
            />
            <Link to="/exercise/$slug" params={{ slug: ex.slug }} className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight">{ex.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="secondary">{ex.primary_muscle?.name}</Badge>
                <Badge variant="secondary">{ex.equipment?.name}</Badge>
              </div>
            </Link>
            <button
              onClick={() => toggleFav.mutate(ex.id)}
              aria-label="Toggle favourite"
              className="p-2"
            >
              <Star
                className={`h-5 w-5 ${favIds.has(ex.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
