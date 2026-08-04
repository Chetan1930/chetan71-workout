import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminExercisesQuery,
  equipmentQuery,
  isAdminQuery,
  movementPatternsQuery,
  muscleGroupsQuery,
  type FullExercise,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin — IRONLOG" }],
  }),
  component: AdminPage,
});

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useQuery(isAdminQuery(user?.id));

  useEffect(() => {
    if (!loading && !adminLoading && isAdmin === false) {
      navigate({ to: "/today", replace: true });
    }
  }, [loading, adminLoading, isAdmin, navigate]);

  if (loading || adminLoading || !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="screen-pad pt-8 pb-24">
      <h1 className="font-display text-5xl leading-none">Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage exercises and the reference data that drives the replacement engine.
      </p>

      <Tabs defaultValue="exercises" className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="muscles">Muscles</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>
        <TabsContent value="exercises" className="mt-4">
          <ExercisesTab />
        </TabsContent>
        <TabsContent value="equipment" className="mt-4">
          <EquipmentTab />
        </TabsContent>
        <TabsContent value="muscles" className="mt-4">
          <MuscleGroupsTab />
        </TabsContent>
        <TabsContent value="patterns" className="mt-4">
          <MovementPatternsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}

type ExerciseForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  primary_muscle_id: string;
  equipment_id: string;
  movement_pattern_id: string;
  difficulty: number;
  fatigue_score: number;
  stability_requirement: number;
  image_url: string;
  gif_url: string;
  video_url: string;
  instructions: string;
  tips: string;
  common_mistakes: string;
  is_active: boolean;
};

const EMPTY_EXERCISE_FORM: ExerciseForm = {
  name: "",
  slug: "",
  description: "",
  primary_muscle_id: "",
  equipment_id: "",
  movement_pattern_id: "",
  difficulty: 2,
  fatigue_score: 5,
  stability_requirement: 3,
  image_url: "",
  gif_url: "",
  video_url: "",
  instructions: "",
  tips: "",
  common_mistakes: "",
  is_active: true,
};

function exerciseToForm(ex: FullExercise): ExerciseForm {
  return {
    id: ex.id,
    name: ex.name,
    slug: ex.slug,
    description: ex.description ?? "",
    primary_muscle_id: ex.primary_muscle_id,
    equipment_id: ex.equipment_id ?? "",
    movement_pattern_id: ex.movement_pattern_id ?? "",
    difficulty: ex.difficulty,
    fatigue_score: ex.fatigue_score,
    stability_requirement: ex.stability_requirement,
    image_url: ex.image_url ?? "",
    gif_url: ex.gif_url ?? "",
    video_url: ex.video_url ?? "",
    instructions: ex.instructions.join("\n"),
    tips: ex.tips.join("\n"),
    common_mistakes: ex.common_mistakes.join("\n"),
    is_active: ex.is_active,
  };
}

