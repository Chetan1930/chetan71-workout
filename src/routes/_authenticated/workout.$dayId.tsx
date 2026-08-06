import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Flag,
  Info,
  Loader2,
  Minus,
  Plus,
  Repeat2,
  Timer as TimerIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ExerciseVisual } from "@/components/exercise-visual";
import { ReplaceExerciseSheet } from "@/components/replace-exercise-sheet";
import { RestTimer } from "@/components/rest-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  dayExercisesQuery,
  daysQuery,
  ensureSession,
  equipmentQuery,
  overloadSuggestion,
  previousPerformanceQuery,
  setsQuery,
  substitutionsQuery,
  todayISO,
  userEquipmentQuery,
  type FullExercise,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/workout/$dayId")({
  head: () => ({
    meta: [
      { title: "Workout — IRONLOG" },
      {
        name: "description",
        content:
          "Work through today's exercises one at a time, logging weight, reps and RIR per set.",
      },
      { property: "og:title", content: "Workout — IRONLOG" },
      {
        property: "og:description",
        content: "Log every set with a rest timer and smart exercise swaps.",
      },
    ],
  }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { dayId } = useParams({ from: "/_authenticated/workout/$dayId" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: days } = useQuery(daysQuery());
  const day = days?.find((d) => d.id === dayId);
  const { data: dayExercises, isLoading } = useQuery(dayExercisesQuery(dayId));
  const { data: allEquipment } = useQuery(equipmentQuery());
  const { data: userEquipment } = useQuery(userEquipmentQuery(user?.id));

  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id || !dayId) return;
    ensureSession(user.id, dayId, todayISO())
      .then((s) => setSessionId(s.id))
      .catch((e) => toast.error(e.message));
  }, [user?.id, dayId]);

  const { data: sets } = useQuery(setsQuery(sessionId ?? undefined));
  const { data: subs } = useQuery(substitutionsQuery(sessionId ?? undefined));

  const [index, setIndex] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rir, setRir] = useState("2");
  const [note, setNote] = useState("");

  const current = dayExercises?.[index];
  const substitution = subs?.find((s) => s.workout_exercise_id === current?.id);
  const exercise: FullExercise | undefined = substitution?.replacement ?? current?.exercise;

  const { data: previous } = useQuery(previousPerformanceQuery(exercise?.id));
  const suggestion = useMemo(
    () => (previous ? overloadSuggestion(previous, current?.target_reps ?? "8-12") : null),
    [previous, current?.target_reps],
  );

  const exerciseSets = sets?.filter((s) => s.exercise_id === exercise?.id) ?? [];
  const doneForExercise = exerciseSets.filter((s) => s.completed).length;
  const setNumber = Math.min(doneForExercise + 1, current?.target_sets ?? 1);

  useEffect(() => {
    if (!suggestion) {
      setWeight("");
      setReps("");
      return;
    }
    setWeight(String(suggestion.weight));
    setReps(String(suggestion.reps));
  }, [suggestion, exercise?.id]);

  const totalTarget = dayExercises?.reduce((n, e) => n + e.target_sets, 0) ?? 0;
  const totalDone = sets?.filter((s) => s.completed).length ?? 0;

  const availableSlugs = useMemo(() => {
    if (!userEquipment?.length || !allEquipment) return null;
    const available = new Set(userEquipment.filter((e) => e.available).map((e) => e.equipment_id));
    if (available.size === 0) return null;
    return allEquipment.filter((e) => available.has(e.id)).map((e) => e.slug);
  }, [userEquipment, allEquipment]);

  const saveSet = useMutation({
    mutationFn: async () => {
      if (!sessionId || !user?.id || !exercise) throw new Error("Session not ready");
      const { error } = await supabase.from("workout_sets").upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          exercise_id: exercise.id,
          set_number: setNumber,
          weight: weight ? Number(weight) : null,
          reps: reps ? Number(reps) : null,
          rir: rir ? Number(rir) : null,
          completed: true,
          notes: note || null,
        },
        { onConflict: "session_id,exercise_id,set_number" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sets", sessionId] });
      setNote("");
      setShowTimer(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replace = useMutation({
    mutationFn: async (replacementId: string) => {
      if (!sessionId || !user?.id || !current) throw new Error("Session not ready");
      const { error } = await supabase.from("session_substitutions").upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          workout_exercise_id: current.id,
          replacement_exercise_id: replacementId,
        },
        { onConflict: "session_id,workout_exercise_id" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["substitutions", sessionId] });
      setReplaceOpen(false);
      toast.success("Exercise swapped for this session");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finish = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("Session not ready");
      const { error } = await supabase
        .from("workout_sessions")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["streak"] });
      navigate({ to: "/summary/$sessionId", params: { sessionId: sessionId! } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onTimerFinished() {
    setShowTimer(false);
    if (
      doneForExercise >= (current?.target_sets ?? 1) &&
      dayExercises &&
      index < dayExercises.length - 1
    ) {
      setIndex((i) => i + 1);
      toast.info("Next exercise");
    }
  }

  if (isLoading || !current || !exercise) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const stepper = (
    value: string,
    setValue: (v: string) => void,
    step: number,
    label: string,
    unit?: string,
  ) => (
    <div className="flex-1">
      <p className="label-caps mb-1.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="icon"
          className="h-14 w-12 shrink-0"
          onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - step)))}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
            className="h-14 w-full rounded-xl border border-input bg-elevated text-center font-mono text-2xl font-bold text-foreground outline-none focus:border-primary"
          />
          {unit && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="h-14 w-12 shrink-0"
          onClick={() => setValue(String((Number(value) || 0) + step))}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <main className="screen-pad pt-6">
      <div className="flex items-center justify-between">
        <Link to="/today" className="flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> {day?.name ?? "Workout"}
        </Link>
        <span className="font-mono text-sm text-muted-foreground">
          {index + 1}/{dayExercises?.length}
        </span>
      </div>

      <div className="mt-3">
        <Progress value={totalTarget ? (totalDone / totalTarget) * 100 : 0} className="h-2" />
        <p className="mt-1 text-right font-mono text-xs text-muted-foreground">
          {totalDone}/{totalTarget} sets
        </p>
      </div>

      <ExerciseVisual
        name={exercise.name}
        gifUrl={exercise.gif_url}
        imageUrl={exercise.image_url}
        muscle={exercise.primary_muscle?.name}
        className="mt-4 h-52"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          className="h-12"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button
          variant="secondary"
          className="h-12"
          disabled={!dayExercises || index >= dayExercises.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-4xl leading-none">{exercise.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge>{exercise.primary_muscle?.name}</Badge>
            {exercise.secondary.slice(0, 2).map((s) => (
              <Badge key={s.muscle?.id} variant="secondary">
                {s.muscle?.name}
              </Badge>
            ))}
            <Badge variant="secondary">{exercise.equipment?.name}</Badge>
          </div>
        </div>
        <Link
          to="/exercise/$slug"
          params={{ slug: exercise.slug }}
          className="rounded-full bg-elevated p-2.5"
          aria-label="Exercise details"
        >
          <Info className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {substitution && (
        <p className="mt-2 text-xs text-accent">Swapped in for {current.exercise.name} today.</p>
      )}

      <div className="surface mt-4 flex items-center justify-between p-3">
        <div>
          <p className="label-caps">Set</p>
          <p className="font-mono text-2xl font-bold">
            {setNumber}
            <span className="text-muted-foreground">/{current.target_sets}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="label-caps">Target reps</p>
          <p className="font-mono text-2xl font-bold">{current.target_reps}</p>
        </div>
      </div>

      {suggestion ? (
        <div className="surface mt-3 p-3">
          <p className="label-caps">Last time ({suggestion.lastDate})</p>
          <p className="text-sm">
            <span className="font-mono font-bold">{suggestion.lastWeight}</span> kg ×{" "}
            <span className="font-mono font-bold">{suggestion.lastReps}</span> reps
            {suggestion.hitTarget ? (
              <span className="text-primary"> — hit the top of the range, add load.</span>
            ) : (
              <span className="text-muted-foreground"> — chase one more rep.</span>
            )}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          First time logging this lift — today&apos;s numbers become your baseline.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {stepper(weight, setWeight, 2.5, "Weight", "kg")}
        {stepper(reps, setReps, 1, "Reps")}
      </div>

      <div className="mt-3">
        <p className="label-caps mb-1.5">Reps in reserve</p>
        <div className="grid grid-cols-5 gap-1.5">
          {["0", "1", "2", "3", "4"].map((v) => (
            <Button
              key={v}
              variant={rir === v ? "default" : "secondary"}
              className="h-11"
              onClick={() => setRir(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <Textarea
        placeholder="Notes for this set (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mt-3 bg-elevated"
        rows={2}
      />

      <Button
        className="mt-4 h-16 w-full text-lg"
        disabled={saveSet.isPending || !sessionId}
        onClick={() => saveSet.mutate()}
      >
        {saveSet.isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Check className="mr-2 h-6 w-6" />
        )}
        Complete set {setNumber}
      </Button>

      {exerciseSets.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {exerciseSets.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-elevated px-3 py-2 text-sm"
            >
              <span className="label-caps">Set {s.set_number}</span>
              <span className="font-mono">
                {s.weight ?? 0} kg × {s.reps ?? 0} · RIR {s.rir ?? "-"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="h-12" onClick={() => setShowTimer(true)}>
          <TimerIcon className="mr-2 h-4 w-4" /> Rest
        </Button>
        <Button variant="secondary" className="h-12" onClick={() => setReplaceOpen(true)}>
          <Repeat2 className="mr-2 h-4 w-4" /> Replace
        </Button>
      </div>

      {showTimer && (
        <div className="mt-3">
          <RestTimer
            defaultSeconds={current.rest_seconds}
            onFinished={onTimerFinished}
            onClose={() => setShowTimer(false)}
          />
        </div>
      )}

      <Button
        variant="outline"
        className="mt-4 h-12 w-full"
        onClick={() => finish.mutate()}
        disabled={finish.isPending}
      >
        <Flag className="mr-2 h-4 w-4" /> Finish workout
      </Button>

      <ReplaceExerciseSheet
        exercise={exercise}
        equipmentSlugs={availableSlugs}
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        onPick={(id) => replace.mutate(id)}
        picking={replace.isPending}
      />
    </main>
  );
}
