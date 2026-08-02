import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";

import { ExerciseVisual } from "@/components/exercise-visual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { alternativesQuery, type FullExercise } from "@/lib/queries";

type Props = {
  exercise: FullExercise;
  equipmentSlugs: string[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (exerciseId: string) => void;
  picking?: boolean;
};

export function ReplaceExerciseSheet({
  exercise,
  equipmentSlugs,
  open,
  onOpenChange,
  onPick,
  picking,
}: Props) {
  const { data, isLoading } = useQuery({
    ...alternativesQuery(exercise.id, equipmentSlugs),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border"
      >
        <SheetHeader className="px-0 text-left">
          <SheetTitle className="font-display text-2xl">Replace {exercise.name}</SheetTitle>
          <SheetDescription>
            Ranked by movement pattern, muscles worked, equipment and fatigue cost
            {equipmentSlugs ? " — filtered to the equipment you marked available." : "."}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No alternatives match your available equipment. Enable more equipment in Settings.
          </p>
        ) : (
          <ul className="space-y-3 pb-6">
            {data.map((alt) => (
              <li key={alt.id} className="surface p-3">
                <div className="flex gap-3">
                  <ExerciseVisual
                    name={alt.name}
                    gifUrl={alt.gif_url}
                    imageUrl={alt.image_url}
                    muscle={alt.primary_muscle}
                    className="h-20 w-20 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-xl leading-tight">{alt.name}</h3>
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 font-mono text-sm font-bold text-primary-foreground">
                        {alt.similarity}%
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary">{alt.primary_muscle}</Badge>
                      <Badge variant="secondary">{alt.equipment ?? "Any"}</Badge>
                      <Badge variant="secondary">Difficulty {alt.difficulty}/5</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{alt.reason}</p>
                  </div>
                </div>
                <Button
                  className="mt-3 h-11 w-full"
                  disabled={picking}
                  onClick={() => onPick(alt.id)}
                >
                  <Check className="mr-1 h-4 w-4" /> Use this instead
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
