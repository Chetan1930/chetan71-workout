import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const EXERCISE_SELECT = `
  id, name, slug, description, difficulty, fatigue_score, stability_requirement,
  gif_url, image_url, video_url, instructions, tips, common_mistakes, is_active,
  primary_muscle_id, equipment_id, movement_pattern_id,
  primary_muscle:muscle_groups!exercises_primary_muscle_id_fkey(id, name, slug),
  equipment:equipment(id, name, slug, category),
  movement_pattern:movement_patterns(id, name, slug, default_instructions, default_tips, default_mistakes),
  secondary:exercise_secondary_muscles(muscle:muscle_groups(id, name, slug))
`;

export type MuscleRef = { id: string; name: string; slug: string };

export type FullExercise = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  difficulty: number;
  fatigue_score: number;
  stability_requirement: number;
  gif_url: string | null;
  image_url: string | null;
  video_url: string | null;
  instructions: string[];
  tips: string[];
  common_mistakes: string[];
  is_active: boolean;
  primary_muscle_id: string;
  equipment_id: string | null;
  movement_pattern_id: string | null;
  primary_muscle: MuscleRef | null;
  equipment: { id: string; name: string; slug: string; category: string } | null;
  movement_pattern: {
    id: string;
    name: string;
    slug: string;
    default_instructions: string[];
    default_tips: string[];
    default_mistakes: string[];
  } | null;
  secondary: { muscle: MuscleRef | null }[];
};

export type DayExercise = {
  id: string;
  order_index: number;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
  notes: string | null;
  is_active: boolean;
  exercise: FullExercise;
};

export type WorkoutDay = {
  id: string;
  name: string;
  day_of_week: number | null;
  order_index: number;
  is_rest_day: boolean;
  is_active: boolean;
  plan_id: string;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** ISO weekday: Monday = 1 ... Sunday = 7 */
export function isoWeekday(date = new Date()): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const daysQuery = () =>
  queryOptions({
    queryKey: ["workout-days"],
    queryFn: async (): Promise<WorkoutDay[]> =>
      unwrap(
        await supabase
          .from("workout_days")
          .select("id, name, day_of_week, order_index, is_rest_day, is_active, plan_id")
          .eq("is_active", true)
          .order("order_index"),
      ),
  });

export const dayExercisesQuery = (dayId: string | undefined) =>
  queryOptions({
    queryKey: ["day-exercises", dayId],
    enabled: Boolean(dayId),
    queryFn: async (): Promise<DayExercise[]> => {
      const rows = unwrap(
        await supabase
          .from("workout_exercises")
          .select(
            `id, order_index, target_sets, target_reps, rest_seconds, notes, is_active,
             exercise:exercises(${EXERCISE_SELECT})`,
          )
          .eq("workout_day_id", dayId!)
          .eq("is_active", true)
          .order("order_index"),
      );
      return rows as unknown as DayExercise[];
    },
  });

export const exerciseBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["exercise", slug],
    queryFn: async (): Promise<FullExercise> => {
      const row = unwrap(
        await supabase.from("exercises").select(EXERCISE_SELECT).eq("slug", slug).maybeSingle(),
      );
      if (!row) throw new Error("Exercise not found");
      return row as unknown as FullExercise;
    },
  });

export const exerciseLibraryQuery = (search: string) =>
  queryOptions({
    queryKey: ["exercise-library", search],
    queryFn: async (): Promise<FullExercise[]> => {
      let q = supabase.from("exercises").select(EXERCISE_SELECT).eq("is_active", true).order("name");
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      const rows = unwrap(await q.limit(200));
      return rows as unknown as FullExercise[];
    },
  });

export const equipmentQuery = () =>
  queryOptions({
    queryKey: ["equipment"],
    queryFn: async () =>
      unwrap(await supabase.from("equipment").select("id, name, slug, category").order("name")),
  });

export const muscleGroupsQuery = () =>
  queryOptions({
    queryKey: ["muscle-groups"],
    queryFn: async () =>
      unwrap(await supabase.from("muscle_groups").select("id, name, slug, region").order("name")),
  });

export const movementPatternsQuery = () =>
  queryOptions({
    queryKey: ["movement-patterns"],
    queryFn: async () =>
      unwrap(await supabase.from("movement_patterns").select("id, name, slug").order("name")),
  });

export const userEquipmentQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["user-equipment", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("user_equipment")
          .select("equipment_id, available")
          .eq("user_id", userId!),
      ),
  });

export const favoritesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(await supabase.from("favorite_exercises").select("exercise_id").eq("user_id", userId!)),
  });

