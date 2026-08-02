import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Search, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/today", label: "Today", icon: Dumbbell },
  { to: "/library", label: "Library", icon: Search },
  { to: "/progress", label: "Progress", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

// isAdmin is accepted (and role-checked server-side via RLS) for a future admin
// page; there's no /admin route yet, so it doesn't change the rendered nav.
export function BottomNav({ isAdmin: _isAdmin }: { isAdmin: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[0.65rem] font-semibold uppercase tracking-widest transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
