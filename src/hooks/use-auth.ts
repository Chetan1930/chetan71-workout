import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

/** Subscribes to the auth session. Safe to use in multiple components. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false });
      });
      supabase.auth
        .getSession()
        .then(({ data }) => {
          setState({ session: data.session, user: data.session?.user ?? null, loading: false });
        })
        .catch((error) => {
          console.error("[useAuth] Failed to get session", error);
          setState({ session: null, user: null, loading: false });
        });
      return () => sub.subscription.unsubscribe();
    } catch (error) {
      // Supabase client construction throws when env vars are misconfigured. Fail
      // to a logged-out state instead of crashing every route via the router's
      // error boundary.
      console.error("[useAuth] Supabase client unavailable", error);
      setState({ session: null, user: null, loading: false });
      return undefined;
    }
  }, []);

  return state;
}