export type AlternativeRow = {
  id: string;
  name: string;
  slug: string;
  similarity: number;
  reason: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  movement_pattern: string | null;
  difficulty: number;
  fatigue_score: number;
  gif_url: string | null;
  image_url: string | null;
};

export const alternativesQuery = (exerciseId: string, equipmentSlugs: string[] | null) =>
  queryOptions({
    queryKey: ["alternatives", exerciseId, equipmentSlugs],
    queryFn: async (): Promise<AlternativeRow[]> =>
      unwrap(
        await supabase.rpc("rank_exercise_alternatives", {
          _exercise_id: exerciseId,
          ...(equipmentSlugs ? { _equipment_slugs: equipmentSlugs } : {}),
          _limit: 5,
        }),
      ) as AlternativeRow[],
  });

export type SessionRow = {
  id: string;
  user_id: string;
  workout_day_id: string | null;
  session_date: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

export const sessionQuery = (userId: string | undefined, dayId: string | undefined, date: string) =>
  queryOptions({
    queryKey: ["session", userId, dayId, date],
    enabled: Boolean(userId && dayId),
    queryFn: async (): Promise<SessionRow | null> =>
      unwrap(
        await supabase
          .from("workout_sessions")
          .select("*")
          .eq("user_id", userId!)
          .eq("workout_day_id", dayId!)
          .eq("session_date", date)
          .maybeSingle(),
      ),
  });

export async function ensureSession(userId: string, dayId: string, date: string) {
  const existing = unwrap(
    await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("workout_day_id", dayId)
      .eq("session_date", date)
      .maybeSingle(),
  );
  if (existing) return existing as SessionRow;
  return unwrap(
    await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, workout_day_id: dayId, session_date: date })
      .select("*")
      .single(),
  ) as SessionRow;
}

export type SetRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  completed: boolean;
  notes: string | null;
};

export const setsQuery = (sessionId: string | undefined) =>
  queryOptions({
    queryKey: ["sets", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<SetRow[]> =>
      unwrap(
        await supabase
          .from("workout_sets")
          .select("id, session_id, exercise_id, set_number, weight, reps, rir, completed, notes")
          .eq("session_id", sessionId!)
          .order("set_number"),
      ),
  });

export const substitutionsQuery = (sessionId: string | undefined) =>
  queryOptions({
    queryKey: ["substitutions", sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("session_substitutions")
          .select("workout_exercise_id, replacement_exercise_id, replacement:exercises(" + EXERCISE_SELECT + ")")
          .eq("session_id", sessionId!),
      ) as unknown as {
        workout_exercise_id: string;
        replacement_exercise_id: string;
        replacement: FullExercise;
      }[],
  });

export type PreviousPerformance = {
  session_date: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
};

export const previousPerformanceQuery = (exerciseId: string | undefined) =>
  queryOptions({
    queryKey: ["previous", exerciseId],
    enabled: Boolean(exerciseId),
    queryFn: async (): Promise<PreviousPerformance[]> =>
      unwrap(
        await supabase.rpc("last_exercise_performance", { _exercise_id: exerciseId! }),
      ) as PreviousPerformance[],
  });

export const streakQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["streak", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<number> => unwrap(await supabase.rpc("workout_streak")) as number,
  });

export const historyQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["history", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap(
        await supabase
          .from("workout_sessions")
          .select("id, session_date, completed_at, notes, day:workout_days(name)")
          .eq("user_id", userId!)
          .order("session_date", { ascending: false })
          .limit(30),
      ) as unknown as {
        id: string;
        session_date: string;
        completed_at: string | null;
        notes: string | null;
        day: { name: string } | null;
      }[],
  });

export const isAdminQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["is-admin", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<boolean> => {
      const rows = unwrap(
        await supabase.from("user_roles").select("role").eq("user_id", userId!).eq("role", "admin"),
      );
      return rows.length > 0;
    },
  });

/** Suggests the next working weight from the last logged session. */
export function overloadSuggestion(prev: PreviousPerformance[], targetReps: string) {
  if (!prev.length) return null;
  const top = prev.reduce((a, b) => ((b.weight ?? 0) > (a.weight ?? 0) ? b : a));
  const upper = Number(targetReps.split("-").pop()?.replace(/\D/g, "") || 12);
  const hitTarget = (top.reps ?? 0) >= upper;
  const weight = Number(top.weight ?? 0);
  const step = weight >= 60 ? 5 : 2.5;
  return {
    weight: hitTarget ? weight + step : weight,
    reps: hitTarget ? Number(targetReps.split("-")[0]?.replace(/\D/g, "") || 8) : (top.reps ?? 0) + 1,
    hitTarget,
    lastWeight: weight,
    lastReps: top.reps ?? 0,
    lastDate: top.session_date,
  };
}
