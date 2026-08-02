import { useQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { isAdminQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin } = useQuery(isAdminQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-lg bg-background">
      <Outlet />
      <BottomNav isAdmin={Boolean(isAdmin)} />
    </div>
  );
}