function linesToArray(s: string): string[] {
  return s
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function ExercisesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExerciseForm>(EMPTY_EXERCISE_FORM);

  const { data: exercises } = useQuery(adminExercisesQuery(search));
  const { data: muscles } = useQuery(muscleGroupsQuery());
  const { data: equipment } = useQuery(equipmentQuery());
  const { data: patterns } = useQuery(movementPatternsQuery());

  const save = useMutation({
    mutationFn: async (f: ExerciseForm) => {
      const payload = {
        name: f.name.trim(),
        slug: f.slug.trim() || slugify(f.name),
        description: f.description.trim() || null,
        primary_muscle_id: f.primary_muscle_id,
        equipment_id: f.equipment_id || null,
        movement_pattern_id: f.movement_pattern_id || null,
        difficulty: f.difficulty,
        fatigue_score: f.fatigue_score,
        stability_requirement: f.stability_requirement,
        image_url: f.image_url.trim() || null,
        gif_url: f.gif_url.trim() || null,
        video_url: f.video_url.trim() || null,
        instructions: linesToArray(f.instructions),
        tips: linesToArray(f.tips),
        common_mistakes: linesToArray(f.common_mistakes),
        is_active: f.is_active,
      };
      const { error } = f.id
        ? await supabase.from("exercises").update(payload).eq("id", f.id)
        : await supabase.from("exercises").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exercises"] });
      qc.invalidateQueries({ queryKey: ["exercise-library"] });
      toast.success(form.id ? "Exercise updated" : "Exercise added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd() {
    setForm(EMPTY_EXERCISE_FORM);
    setOpen(true);
  }

  function openEdit(ex: FullExercise) {
    setForm(exerciseToForm(ex));
    setOpen(true);
  }

  const canSubmit = form.name.trim().length > 0 && form.primary_muscle_id.length > 0;

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Search exercises"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 shrink-0" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit exercise" : "Add exercise"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.id ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Primary muscle</Label>
                <Select
                  value={form.primary_muscle_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, primary_muscle_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a muscle" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscles?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Equipment</Label>
                <Select
                  value={form.equipment_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, equipment_id: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {equipment?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Movement pattern</Label>
                <Select
                  value={form.movement_pattern_id || "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, movement_pattern_id: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {patterns?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Difficulty (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fatigue (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.fatigue_score}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fatigue_score: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Stability (1-5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={form.stability_requirement}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stability_requirement: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>GIF URL</Label>
                <Input
                  value={form.gif_url}
                  onChange={(e) => setForm((f) => ({ ...f, gif_url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Video URL</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Instructions (one per line)</Label>
                <Textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tips (one per line)</Label>
                <Textarea
                  rows={2}
                  value={form.tips}
                  onChange={(e) => setForm((f) => ({ ...f, tips: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Common mistakes (one per line)</Label>
                <Textarea
                  rows={2}
                  value={form.common_mistakes}
                  onChange={(e) => setForm((f) => ({ ...f, common_mistakes: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
              </div>

              <Button
                className="h-12 w-full"
                disabled={!canSubmit || save.isPending}
                onClick={() => save.mutate(form)}
              >
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.id ? "Save changes" : "Add exercise"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ul className="mt-4 space-y-2">
        {exercises?.map((ex) => (
          <li
            key={ex.id}
            className="surface flex items-center justify-between gap-3 p-3"
            role="button"
            onClick={() => openEdit(ex)}
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-tight">{ex.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="secondary">{ex.primary_muscle?.name}</Badge>
                {ex.equipment && <Badge variant="secondary">{ex.equipment.name}</Badge>}
                {!ex.is_active && <Badge variant="outline">Inactive</Badge>}
              </div>
            </div>
            <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EquipmentTab() {
  const qc = useQueryClient();
  const { data: equipment } = useQuery(equipmentQuery());
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("equipment")
        .insert({ name: name.trim(), slug: slugify(name), category: category.trim() || "other" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment added");
      setName("");
      setCategory("other");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="surface space-y-3 p-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Trap Bar"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <Button
          className="h-11 w-full"
          disabled={!name.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" /> Add equipment
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {equipment?.map((e) => (
          <li key={e.id}>
            <Badge variant="secondary">{e.name}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MuscleGroupsTab() {
  const qc = useQueryClient();
  const { data: muscles } = useQuery(muscleGroupsQuery());
  const [name, setName] = useState("");
  const [region, setRegion] = useState("other");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("muscle_groups")
        .insert({ name: name.trim(), slug: slugify(name), region: region.trim() || "other" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["muscle-groups"] });
      toast.success("Muscle group added");
      setName("");
      setRegion("other");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="surface space-y-3 p-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Obliques"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Region</Label>
          <Input value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <Button
          className="h-11 w-full"
          disabled={!name.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" /> Add muscle group
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {muscles?.map((m) => (
          <li key={m.id}>
            <Badge variant="secondary">{m.name}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MovementPatternsTab() {
  const qc = useQueryClient();
  const { data: patterns } = useQuery(movementPatternsQuery());
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tips, setTips] = useState("");
  const [mistakes, setMistakes] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("movement_patterns").insert({
        name: name.trim(),
        slug: slugify(name),
        default_instructions: linesToArray(instructions),
        default_tips: linesToArray(tips),
        default_mistakes: linesToArray(mistakes),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movement-patterns"] });
      toast.success("Movement pattern added");
      setName("");
      setInstructions("");
      setTips("");
      setMistakes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="surface space-y-3 p-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anti-Rotation"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Default instructions (one per line)</Label>
          <Textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Default tips (one per line)</Label>
          <Textarea rows={2} value={tips} onChange={(e) => setTips(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default mistakes (one per line)</Label>
          <Textarea rows={2} value={mistakes} onChange={(e) => setMistakes(e.target.value)} />
        </div>
        <Button
          className="h-11 w-full"
          disabled={!name.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1 h-4 w-4" /> Add movement pattern
        </Button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {patterns?.map((p) => (
          <li key={p.id}>
            <Badge variant="secondary">{p.name}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
