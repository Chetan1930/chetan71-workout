import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { equipmentQuery, userEquipmentQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Equipment — IRONLOG" },
      {
        name: "description",
        content: "Tell IRONLOG which equipment you have so exercise replacements match your gym.",
      },
      { property: "og:title", content: "Settings & Equipment — IRONLOG" },
      { property: "og:description", content: "Equipment availability powers smarter swaps." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: equipment } = useQuery(equipmentQuery());
  const { data: mine } = useQuery(userEquipmentQuery(user?.id));
  const availability = new Map(mine?.map((m) => [m.equipment_id, m.available]));

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_equipment")
        .upsert({ user_id: user.id, equipment_id: id, available: value }, {
          onConflict: "user_id,equipment_id",
        });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-equipment", user?.id] }),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="screen-pad pt-8">
      <h1 className="font-display text-5xl leading-none">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>

      <h2 className="mt-8 font-display text-2xl">Available equipment</h2>
      <p className="text-sm text-muted-foreground">
        Replacements are ranked against what you can actually use.
      </p>
      <ul className="mt-3 space-y-2">
        {equipment?.map((e) => (
          <li key={e.id} className="surface flex items-center justify-between p-4">
            <span className="text-sm font-semibold">{e.name}</span>
            <Switch
              checked={availability.get(e.id) ?? false}
              onCheckedChange={(value) => toggle.mutate({ id: e.id, value })}
            />
          </li>
        ))}
      </ul>

      <Button variant="outline" className="mt-8 h-12 w-full" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </main>
  );
}
